import { normaliseer } from './antwoordcontrole'
import { berekenPlanning, isAanDeBeurt } from './herhaalplanning'
import type { Instellingen } from './instellingen'
import { berekenTempo, type Tempo } from './tempo'
import { dagenTussen, kalenderdag, telDagenOp } from './tijd'
import type { Leeritem, Poging } from './types'

export interface BronInfo {
  bronId: string
  /** Lokale kalenderdag van de toets, als die bekend is. */
  toetsdag: string | null
  afgerond: boolean
}

export interface Samenstelling {
  /** Generale repetitie: leeritems van een bron met een toets over 1 of 2 dagen. */
  repetitie: Leeritem[]
  herhalingen: Leeritem[]
  nieuw: Leeritem[]
  /** Geschatte duur in minuten, op het tempo van de leerling. */
  minuten: number
  /** De sessie duurt langer dan het budget, omdat een toets dat vraagt (nooit langer dan het maximum). */
  langer: boolean
  /** Een toets vraagt meer dan er vandaag in het maximum past; de rest schuift door. */
  tekort: boolean
}

/**
 * Stelt een sessie samen binnen een tijdsbudget:
 * 1. generale repetitie: in de laatste dagen vóór een toets komen alle leeritems van die bron één keer
 *    langs, verdeeld over die dagen, ook als ze nog niet aan de beurt zijn;
 * 2. herhalingen die aan de beurt zijn, de langst wachtende eerst, zolang ze in de tijd passen;
 * 3. nieuwe leeritems: voor een bron met een toets zoveel als nodig om alles uiterlijk een paar dagen
 *    vóór de toets geleerd te hebben, daarna tot het budget vol is.
 * Een toets mag de sessie laten uitlopen tot het maximum, nooit verder; wat niet past schuift door.
 * Hetzelfde woord komt maar één keer in een sessie.
 */
export function stelSessieSamen(
  leeritems: Leeritem[],
  pogingen: Poging[],
  bronnen: BronInfo[],
  vandaag: string,
  instellingen: Instellingen,
  tempo: Tempo = berekenTempo(pogingen, instellingen),
): Samenstelling {
  const bronPerId = new Map(bronnen.map((b) => [b.bronId, b]))
  const actief = leeritems.filter((i) => !bronPerId.get(i.bronId)?.afgerond)
  const planning = new Map(actief.map((i) => [i.id, berekenPlanning(i.id, pogingen, instellingen, i.bronversie)]))
  const laatstGeoefend = (item: Leeritem) =>
    pogingen
      .filter((p) => p.leeritemId === item.id && p.bronversie === item.bronversie)
      .reduce<string | null>((laatst, p) => (laatst === null || p.tijdstip > laatst ? p.tijdstip : laatst), null)

  const gekozen = new Set<string>()
  const gezienWoord = new Set<string>()
  /** Neemt een leeritem op, tenzij het er al in zit of hetzelfde woord al is gekozen. */
  const neem = (item: Leeritem) => {
    const sleutel = [item.oefenrichting.van, item.oefenrichting.naar, item.plek?.richting ?? '', normaliseer(item.vraag), normaliseer(item.toegestaneAntwoorden[0])].join('|')
    if (gekozen.has(item.id) || gezienWoord.has(sleutel)) return false
    gekozen.add(item.id)
    gezienWoord.add(sleutel)
    return true
  }

  const toetsOver = (bronId: string): number | null => {
    const toetsdag = bronPerId.get(bronId)?.toetsdag
    return toetsdag ? dagenTussen(vandaag, toetsdag) : null
  }

  const maximum = instellingen.maxSessieMinuten * 60
  // Ook een eerder ingestelde langere duur blijft binnen het maximum.
  const budget = Math.min(instellingen.sessieMinuten * 60, maximum)
  let gebruikt = 0
  let tekort = false

  // 1. Generale repetitie.
  const repetitie: Leeritem[] = []
  for (const bron of bronnen) {
    const d = toetsOver(bron.bronId)
    if (d === null || d < 1 || d > instellingen.repetitieDagen || bron.afgerond) continue
    const start = telDagenOp(bron.toetsdag!, -instellingen.repetitieDagen)
    const nodig = actief
      .filter((i) => i.bronId === bron.bronId && planning.get(i.id)!.volgendeDag !== null)
      .filter((i) => {
        const laatst = laatstGeoefend(i)
        return laatst === null || kalenderdag(laatst, instellingen.tijdzone) < start
      })
      .sort((a, b) => Number(b.toetsstof ?? false) - Number(a.toetsstof ?? false) || (laatstGeoefend(a) ?? '').localeCompare(laatstGeoefend(b) ?? ''))
    const quotum = Math.ceil(nodig.length / d)
    for (const item of nodig.slice(0, quotum)) {
      if (gebruikt + tempo.herhalingSec > maximum) {
        tekort = true
        break
      }
      if (neem(item)) {
        repetitie.push(item)
        gebruikt += tempo.herhalingSec
      }
    }
  }

  // 2. Herhalingen binnen het budget.
  const herhalingen: Leeritem[] = []
  const aanDeBeurt = actief
    .filter((i) => isAanDeBeurt(planning.get(i.id)!, vandaag))
    // Toetsstof eerst, daarna de langst wachtende.
    .sort(
      (a, b) =>
        Number(b.toetsstof ?? false) - Number(a.toetsstof ?? false) ||
        planning.get(a.id)!.volgendeDag!.localeCompare(planning.get(b.id)!.volgendeDag!),
    )
  for (const item of aanDeBeurt) {
    if (gebruikt + tempo.herhalingSec > budget) break
    if (neem(item)) {
      herhalingen.push(item)
      gebruikt += tempo.herhalingSec
    }
  }

  // 3. Nieuwe leeritems: eerst wat een toets vraagt, dan tot het budget vol is.
  const nogNieuw = actief.filter((i) => planning.get(i.id)!.volgendeDag === null)
  const nieuw: Leeritem[] = []
  const voegNieuwToe = (item: Leeritem, grens: number) => {
    if (nieuw.length >= instellingen.maxNieuwPerSessie || gebruikt + tempo.nieuwSec > grens) return false
    if (neem(item)) {
      nieuw.push(item)
      gebruikt += tempo.nieuwSec
    }
    return true
  }
  for (const bron of bronnen) {
    const d = toetsOver(bron.bronId)
    if (d === null || d < 0 || bron.afgerond) continue
    const eigen = nogNieuw.filter((i) => i.bronId === bron.bronId)
    const dagenOver = d - instellingen.toetsKlaarDagenVooraf
    const quotum = dagenOver <= 0 ? eigen.length : Math.ceil(eigen.length / dagenOver)
    for (const item of eigen.slice(0, quotum)) {
      if (!voegNieuwToe(item, maximum)) {
        tekort = true
        break
      }
    }
  }
  for (const item of nogNieuw) {
    if (!voegNieuwToe(item, budget)) break
  }

  const minuten = Math.ceil(gebruikt / 60)
  return { repetitie, herhalingen, nieuw, minuten, langer: gebruikt > budget + 30, tekort }
}

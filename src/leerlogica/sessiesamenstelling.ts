import { normaliseer } from './antwoordcontrole'
import { berekenPlanning, isAanDeBeurt } from './herhaalplanning'
import type { Instellingen } from './instellingen'
import { berekenTempo, type Tempo } from './tempo'
import { dagenTussen, kalenderdag, telDagenOp } from './tijd'
import type { Leeritem, Poging } from './types'
import { berekenVoortgang } from './voortgang'

export interface BronInfo {
  bronId: string
  /** Lokale kalenderdag van de toets, als die bekend is. */
  toetsdag: string | null
  afgerond: boolean
  /** Na de toets gekozen om te blijven onthouden: af en toe een herhaling, nooit iets nieuws. */
  onderhoud?: boolean
  /** De toets is voorbij en de reflectie moet nog: de bron doet tijdelijk niet mee. */
  wachtOpReflectie?: boolean
}

/** Zoveel herhalingen uit bronnen in onderhoud komen hooguit in één sessie, na al het andere. */
export const ONDERHOUD_PER_SESSIE = 3

const doetNietMee = (bron: BronInfo | undefined) => bron?.afgerond === true || bron?.wachtOpReflectie === true

export interface Samenstelling {
  /** Generale repetitie: leeritems van een bron met een toets over 1 of 2 dagen. */
  repetitie: Leeritem[]
  herhalingen: Leeritem[]
  nieuw: Leeritem[]
  /**
   * Leeritems die in toetsvorm komen: de hele generale repetitie, en herhalingen die al later nog
   * geweten zijn en de vorige keer niet in toetsvorm kwamen (zo wisselt het af).
   */
  toetsvorm: string[]
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
 * Hetzelfde woord komt maar één keer in een sessie. De moeilijke richting van een woordpaar of plek
 * wordt pas nieuw als de leerling de makkelijke richting een keer zelf heeft teruggehaald, behalve
 * als een toets zo dichtbij is dat dat niet meer past.
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
  const actief = leeritems.filter((i) => !doetNietMee(bronPerId.get(i.bronId)))
  const inOnderhoud = (i: Leeritem) => bronPerId.get(i.bronId)?.onderhoud === true
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
  // Bronnen in onderhoud komen pas na al het andere, en met een paar per keer.
  let onderhoud = 0
  for (const item of [...aanDeBeurt.filter((i) => !inOnderhoud(i)), ...aanDeBeurt.filter(inOnderhoud)]) {
    if (gebruikt + tempo.herhalingSec > budget) break
    if (inOnderhoud(item) && onderhoud >= ONDERHOUD_PER_SESSIE) break
    if (neem(item)) {
      herhalingen.push(item)
      gebruikt += tempo.herhalingSec
      if (inOnderhoud(item)) onderhoud++
    }
  }

  // 3. Nieuwe leeritems: eerst wat een toets vraagt, dan tot het budget vol is.
  const krap = (bronId: string) => {
    const d = toetsOver(bronId)
    return d !== null && d >= 0 && d - instellingen.toetsKlaarDagenVooraf <= 1
  }
  const nogNieuw = actief
    .filter((i) => planning.get(i.id)!.volgendeDag === null && !inOnderhoud(i))
    .filter((i) => !isMoeilijkeRichting(i) || krap(i.bronId) || makkelijkeKantOpgehaald(i, actief, pogingen))
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
    const eigen = actief.filter((i) => i.bronId === bron.bronId && planning.get(i.id)!.volgendeDag === null)
    const dagenOver = d - instellingen.toetsKlaarDagenVooraf
    const quotum = dagenOver <= 0 ? eigen.length : Math.ceil(eigen.length / dagenOver)
    // Het quotum telt alle nieuwe leeritems, ook de moeilijke richting die nog moet wachten.
    for (const item of nogNieuw.filter((i) => i.bronId === bron.bronId).slice(0, quotum)) {
      if (!voegNieuwToe(item, maximum)) {
        tekort = true
        break
      }
    }
  }
  for (const item of nogNieuw) {
    if (!voegNieuwToe(item, budget)) break
  }

  const laatstePoging = (item: Leeritem) =>
    pogingen
      .filter((p) => p.leeritemId === item.id && p.bronversie === item.bronversie)
      .reduce<Poging | null>((l, p) => (l === null || p.tijdstip > l.tijdstip ? p : l), null)
  const toetsvorm = [
    ...repetitie,
    ...herhalingen.filter(
      (i) => berekenVoortgang(i, pogingen, instellingen).status === 'later nog geweten' && !laatstePoging(i)?.toetsvorm,
    ),
  ].map((i) => i.id)

  const minuten = Math.ceil(gebruikt / 60)
  return { repetitie, herhalingen, nieuw, toetsvorm, minuten, langer: gebruikt > budget + 30, tekort }
}

/** Nederlands → vreemde taal en benoemen zijn moeilijker: de leerling moet het antwoord zelf maken. */
export function isMoeilijkeRichting(item: Leeritem): boolean {
  if (item.plek) return item.plek.richting === 'benoemen'
  return item.oefenrichting.van === 'nl' && item.oefenrichting.naar !== 'nl'
}

/**
 * Of de makkelijke richting van hetzelfde woordpaar of dezelfde plek al eens goed en zonder hulp is
 * opgehaald. Heeft het geen makkelijke richting, dan hoeft de leerling niet te wachten.
 */
function makkelijkeKantOpgehaald(item: Leeritem, leeritems: Leeritem[], pogingen: Poging[]): boolean {
  const makkelijk = leeritems.filter(
    (i) => i.bronId === item.bronId && i.woordpaarId === item.woordpaarId && !isMoeilijkeRichting(i),
  )
  if (makkelijk.length === 0) return true
  return makkelijk.some((m) =>
    pogingen.some(
      (p) =>
        p.leeritemId === m.id &&
        p.bronversie === m.bronversie &&
        p.oordeel === 'goed' &&
        p.hulp === 'vrij opgehaald' &&
        !p.antwoordZelfToegevoegd,
    ),
  )
}

/**
 * Extra oefenen als er vandaag niets meer klaarstaat: de leeritems die de leerling het minst goed kent
 * (nog aan het leren eerst), en daarbinnen die hij het langst niet zag, zolang ze in de tijd passen.
 * Omdat alleen de eerste poging per dag de herhaalplanning bepaalt, verstoort dit de planning niet.
 */
export function stelExtraSamen(
  leeritems: Leeritem[],
  pogingen: Poging[],
  bronnen: BronInfo[],
  instellingen: Instellingen,
  tempo: Tempo = berekenTempo(pogingen, instellingen),
): Leeritem[] {
  const afgerond = new Set(bronnen.filter(doetNietMee).map((b) => b.bronId))
  const rang = { 'nog aan het leren': 0, 'zelf teruggehaald': 1, 'later nog geweten': 2 } as const
  const laatst = (item: Leeritem) =>
    pogingen.filter((p) => p.leeritemId === item.id).reduce((l, p) => (p.tijdstip > l ? p.tijdstip : l), '')
  const geoefend = leeritems
    .filter((i) => !afgerond.has(i.bronId) && pogingen.some((p) => p.leeritemId === i.id && p.bronversie === i.bronversie))
    .map((i) => ({ i, r: rang[berekenVoortgang(i, pogingen, instellingen).status], l: laatst(i) }))
    .sort((a, b) => a.r - b.r || a.l.localeCompare(b.l))
  const aantal = Math.max(1, Math.floor((Math.min(instellingen.sessieMinuten, instellingen.maxSessieMinuten) * 60) / tempo.herhalingSec))
  return geoefend.slice(0, aantal).map((x) => x.i)
}

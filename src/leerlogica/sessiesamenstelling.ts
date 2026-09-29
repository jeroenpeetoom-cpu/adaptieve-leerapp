import { berekenPlanning, isAanDeBeurt } from './herhaalplanning'
import type { Instellingen } from './instellingen'
import { dagenTussen } from './tijd'
import { normaliseer } from './antwoordcontrole'
import type { Leeritem, Poging } from './types'

export interface BronInfo {
  bronId: string
  /** Lokale kalenderdag van de toets, als die bekend is. */
  toetsdag: string | null
  afgerond: boolean
}

export interface Samenstelling {
  herhalingen: Leeritem[]
  nieuw: Leeritem[]
}

/**
 * Stelt een sessie samen: eerst herhalingen die aan de beurt zijn (langst wachtend eerst),
 * daarna nieuwe leeritems als er ruimte is, of altijd bij een toets die binnenkort is.
 * Heeft een bron een toetsdatum, dan worden de nieuwe leeritems die nog over zijn gelijk verdeeld
 * over de dagen tot de toets (minstens maxNieuw, hoogstens maxNieuwMetToets per sessie).
 */
export function stelSessieSamen(
  leeritems: Leeritem[],
  pogingen: Poging[],
  bronnen: BronInfo[],
  vandaag: string,
  instellingen: Instellingen,
): Samenstelling {
  const bronPerId = new Map(bronnen.map((b) => [b.bronId, b]))
  const actief = leeritems.filter((i) => !bronPerId.get(i.bronId)?.afgerond)

  const planningen = actief.map((item) => ({
    item,
    planning: berekenPlanning(item.id, pogingen, instellingen, item.bronversie),
  }))

  const herhalingen = planningen
    .filter(({ planning }) => isAanDeBeurt(planning, vandaag))
    .sort((a, b) => a.planning.volgendeDag!.localeCompare(b.planning.volgendeDag!))
    .slice(0, instellingen.maxHerhalingen)
    .map(({ item }) => item)

  const toetsBinnenkort = (item: Leeritem) => {
    const toetsdag = bronPerId.get(item.bronId)?.toetsdag
    if (!toetsdag) return false
    const dagen = dagenTussen(vandaag, toetsdag)
    return dagen >= 0 && dagen <= instellingen.toetsVoorrangDagen
  }

  const nogNieuw = planningen.filter(({ planning }) => planning.volgendeDag === null).map(({ item }) => item)

  // Per bron met een toets in de toekomst: de resterende nieuwe leeritems gelijk verdelen over de dagen tot de toets.
  let limiet = instellingen.maxNieuw
  for (const bron of bronnen) {
    if (!bron.toetsdag || bron.afgerond) continue
    const dagen = dagenTussen(vandaag, bron.toetsdag)
    if (dagen < 0) continue
    const over = nogNieuw.filter((i) => i.bronId === bron.bronId).length
    const perDag = Math.ceil(over / Math.max(dagen, 1))
    limiet = Math.max(limiet, Math.min(perDag, instellingen.maxNieuwMetToets))
  }

  const ruimte = herhalingen.length < instellingen.maxHerhalingen
  const nieuw = nogNieuw
    .filter((item) => ruimte || toetsBinnenkort(item))
    .sort((a, b) => Number(toetsBinnenkort(b)) - Number(toetsBinnenkort(a)))
    .slice(0, limiet)

  // Hetzelfde woord (bijvoorbeeld in twee bronnen) komt maar één keer in een sessie.
  const gezien = new Set<string>()
  const uniek = (item: Leeritem) => {
    const sleutel = [item.oefenrichting.van, item.oefenrichting.naar, normaliseer(item.vraag), normaliseer(item.toegestaneAntwoorden[0])].join('|')
    if (gezien.has(sleutel)) return false
    gezien.add(sleutel)
    return true
  }
  return { herhalingen: herhalingen.filter(uniek), nieuw: nieuw.filter(uniek) }
}

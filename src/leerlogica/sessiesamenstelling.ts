import { berekenPlanning, isAanDeBeurt } from './herhaalplanning'
import type { Instellingen } from './instellingen'
import { dagenTussen } from './tijd'
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

  const ruimte = herhalingen.length < instellingen.maxHerhalingen
  const nieuw = planningen
    .filter(({ planning }) => planning.volgendeDag === null)
    .map(({ item }) => item)
    .filter((item) => ruimte || toetsBinnenkort(item))
    .sort((a, b) => Number(toetsBinnenkort(b)) - Number(toetsBinnenkort(a)))
    .slice(0, instellingen.maxNieuw)

  return { herhalingen, nieuw }
}

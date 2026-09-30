import { SOORTEN } from './plekken'
import type { Oordeel, PlekSoort } from './types'

/** Straal waarbinnen een tik goed is, als fractie van de kaartbreedte. */
export const STRAAL = Object.fromEntries(Object.entries(SOORTEN).map(([k, v]) => [k, v.straal])) as Record<PlekSoort, number>

/** Tot zoveel keer de straal is een tik "bijna". */
export const BIJNA_FACTOR = 2

export interface Punt {
  x: number
  y: number
}

const WINDRICHTINGEN = ['oosten', 'noordoosten', 'noorden', 'noordwesten', 'westen', 'zuidwesten', 'zuiden', 'zuidoosten']

/**
 * Afstand in kaartbreedtes. De posities zijn fracties van breedte en hoogte, dus de hoogte telt mee
 * met de verhouding hoogte/breedte van de kaart.
 */
function afstand(a: Punt, b: Punt, verhouding: number): number {
  return Math.hypot(b.x - a.x, (b.y - a.y) * verhouding)
}

/** De windrichting van `van` naar `naar` op de kaart (noorden is boven). */
export function windrichting(van: Punt, naar: Punt, verhouding: number): string {
  const hoek = Math.atan2(-(naar.y - van.y) * verhouding, naar.x - van.x)
  const stap = Math.round(hoek / (Math.PI / 4))
  return WINDRICHTINGEN[(stap + 8) % 8]
}

export interface Tikoordeel {
  oordeel: Exclude<Oordeel, 'niet geweten'>
  /** Bij bijna of fout: de richting waarin de plek ligt, vanaf de tik. */
  richting: string | null
}

/**
 * Beoordeelt een tik op de kaart: goed binnen de straal van de soort (een kleine cirkel bij een stad,
 * een grote bij water, gebied en land), bijna tot twee keer die straal, anders fout.
 */
export function beoordeelTik(tik: Punt, doel: Punt, soort: PlekSoort, verhouding: number): Tikoordeel {
  const d = afstand(tik, doel, verhouding)
  if (d <= STRAAL[soort]) return { oordeel: 'goed', richting: null }
  return { oordeel: d <= STRAAL[soort] * BIJNA_FACTOR ? 'bijna' : 'fout', richting: windrichting(tik, doel, verhouding) }
}

/** Waar op de kaart een plek ligt, in woorden: "in het zuidoosten van de kaart", of "in het midden". */
export function omschrijfLigging(p: Punt): string {
  const noordZuid = p.y < 0.36 ? 'noord' : p.y > 0.64 ? 'zuid' : ''
  const oostWest = p.x < 0.36 ? 'west' : p.x > 0.64 ? 'oost' : ''
  if (!noordZuid && !oostWest) return 'in het midden van de kaart'
  const richting = noordZuid && oostWest ? `${noordZuid}${oostWest === 'oost' ? 'oosten' : 'westen'}` : noordZuid ? `${noordZuid}en` : `${oostWest}en`
  return `in het ${richting} van de kaart`
}

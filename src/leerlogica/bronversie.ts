import { normaliseer } from './antwoordcontrole'

export interface WoordpaarInhoud {
  woord: string
  betekenis: string
}

/**
 * Maakt een wijziging een nieuwe bronversie? Alleen als de inhoud verandert: hoofdletters,
 * spaties en leestekens tellen niet mee (dezelfde regel als de antwoordcontrole).
 */
export function isInhoudelijkeWijziging(oud: WoordpaarInhoud, nieuw: WoordpaarInhoud): boolean {
  return normaliseer(oud.woord) !== normaliseer(nieuw.woord) || normaliseer(oud.betekenis) !== normaliseer(nieuw.betekenis)
}

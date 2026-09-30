import type { PlekSoort } from './types'

export interface Soortgegevens {
  /** Hoe de soort heet, voor bij de vraag. */
  naam: string
  meervoud: string
  emoji: string
  /** Straal waarbinnen een tik goed is, als fractie van de kaartbreedte. */
  straal: number
  /** Volgorde bij het leren: de grote dingen eerst, steden als laatste. */
  volgorde: number
}

/** De soorten plekken (CONTEXT.md). "water" is ander water, zoals meren en kanalen. */
export const SOORTEN: Record<PlekSoort, Soortgegevens> = {
  land: { naam: 'land', meervoud: 'landen', emoji: '🗺️', straal: 0.09, volgorde: 0 },
  zee: { naam: 'zee', meervoud: 'zeeën', emoji: '🌊', straal: 0.09, volgorde: 1 },
  gebied: { naam: 'gebied', meervoud: 'gebieden', emoji: '🌳', straal: 0.09, volgorde: 2 },
  gebergte: { naam: 'gebergte', meervoud: 'gebergten', emoji: '⛰️', straal: 0.09, volgorde: 3 },
  rivier: { naam: 'rivier', meervoud: 'rivieren', emoji: '🏞️', straal: 0.07, volgorde: 4 },
  water: { naam: 'ander water', meervoud: 'ander water', emoji: '💧', straal: 0.07, volgorde: 5 },
  stad: { naam: 'stad', meervoud: 'steden', emoji: '🏙️', straal: 0.035, volgorde: 6 },
}

export const PLEKSOORTEN = Object.keys(SOORTEN) as PlekSoort[]

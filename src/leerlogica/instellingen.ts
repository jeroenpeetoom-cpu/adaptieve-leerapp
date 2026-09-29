/** Productinstellingen van de leerregels. Aanpasbaar; horen bij REGELVERSIE. */
export interface Instellingen {
  /** Intervallen in dagen per fase; daarna telkens twee keer zo lang. */
  intervallen: number[]
  maxHerhalingen: number
  maxNieuw: number
  /** Een toets binnen dit aantal dagen haalt nieuwe leeritems van die bron naar voren. */
  toetsVoorrangDagen: number
  /** Tijdzone voor kalenderdagen. */
  tijdzone: string
}

export const STANDAARD_INSTELLINGEN: Instellingen = {
  intervallen: [1, 3, 7, 14, 30, 60, 120],
  maxHerhalingen: 8,
  maxNieuw: 4,
  toetsVoorrangDagen: 7,
  tijdzone: 'Europe/Amsterdam',
}

/** Interval in dagen voor een fase (vanaf 1). */
export function intervalVoorFase(fase: number, intervallen: number[]): number {
  if (fase <= intervallen.length) return intervallen[Math.max(fase, 1) - 1]
  return intervallen[intervallen.length - 1] * 2 ** (fase - intervallen.length)
}

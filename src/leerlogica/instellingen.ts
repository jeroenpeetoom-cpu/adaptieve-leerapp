/** Productinstellingen van de leerregels. Aanpasbaar; horen bij REGELVERSIE. */
export interface Instellingen {
  /** Intervallen in dagen per fase; daarna telkens twee keer zo lang. */
  intervallen: number[]
  maxHerhalingen: number
  /** Nieuwe leeritems per sessie zonder toets. */
  maxNieuw: number
  /** Bovengrens van nieuwe leeritems per sessie als ze over de dagen tot een toets verdeeld worden. */
  maxNieuwMetToets: number
  /** Een toets binnen dit aantal dagen haalt nieuwe leeritems van die bron naar voren. */
  toetsVoorrangDagen: number
  /** Tijdzone voor kalenderdagen. */
  tijdzone: string
  /** Zoveel geheugenbeelden per strategie krijgt de leerling het steuntje vanzelf te zien. */
  beeldenMetSteuntje: number
  /** Zoveel beelden zonder steuntje zijn nodig voor de strategiestap "zelf gemaakt". */
  drempelZelfGemaakt: number
}

export const STANDAARD_INSTELLINGEN: Instellingen = {
  intervallen: [1, 3, 7, 14, 30, 60, 120],
  maxHerhalingen: 8,
  maxNieuw: 4,
  maxNieuwMetToets: 10,
  toetsVoorrangDagen: 7,
  tijdzone: 'Europe/Amsterdam',
  beeldenMetSteuntje: 3,
  drempelZelfGemaakt: 3,
}

/** Interval in dagen voor een fase (vanaf 1). */
export function intervalVoorFase(fase: number, intervallen: number[]): number {
  if (fase <= intervallen.length) return intervallen[Math.max(fase, 1) - 1]
  return intervallen[intervallen.length - 1] * 2 ** (fase - intervallen.length)
}

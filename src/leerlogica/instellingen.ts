/** Productinstellingen van de leerregels. Aanpasbaar; horen bij REGELVERSIE. */
export interface Instellingen {
  /** Intervallen in dagen per fase; daarna telkens twee keer zo lang. */
  intervallen: number[]
  /** Gewenste duur van een sessie in minuten. */
  sessieMinuten: number
  /** Een sessie duurt nooit langer dan dit, ook niet voor een toets. */
  maxSessieMinuten: number
  /** Schatting van de duur van een herhaling, zolang het eigen tempo nog niet bekend is. */
  schattingHerhalingSec: number
  /** Schatting van de duur van een nieuw leeritem met leermoment. */
  schattingNieuwSec: number
  /** Een opening tussen twee pogingen langer dan dit is een pauze en telt niet mee voor het tempo. */
  pauzeGrensSec: number
  /** Nieuwe leeritems van een bron met een toets zijn uiterlijk zoveel dagen vóór de toets geleerd. */
  toetsKlaarDagenVooraf: number
  /** In zoveel dagen vóór de toets komen alle leeritems van die bron één keer langs. */
  repetitieDagen: number
  /** Veiligheidsgrens: nooit meer nieuwe leeritems in één sessie. */
  maxNieuwPerSessie: number
  /** Tijdzone voor kalenderdagen. */
  tijdzone: string
  /** Zoveel geheugenbeelden per strategie krijgt de leerling het steuntje vanzelf te zien. */
  beeldenMetSteuntje: number
  /** Zoveel beelden zonder steuntje zijn nodig voor de strategiestap "zelf gemaakt". */
  drempelZelfGemaakt: number
}

export const STANDAARD_INSTELLINGEN: Instellingen = {
  intervallen: [1, 3, 7, 14, 30, 60, 120],
  sessieMinuten: 12,
  maxSessieMinuten: 15,
  schattingHerhalingSec: 20,
  schattingNieuwSec: 90,
  pauzeGrensSec: 180,
  toetsKlaarDagenVooraf: 3,
  repetitieDagen: 2,
  maxNieuwPerSessie: 30,
  tijdzone: 'Europe/Amsterdam',
  beeldenMetSteuntje: 3,
  drempelZelfGemaakt: 3,
}

/** Interval in dagen voor een fase (vanaf 1). */
export function intervalVoorFase(fase: number, intervallen: number[]): number {
  if (fase <= intervallen.length) return intervallen[Math.max(fase, 1) - 1]
  return intervallen[intervallen.length - 1] * 2 ** (fase - intervallen.length)
}

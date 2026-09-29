import type { Strategie } from './types'
import type { Voortgangsstatus } from './voortgang'

export type Strategiestap = 'voorgedaan' | 'met hulp gemaakt' | 'zelf gemaakt' | 'zelf gekozen' | 'zelfstandig toegepast'

export const STRATEGIESTAPPEN: Strategiestap[] = [
  'voorgedaan',
  'met hulp gemaakt',
  'zelf gemaakt',
  'zelf gekozen',
  'zelfstandig toegepast',
]

export interface Strategiekeuze {
  bronId: string
  strategie: Strategie
  tijdstip: string
}

/** Een leeritem dat met een strategie geleerd is, met zijn huidige voortgangsstatus. */
export interface GeleerdMet {
  bronId: string
  strategie: Strategie
  status: Voortgangsstatus
  /** Is het beeld of de plek gemaakt met het steuntje van de app? */
  metHulp: boolean
}

/** Meer dan deze fractie van de leeritems moet later nog geweten zijn voor "zelfstandig toegepast". */
export const DREMPEL_ZELFSTANDIG_TOEGEPAST = 0.5

/**
 * Hoe ver de leerling is met één strategie. De stap is de hoogste waaraan voldaan is:
 * - voorgedaan: de strategie is gekozen, de eerste keer met uitleg;
 * - met hulp gemaakt: de leerling maakte een beeld of plek met het steuntje van de app;
 * - zelf gemaakt: de leerling maakte genoeg beelden of plekken zonder steuntje;
 * - zelf gekozen: bij een latere bron koos de leerling de strategie zelf;
 * - zelfstandig toegepast: zelf gekozen bij een latere bron, en daarna is meer dan de helft van de
 *   daarmee geleerde leeritems later nog geweten.
 * Een reflectie telt hier nooit mee; of kennis later zonder hulpmiddel blijft, meet de voortgangsstatus.
 */
export function berekenStrategiestap(
  strategie: Strategie,
  keuzes: Strategiekeuze[],
  geleerd: GeleerdMet[],
  drempelZelfGemaakt: number,
): Strategiestap | null {
  const eigen = keuzes
    .filter((k) => k.strategie === strategie)
    .sort((a, b) => a.tijdstip.localeCompare(b.tijdstip))
  const bronnen = [...new Set(eigen.map((k) => k.bronId))]
  const beelden = geleerd.filter((g) => g.strategie === strategie)
  if (bronnen.length === 0 && beelden.length === 0) return null

  const zelfGekozen = bronnen.slice(1)
  const toegepast = zelfGekozen.some((bronId) => {
    const items = beelden.filter((g) => g.bronId === bronId)
    const later = items.filter((g) => g.status === 'later nog geweten').length
    return items.length > 0 && later / items.length > DREMPEL_ZELFSTANDIG_TOEGEPAST
  })
  if (toegepast) return 'zelfstandig toegepast'
  if (zelfGekozen.length > 0) return 'zelf gekozen'
  if (beelden.filter((g) => !g.metHulp).length >= drempelZelfGemaakt) return 'zelf gemaakt'
  if (beelden.some((g) => g.metHulp)) return 'met hulp gemaakt'
  return 'voorgedaan'
}

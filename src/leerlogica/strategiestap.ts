import type { Strategie } from './types'
import type { Voortgangsstatus } from './voortgang'

export type Strategiestap = 'voorgedaan' | 'zelf gekozen' | 'zelfstandig toegepast'

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
}

/** Meer dan deze fractie van de leeritems moet later nog geweten zijn voor "zelfstandig toegepast". */
export const DREMPEL_ZELFSTANDIG_TOEGEPAST = 0.5

/**
 * Hoe ver de leerling is met één strategie:
 * - voorgedaan: de strategie is gebruikt, de eerste keer met uitleg;
 * - zelf gekozen: bij een latere bron koos de leerling de strategie zelf;
 * - zelfstandig toegepast: zelf gekozen bij een latere bron, en daarna is meer dan de helft van de
 *   daarmee geleerde leeritems later nog geweten.
 * Een reflectie telt hier nooit mee.
 */
export function berekenStrategiestap(
  strategie: Strategie,
  keuzes: Strategiekeuze[],
  geleerd: GeleerdMet[],
): Strategiestap | null {
  const eigen = keuzes
    .filter((k) => k.strategie === strategie)
    .sort((a, b) => a.tijdstip.localeCompare(b.tijdstip))
  const bronnen = [...new Set(eigen.map((k) => k.bronId))]
  if (bronnen.length === 0) return null
  const zelfGekozen = bronnen.slice(1)
  if (zelfGekozen.length === 0) return 'voorgedaan'

  const toegepast = zelfGekozen.some((bronId) => {
    const items = geleerd.filter((g) => g.bronId === bronId && g.strategie === strategie)
    const later = items.filter((g) => g.status === 'later nog geweten').length
    return items.length > 0 && later / items.length > DREMPEL_ZELFSTANDIG_TOEGEPAST
  })
  return toegepast ? 'zelfstandig toegepast' : 'zelf gekozen'
}

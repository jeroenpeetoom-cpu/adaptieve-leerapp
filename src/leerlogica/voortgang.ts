import type { Instellingen } from './instellingen'
import { dagenTussen, kalenderdag } from './tijd'
import type { Leeritem, Poging } from './types'

export type Voortgangsstatus = 'nog aan het leren' | 'zelf teruggehaald' | 'later nog geweten'

const VOLGORDE: Voortgangsstatus[] = ['nog aan het leren', 'zelf teruggehaald', 'later nog geweten']

/** Minimaal aantal dagen tussen de allereerste poging en de laatste controle voor "later nog geweten". */
export const DAGEN_LATER_NOG_GEWETEN = 7

export interface Voortgang {
  status: Voortgangsstatus
  /** De hoogste status die ooit bereikt is, voor de geschiedenis in de terugblik. */
  hoogsteOoit: Voortgangsstatus
}

const isVrijGoed = (p: Poging) =>
  p.oordeel === 'goed' && p.hulp === 'vrij opgehaald' && !p.antwoordZelfToegevoegd

function statusNa(pogingen: Poging[], instellingen: Instellingen): Voortgangsstatus {
  const laatsteFout = pogingen.findLastIndex((p) => p.oordeel === 'fout' || p.oordeel === 'niet geweten')
  const bewijs = pogingen.slice(laatsteFout + 1).filter(isVrijGoed)
  if (bewijs.length === 0) return 'nog aan het leren'

  const dag = (p: Poging) => kalenderdag(p.tijdstip, instellingen.tijdzone)
  const eersteDag = dag(pogingen[0])
  const dagen = new Set(bewijs.map(dag))
  const laatsteDag = dag(bewijs.at(-1)!)
  if (dagen.size >= 2 && dagenTussen(eersteDag, laatsteDag) >= DAGEN_LATER_NOG_GEWETEN) {
    return 'later nog geweten'
  }
  return 'zelf teruggehaald'
}

/**
 * De voortgangsstatus volgt het laatste bewijs: alleen pogingen op de huidige bronversie sinds de
 * laatste fout of niet geweten tellen. Bijna en goede antwoorden met hulp zijn geen bewijs, maar
 * zetten de status ook niet terug.
 */
export function berekenVoortgang(item: Leeritem, pogingen: Poging[], instellingen: Instellingen): Voortgang {
  const eigen = pogingen
    .filter((p) => p.leeritemId === item.id && p.bronversie === item.bronversie)
    .sort((a, b) => a.tijdstip.localeCompare(b.tijdstip))

  let hoogsteOoit: Voortgangsstatus = 'nog aan het leren'
  for (let i = 1; i <= eigen.length; i++) {
    const status = statusNa(eigen.slice(0, i), instellingen)
    if (VOLGORDE.indexOf(status) > VOLGORDE.indexOf(hoogsteOoit)) hoogsteOoit = status
  }
  return { status: statusNa(eigen, instellingen), hoogsteOoit }
}

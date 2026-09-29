import type { Leeritem } from './types'
import type { Voortgangsstatus } from './voortgang'

/** Hoe de leerling mag antwoorden op een typvraag: zeggen (of typen), of verplicht typen. */
export type Antwoordwijze = 'zeggen' | 'typen'

/**
 * Opbouw per woord (inspreken, vraag 38):
 * - naar het Nederlands mag de leerling altijd zeggen, want het gaat om de betekenis;
 * - naar een vreemde taal mag hij zeggen zolang het woord nog aan het leren is;
 * - daarna is de poging die meetelt voor de herhaalplanning (de eerste van de dag) een typvraag,
 *   zodat ook de spelling getoetst wordt. Extra pogingen mag hij weer zeggen.
 */
export function bepaalAntwoordwijze(item: Leeritem, status: Voortgangsstatus, eersteVanDeDag: boolean): Antwoordwijze {
  if (item.oefenrichting.naar === 'nl') return 'zeggen'
  if (status === 'nog aan het leren') return 'zeggen'
  return eersteVanDeDag ? 'typen' : 'zeggen'
}

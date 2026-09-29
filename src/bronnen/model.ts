import type { Oefenrichting, Taal } from '../leerlogica'
import type { Twijfel } from '../bronverwerking'

/** De leerstof voor één toets of hoofdstuk (CONTEXT.md). */
export interface Bron {
  id: string
  naam: string
  /** Taal van het vak; de betekenis is altijd Nederlands. */
  taal: Exclude<Taal, 'nl'>
  toetsdag: string | null
  oefenrichtingen: Oefenrichting[]
  afgerond: boolean
  aangemaakt: string
}

export type Verwerkingsstatus = 'wachtend' | 'verwerkt' | 'onzeker' | 'mislukt' | 'bevestigd'

/** Eén gefotografeerde pagina van een bron. */
export interface Bronpagina {
  id: string
  bronId: string
  /** Plek in de bron, vanaf 1. */
  volgorde: number
  /** Paginanummer in het boek, als bekend. */
  origineelNummer: number | null
  status: Verwerkingsstatus
  /** De foto staat er alleen tot het bevestigen. */
  foto?: Blob
  /** Herkende regels zonder woordpaar, zodat niets ongemerkt verdwijnt. */
  losseRegels: string[]
  melding: string | null
}

/** Een woord en zijn betekenis zoals ze samen in de bron staan. */
export interface Woordpaar {
  id: string
  bronId: string
  bronpaginaId: string | null
  /** Het woord in de vreemde taal. */
  woord: string
  /** De Nederlandse betekenis. */
  betekenis: string
  bronversie: number
  /** Pas na bevestigen doet een woordpaar mee in sessies. */
  bevestigd: boolean
  twijfelWoord: Twijfel
  twijfelBetekenis: Twijfel
  /** De leerling heeft een twijfelwoord bekeken. */
  bekeken: boolean
  volgorde: number
}

/** Een voorstelling die de leerling zelf bedenkt en aan één leeritem koppelt (CONTEXT.md). */
export interface Geheugenbeeld {
  id: string
  leeritemId: string
  /** Altijd een korte beschrijving in eigen woorden; die dient ook als hint. */
  beschrijving: string
  emoji: string
  /** Optioneel plaatje uit de galerij, verkleind, als data-URL zodat het in een back-up past. */
  plaatje: string | null
  routeId: string | null
  plek: number | null
  aangemaakt: string
}

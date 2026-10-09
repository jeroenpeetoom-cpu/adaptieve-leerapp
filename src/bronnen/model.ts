import type { Oefenrichting, PlekSoort, Taal } from '../leerlogica'
import type { Twijfel } from '../bronverwerking'

export type Plekrichting = 'aanwijzen' | 'benoemen'

/** De leerstof voor één toets of hoofdstuk (CONTEXT.md). */
export interface Bron {
  id: string
  naam: string
  /** Een woordenlijst of een topo-hoofdstuk met een kaart. Ontbreekt bij oudere bronnen (woordenlijst). */
  soort?: 'woordenlijst' | 'topo'
  /** Alleen bij topo: welke oefenrichtingen per plek. */
  plekrichtingen?: Plekrichting[]
  /** Taal van het vak; de betekenis is altijd Nederlands. */
  taal: Exclude<Taal, 'nl'>
  toetsdag: string | null
  oefenrichtingen: Oefenrichting[]
  afgerond: boolean
  /** Na de toets gekozen om te blijven onthouden. */
  onderhoud?: boolean
  /** De toetsdag waarover de leerling al gereflecteerd heeft. */
  toetsGereflecteerd?: string
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
  /** Gemaakt met het steuntje van de app (invulzinnetje en tips). Ontbreekt bij oudere beelden. */
  metHulp?: boolean
  aangemaakt: string
}

/** Een vaste reeks van enkele bekende plekken, met per plek één geheugenbeeld (CONTEXT.md). */
export interface Route {
  id: string
  bronId: string
  naam: string
  /** 3 tot 5 plekken die de leerling goed kent, in vaste volgorde. */
  plekken: string[]
  aangemaakt: string
}

/** Een rechthoek als fractie van de kaartafmetingen (0 tot 1). */
export interface Rechthoek {
  x0: number
  y0: number
  x1: number
  y1: number
}

/** Een bronpagina met een topografische kaart (CONTEXT.md). */
export interface Kaart {
  id: string
  bronId: string
  /** De kaart als verkleinde JPEG; na bevestigen de blinde versie, zonder afkortingen. */
  beeld: string
  /** De oorspronkelijke kaart, om de blinde kaart opnieuw te kunnen maken (afdekken en ongedaan maken). */
  origineel?: string
  /** Alle tekst die de herkenning op de kaart vond; die wordt allemaal afgedekt. */
  tekstvakken?: Rechthoek[]
  breedte: number
  hoogte: number
  blind: boolean
  /** Stukken die de leerling zelf afdekte, bijvoorbeeld handschrift. */
  afgedekt: Rechthoek[]
  /** Het beeld is een foto van een lege kaart (alleen stipjes); er hoeft niets afgedekt te worden. */
  leeg?: boolean
}

/** Iets met een naam en een positie op een kaart (CONTEXT.md). */
export interface Plek {
  id: string
  bronId: string
  kaartId: string
  naam: string
  soort: PlekSoort
  toetsstof: boolean
  /** Positie als fractie van de kaartafmetingen; null zolang de plek nog aangetikt moet worden. */
  x: number | null
  y: number | null
  /** Waar de afkorting op de kaart stond, om af te dekken. */
  labelVak: Rechthoek | null
  /** Andere namen die bij dezelfde afkorting passen; de leerling kiest in de controle. */
  alternatieven: string[]
  bevestigd: boolean
  bronversie: number
  volgorde: number
}

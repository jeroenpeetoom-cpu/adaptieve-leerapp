// Vaste begrippen uit CONTEXT.md. Tijd is altijd een ISO-tekenreeks die van buiten komt.

export type Tijdstip = string

/** Soort leeritem. Nu alleen woordpaar; topografie volgt (zie .scratch/topografie/). */
export type LeeritemSoort = 'woordpaar'

export type Taal = 'en' | 'nl'

export interface Oefenrichting {
  van: Taal
  naar: Taal
}

export interface Leeritem {
  id: string
  soort: LeeritemSoort
  woordpaarId: string
  bronversie: number
  oefenrichting: Oefenrichting
  /** Wat de leerling te zien krijgt, zoals "bridge". */
  vraag: string
  toegestaneAntwoorden: string[]
}

export type Hulp = 'vrij opgehaald' | 'met hint' | 'herkend' | 'na voorbeeld'

export type Oordeel = 'goed' | 'bijna' | 'fout' | 'niet geweten'

export interface Poging {
  id: string
  sessieId: string
  leeritemId: string
  bronversie: number
  /** null als de leerling op "niet geweten" tikte. */
  antwoord: string | null
  oordeel: Oordeel
  hulp: Hulp
  antwoordZelfToegevoegd: boolean
  tijdstip: Tijdstip
  regelversie: number
}

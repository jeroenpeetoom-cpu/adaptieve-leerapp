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
  bronId: string
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

/** Wanneer een leeritem weer aan de beurt is. Wordt afgeleid uit de pogingen. */
export interface Herhaalplanning {
  leeritemId: string
  /** 0 = nog nooit ingepland; 1 = interval van 1 dag, 2 = 3 dagen, enzovoort. */
  fase: number
  /** Lokale kalenderdag (JJJJ-MM-DD) waarop het leeritem weer aan de beurt is; null als nooit geoefend. */
  volgendeDag: string | null
  laatstVrijOpgehaald: Tijdstip | null
  regelversie: number
}

// Vaste begrippen uit CONTEXT.md. Tijd is altijd een ISO-tekenreeks die van buiten komt.

export type Tijdstip = string

/** Soort leeritem: een woordpaar of een plek op een kaart. */
export type LeeritemSoort = 'woordpaar' | 'plek'

/** Soort plek. "water" is ander water, zoals meren en kanalen (en oudere plekken van vóór de indeling). */
export type PlekSoort = 'stad' | 'rivier' | 'zee' | 'water' | 'gebied' | 'gebergte' | 'land'

/** Wat een leeritem van een plek nodig heeft: waar het ligt, en welke oefenrichting. */
export interface PlekGegevens {
  kaartId: string
  /** Positie als fractie van de kaartafmetingen. */
  x: number
  y: number
  soort: PlekSoort
  richting: 'aanwijzen' | 'benoemen'
}

export type Taal = 'en' | 'nl'

export interface Oefenrichting {
  van: Taal
  naar: Taal
}

export interface Leeritem {
  id: string
  soort: LeeritemSoort
  bronId: string
  /** Het woordpaar of de plek waaruit dit leeritem komt. */
  woordpaarId: string
  bronversie: number
  oefenrichting: Oefenrichting
  /** Wat de leerling te zien krijgt, zoals "bridge". */
  vraag: string
  toegestaneAntwoorden: string[]
  /** Alleen bij een plek. */
  plek?: PlekGegevens
  /** Hoort bij de toetsstof; krijgt voorrang als er weinig tijd is. */
  toetsstof?: boolean
}

export type Hulp = 'vrij opgehaald' | 'met hint' | 'herkend' | 'na voorbeeld'

export type Oordeel = 'goed' | 'bijna' | 'fout' | 'niet geweten'

/** Een leeraanpak die de leerling leert kiezen en zelfstandig gebruiken (CONTEXT.md). */
export type Strategie = 'beelden koppelen' | 'geheugenroute'

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
  /** De strategie waarmee het leeritem geleerd is, als die er is. Ontbreekt bij oudere pogingen. */
  strategie?: Strategie | null
  /** Het antwoord is ingesproken in plaats van getypt. Ontbreekt bij oudere pogingen. */
  ingesproken?: boolean
  /** Gesteld in een toetsronde: zonder hulp en zonder tussentijdse feedback. Ontbreekt bij oudere pogingen. */
  toetsvorm?: boolean
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

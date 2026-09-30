import Dexie, { type EntityTable } from 'dexie'
import type { Leerling } from '../bronnen/leerling'
import type { Bron, Bronpagina, Geheugenbeeld, Kaart, Plek, Route, Woordpaar } from '../bronnen/model'
import type { Poging, SessieToestand } from '../leerlogica'

/** Echte gegevens en testgegevens staan in aparte databases, zodat ze nooit mengen. */
export type Omgeving = 'echt' | 'test'

const NAMEN: Record<Omgeving, string> = {
  echt: 'woordexpeditie',
  test: 'woordexpeditie-test',
}

export interface OpgeslagenSessie {
  id: string
  toestand: SessieToestand
  klaar: boolean
  bijgewerkt: string
  /** Het korte antwoord van de leerling over wat hielp; telt nooit als bewijs. */
  reflectie?: string
}

export interface Meta {
  sleutel: string
  waarde: unknown
}

export class Database extends Dexie {
  pogingen!: EntityTable<Poging, 'id'>
  sessies!: EntityTable<OpgeslagenSessie, 'id'>
  meta!: EntityTable<Meta, 'sleutel'>
  bronnen!: EntityTable<Bron, 'id'>
  bronpaginas!: EntityTable<Bronpagina, 'id'>
  woordparen!: EntityTable<Woordpaar, 'id'>
  leerlingen!: EntityTable<Leerling, 'id'>
  geheugenbeelden!: EntityTable<Geheugenbeeld, 'id'>
  routes!: EntityTable<Route, 'id'>
  kaarten!: EntityTable<Kaart, 'id'>
  plekken!: EntityTable<Plek, 'id'>

  constructor(omgeving: Omgeving) {
    super(NAMEN[omgeving])
    this.version(1).stores({
      pogingen: 'id, sessieId, leeritemId, tijdstip',
    })
    this.version(2).stores({
      sessies: 'id, klaar, bijgewerkt',
      meta: 'sleutel',
    })
    this.version(3).stores({
      bronnen: 'id, aangemaakt',
      bronpaginas: 'id, bronId',
      woordparen: 'id, bronId, bronpaginaId',
    })
    this.version(4).stores({
      leerlingen: 'id',
    })
    this.version(5).stores({
      geheugenbeelden: 'id, leeritemId, routeId',
    })
    this.version(6).stores({
      routes: 'id, bronId, aangemaakt',
    })
    this.version(7).stores({
      kaarten: 'id, bronId',
      plekken: 'id, bronId, kaartId',
    })
  }

  /** Opslaan op id: dezelfde poging twee keer opslaan geeft geen tweede poging. */
  async slaPogingOp(poging: Poging): Promise<void> {
    await this.pogingen.put(poging)
  }

  async slaSessieOp(toestand: SessieToestand, klaar: boolean, tijdstip: string): Promise<void> {
    await this.sessies.put({ id: toestand.sessieId, toestand, klaar, bijgewerkt: tijdstip })
  }

  /** De laatst bijgewerkte sessie die nog niet klaar is, om die te hervatten. */
  async openSessie(): Promise<OpgeslagenSessie | undefined> {
    return (await this.openSessies())[0]
  }

  /** Alle gepauzeerde sessies, de laatst bijgewerkte eerst. Er kunnen er meerdere tegelijk zijn. */
  async openSessies(): Promise<OpgeslagenSessie[]> {
    const open = await this.sessies.filter((s) => !s.klaar).toArray()
    return open.sort((a, b) => b.bijgewerkt.localeCompare(a.bijgewerkt))
  }

  async leesMeta<T>(sleutel: string, standaard: T): Promise<T> {
    const rij = await this.meta.get(sleutel)
    return rij ? (rij.waarde as T) : standaard
  }

  async schrijfMeta(sleutel: string, waarde: unknown): Promise<void> {
    await this.meta.put({ sleutel, waarde })
  }

  async wisAlles(): Promise<void> {
    await Promise.all(this.tables.map((t) => t.clear()))
  }
}

/** De echte gegevens van de leerling. */
export const echteDb = new Database('echt')

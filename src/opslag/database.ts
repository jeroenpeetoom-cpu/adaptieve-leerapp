import Dexie, { type EntityTable } from 'dexie'
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
}

export interface Meta {
  sleutel: string
  waarde: unknown
}

export class Database extends Dexie {
  pogingen!: EntityTable<Poging, 'id'>
  sessies!: EntityTable<OpgeslagenSessie, 'id'>
  meta!: EntityTable<Meta, 'sleutel'>

  constructor(omgeving: Omgeving) {
    super(NAMEN[omgeving])
    this.version(1).stores({
      pogingen: 'id, sessieId, leeritemId, tijdstip',
    })
    this.version(2).stores({
      sessies: 'id, klaar, bijgewerkt',
      meta: 'sleutel',
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
    const open = await this.sessies.filter((s) => !s.klaar).toArray()
    return open.sort((a, b) => b.bijgewerkt.localeCompare(a.bijgewerkt))[0]
  }

  async leesMeta<T>(sleutel: string, standaard: T): Promise<T> {
    const rij = await this.meta.get(sleutel)
    return rij ? (rij.waarde as T) : standaard
  }

  async schrijfMeta(sleutel: string, waarde: unknown): Promise<void> {
    await this.meta.put({ sleutel, waarde })
  }

  async wisAlles(): Promise<void> {
    await Promise.all([this.pogingen.clear(), this.sessies.clear(), this.meta.clear()])
  }
}

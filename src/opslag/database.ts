import Dexie, { type EntityTable } from 'dexie'
import type { Poging } from '../leerlogica'

/** Echte gegevens en testgegevens staan in aparte databases, zodat ze nooit mengen. */
export type Omgeving = 'echt' | 'test'

const NAMEN: Record<Omgeving, string> = {
  echt: 'woordexpeditie',
  test: 'woordexpeditie-test',
}

export class Database extends Dexie {
  pogingen!: EntityTable<Poging, 'id'>

  constructor(omgeving: Omgeving) {
    super(NAMEN[omgeving])
    this.version(1).stores({
      pogingen: 'id, sessieId, leeritemId, tijdstip',
    })
  }

  /** Opslaan op id: dezelfde poging twee keer opslaan geeft geen tweede poging. */
  async slaPogingOp(poging: Poging): Promise<void> {
    await this.pogingen.put(poging)
  }
}

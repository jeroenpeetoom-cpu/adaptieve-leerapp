import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import type { Poging } from '../leerlogica'
import { Database } from './database'

const poging: Poging = {
  id: 'p1',
  sessieId: 's1',
  leeritemId: 'i1',
  bronversie: 1,
  antwoord: 'brug',
  oordeel: 'goed',
  hulp: 'vrij opgehaald',
  antwoordZelfToegevoegd: false,
  tijdstip: '2026-10-01T16:00:00.000Z',
  regelversie: 1,
}

const open: Database[] = []
const maak = (omgeving: 'echt' | 'test') => {
  const db = new Database(omgeving)
  open.push(db)
  return db
}

afterEach(async () => {
  for (const db of open.splice(0)) await db.delete()
})

describe('opslag', () => {
  it('slaat dezelfde poging maar één keer op', async () => {
    const db = maak('test')
    await db.slaPogingOp(poging)
    await db.slaPogingOp(poging)
    expect(await db.pogingen.count()).toBe(1)
  })

  it('houdt testgegevens gescheiden van echte gegevens', async () => {
    const test = maak('test')
    const echt = maak('echt')
    await test.slaPogingOp(poging)
    expect(await echt.pogingen.count()).toBe(0)
  })
})

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

describe('sessies', () => {
  it('bewaart een open sessie zodat die na heropenen te hervatten is', async () => {
    const db = maak('test')
    const toestand = {
      sessieId: 's1',
      leeritems: [],
      huidige: 0,
      volgendeHulp: 'vrij opgehaald' as const,
      pogingenBijHuidige: 0,
      teruggezet: [],
      pogingen: [],
    }
    await db.slaSessieOp(toestand, false, '2026-10-01T16:00:00.000Z')
    db.close()
    const heropend = maak('test')
    expect((await heropend.openSessie())?.id).toBe('s1')
    await heropend.slaSessieOp(toestand, true, '2026-10-01T16:05:00.000Z')
    expect(await heropend.openSessie()).toBeUndefined()
  })
})

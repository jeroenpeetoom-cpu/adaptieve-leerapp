import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { startSessie, STANDAARD_INSTELLINGEN, type Poging } from '../leerlogica'
import { Database } from './database'
import { leesPunten, puntenErbij } from './punten'

const open: Database[] = []
afterEach(async () => {
  for (const db of open.splice(0)) await db.delete()
})

const poging = (id: string, item: string, dag: number): Poging => ({
  id,
  sessieId: 's1',
  leeritemId: item,
  bronversie: 1,
  antwoord: 'x',
  oordeel: 'goed',
  hulp: 'vrij opgehaald',
  antwoordZelfToegevoegd: false,
  tijdstip: new Date(Date.UTC(2026, 9, dag, 14)).toISOString(),
  regelversie: 1,
})

describe('punten uit de opslag', () => {
  it('telt afgeronde missies en vooruitgang, en gaat nooit omlaag', async () => {
    const db = new Database('test')
    open.push(db)
    const p = poging('p1', 'w1-en-nl', 1)
    await db.slaPogingOp(p)
    // Een afgeronde missie: de wachtrij is doorlopen en er is minstens één poging.
    const klaar = { ...startSessie('s1', []), pogingen: [p] }
    await db.slaSessieOp(klaar, true, 't')
    const eerst = await leesPunten(db, STANDAARD_INSTELLINGEN)
    expect(eerst).toMatchObject({ missies: 10, codewoorden: 1, zelfTeruggehaald: 5, totaal: 16 })

    // Pogingen die wegvallen (bijvoorbeeld opgeschoond) laten de punten niet dalen.
    await db.pogingen.clear()
    expect((await leesPunten(db, STANDAARD_INSTELLINGEN)).totaal).toBe(16)
  })

  it('geeft het verschil voor de terugblik', () => {
    const nul = { missies: 0, codewoorden: 0, zelfTeruggehaald: 0, laterNogGeweten: 0, strategie: 0, totaal: 0 }
    expect(puntenErbij(nul, { ...nul, missies: 10, codewoorden: 3, totaal: 13 })).toMatchObject({ missies: 10, codewoorden: 3, totaal: 13 })
  })
})

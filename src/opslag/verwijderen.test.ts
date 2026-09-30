import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { Database } from './database'
import { verwijderBron } from './verwijderen'

const open: Database[] = []
afterEach(async () => {
  for (const db of open.splice(0)) await db.delete()
})

const bron = (id: string) => ({ id, naam: id, taal: 'en' as const, toetsdag: null, oefenrichtingen: [], afgerond: false, aangemaakt: 't' })
const poging = (id: string, leeritemId: string) => ({
  id,
  sessieId: 's',
  leeritemId,
  bronversie: 1,
  antwoord: 'x',
  oordeel: 'goed' as const,
  hulp: 'vrij opgehaald' as const,
  antwoordZelfToegevoegd: false,
  tijdstip: 't',
  regelversie: 1,
})

describe('bron verwijderen', () => {
  it('verwijdert de bron met alles wat erbij hoort, en laat andere bronnen staan', async () => {
    const db = new Database('test')
    open.push(db)
    await db.bronnen.bulkAdd([bron('weg'), bron('blijft')])
    const wp = (id: string, bronId: string) => ({ id, bronId, bronpaginaId: null, woord: 'a', betekenis: 'b', bronversie: 1, bevestigd: true, twijfelWoord: 'geen' as const, twijfelBetekenis: 'geen' as const, bekeken: false, volgorde: 1 })
    await db.woordparen.bulkAdd([wp('w1', 'weg'), wp('w2', 'blijft')])
    await db.plekken.add({ id: 'p1', bronId: 'weg', kaartId: 'k1', naam: 'Gent', soort: 'stad', toetsstof: true, x: 0.3, y: 0.5, labelVak: null, alternatieven: [], bevestigd: true, bronversie: 1, volgorde: 1 })
    await db.kaarten.add({ id: 'k1', bronId: 'weg', beeld: 'data:', breedte: 1, hoogte: 1, blind: true, afgedekt: [] })
    await db.pogingen.bulkAdd([poging('a', 'w1-en-nl'), poging('b', 'p1-aanwijzen'), poging('c', 'w2-en-nl')])
    await db.geheugenbeelden.add({ id: 'g1', leeritemId: 'w1-en-nl', beschrijving: 'x', emoji: '', plaatje: null, routeId: null, plek: null, aangemaakt: 't' })
    await db.schrijfMeta('strategiePerBron', { weg: 'beelden koppelen', blijft: 'geen' })
    await db.schrijfMeta('extraAntwoorden', { 'w1-en-nl': ['x'], 'w2-en-nl': ['y'] })

    await verwijderBron(db, 'weg')

    expect((await db.bronnen.toArray()).map((b) => b.id)).toEqual(['blijft'])
    expect((await db.woordparen.toArray()).map((w) => w.id)).toEqual(['w2'])
    expect(await db.plekken.count()).toBe(0)
    expect(await db.kaarten.count()).toBe(0)
    expect((await db.pogingen.toArray()).map((p) => p.id)).toEqual(['c'])
    expect(await db.geheugenbeelden.count()).toBe(0)
    expect(await db.leesMeta('strategiePerBron', {})).toEqual({ blijft: 'geen' })
    expect(await db.leesMeta('extraAntwoorden', {})).toEqual({ 'w2-en-nl': ['y'] })
  })
})

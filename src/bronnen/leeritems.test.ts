import { describe, expect, it } from 'vitest'
import { kanBevestigen, leeritemsVan, nogTeBekijken } from './leeritems'
import type { Bron, Woordpaar } from './model'

const bron: Bron = {
  id: 'b1',
  naam: 'Engels H3',
  taal: 'en',
  toetsdag: null,
  oefenrichtingen: [{ van: 'en', naar: 'nl' }],
  afgerond: false,
  aangemaakt: '2026-10-01T16:00:00.000Z',
}

const wp = (id: string, extra: Partial<Woordpaar> = {}): Woordpaar => ({
  id,
  bronId: 'b1',
  bronpaginaId: 'p1',
  woord: 'bridge',
  betekenis: 'brug',
  bronversie: 1,
  bevestigd: true,
  twijfelWoord: 'geen',
  twijfelBetekenis: 'geen',
  bekeken: false,
  volgorde: 1,
  ...extra,
})

describe('leeritems van een bron', () => {
  it('maakt alleen leeritems van bevestigde woordparen', () => {
    const items = leeritemsVan(bron, [wp('a'), wp('b', { bevestigd: false })])
    expect(items.map((i) => i.woordpaarId)).toEqual(['a'])
    expect(items[0]).toMatchObject({ vraag: 'bridge', toegestaneAntwoorden: ['brug'], bronId: 'b1', bronversie: 1 })
  })

  it('maakt per oefenrichting een eigen leeritem', () => {
    const beide = { ...bron, oefenrichtingen: [{ van: 'en', naar: 'nl' } as const, { van: 'nl', naar: 'en' } as const] }
    const items = leeritemsVan(beide, [wp('a')])
    expect(items.map((i) => [i.vraag, i.toegestaneAntwoorden[0]])).toEqual([
      ['bridge', 'brug'],
      ['brug', 'bridge'],
    ])
    expect(new Set(items.map((i) => i.id)).size).toBe(2)
  })
})

describe('bevestigen', () => {
  it('kan pas als elk twijfelwoord bekeken is', () => {
    const paren = [wp('a', { bevestigd: false }), wp('b', { bevestigd: false, twijfelWoord: 'grote twijfel' })]
    expect(nogTeBekijken(paren).map((p) => p.id)).toEqual(['b'])
    expect(kanBevestigen(paren)).toBe(false)
    expect(kanBevestigen([paren[0], { ...paren[1], bekeken: true }])).toBe(true)
  })

  it('kan niet met lege velden of zonder nieuwe woordparen', () => {
    expect(kanBevestigen([wp('a', { bevestigd: false, betekenis: ' ' })])).toBe(false)
    expect(kanBevestigen([wp('a')])).toBe(false)
  })
})

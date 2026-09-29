import { describe, expect, it } from 'vitest'
import { STANDAARD_INSTELLINGEN, stelSessieSamen, type BronInfo, type Leeritem, type Poging } from './index'

const item = (id: string, bronId = 'b1'): Leeritem => ({
  id,
  soort: 'woordpaar',
  bronId,
  woordpaarId: `wp-${id}`,
  bronversie: 1,
  oefenrichting: { van: 'en', naar: 'nl' },
  vraag: id,
  toegestaneAntwoorden: [id],
})

/** Eén vrij opgehaalde goede poging op 1 oktober: aan de beurt vanaf 2 oktober. */
const geoefend = (id: string, dag = 1): Poging => ({
  id: `p-${id}`,
  sessieId: 's',
  leeritemId: id,
  bronversie: 1,
  antwoord: id,
  oordeel: 'goed',
  hulp: 'vrij opgehaald',
  antwoordZelfToegevoegd: false,
  tijdstip: new Date(Date.UTC(2026, 9, dag, 14)).toISOString(),
  regelversie: 1,
})

const bron = (extra: Partial<BronInfo> = {}): BronInfo => ({ bronId: 'b1', toetsdag: null, afgerond: false, ...extra })
const ids = (items: Leeritem[]) => items.map((i) => i.id)
const samen = (items: Leeritem[], pogingen: Poging[], bronnen: BronInfo[], vandaag: string) =>
  stelSessieSamen(items, pogingen, bronnen, vandaag, STANDAARD_INSTELLINGEN)

describe('sessiesamenstelling', () => {
  it('neemt maximaal 4 nieuwe leeritems als er niets te herhalen is', () => {
    const items = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => item(id))
    const s = samen(items, [], [bron()], '2026-10-01')
    expect(s.herhalingen).toEqual([])
    expect(ids(s.nieuw)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('zet herhalingen voor en de langst wachtende eerst, tot maximaal 8', () => {
    const items = Array.from({ length: 10 }, (_, i) => item(`h${i}`))
    const pogingen = items.map((it, i) => geoefend(it.id, 10 - i)) // h9 het langst geleden
    const s = samen([...items, item('nieuw')], pogingen, [bron()], '2026-10-20')
    expect(ids(s.herhalingen)).toEqual(['h9', 'h8', 'h7', 'h6', 'h5', 'h4', 'h3', 'h2'])
    expect(s.nieuw).toEqual([]) // geen ruimte voor nieuwe stof
  })

  it('voegt nieuwe stof toe als er minder dan 8 herhalingen zijn', () => {
    const s = samen([item('h'), item('n')], [geoefend('h')], [bron()], '2026-10-02')
    expect(ids(s.herhalingen)).toEqual(['h'])
    expect(ids(s.nieuw)).toEqual(['n'])
  })

  it('neemt geen leeritems op die nog niet aan de beurt zijn', () => {
    const s = samen([item('h')], [geoefend('h')], [bron()], '2026-10-01')
    expect(s.herhalingen).toEqual([])
    expect(s.nieuw).toEqual([])
  })

  it('haalt nieuwe stof naar voren bij een toets binnen 7 dagen', () => {
    const herhaal = Array.from({ length: 8 }, (_, i) => item(`h${i}`))
    const pogingen = herhaal.map((it) => geoefend(it.id))
    const toets = item('t', 'b2')
    const bronnen = [bron(), { bronId: 'b2', toetsdag: '2026-10-09', afgerond: false }]
    expect(ids(samen([...herhaal, toets], pogingen, bronnen, '2026-10-02').nieuw)).toEqual(['t'])
    // Toets verder dan 7 dagen weg: geen voorrang.
    const later = [bron(), { bronId: 'b2', toetsdag: '2026-10-20', afgerond: false }]
    expect(samen([...herhaal, toets], pogingen, later, '2026-10-02').nieuw).toEqual([])
  })

  it('plant niets in van een afgeronde bron', () => {
    const s = samen([item('h'), item('n')], [geoefend('h')], [bron({ afgerond: true })], '2026-10-05')
    expect(s.herhalingen).toEqual([])
    expect(s.nieuw).toEqual([])
  })
})

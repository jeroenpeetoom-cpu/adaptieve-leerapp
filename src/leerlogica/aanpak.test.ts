import { describe, expect, it } from 'vitest'
import { beschrijfAanpak, STANDAARD_INSTELLINGEN, startSessie, vergelijkBeelden, type Leeritem, type Poging } from './index'

const item = (id: string): Leeritem => ({
  id,
  soort: 'woordpaar',
  bronId: 'b',
  woordpaarId: `wp-${id}`,
  bronversie: 1,
  oefenrichting: { van: 'en', naar: 'nl' },
  vraag: id,
  toegestaneAntwoorden: [id],
})
const poging = (id: string, dag: number, extra: Partial<Poging> = {}): Poging => ({
  id: `p-${id}-${dag}-${Math.random()}`,
  sessieId: 's',
  leeritemId: id,
  bronversie: 1,
  antwoord: id,
  oordeel: 'goed',
  hulp: 'vrij opgehaald',
  antwoordZelfToegevoegd: false,
  tijdstip: new Date(Date.UTC(2026, 9, dag, 14)).toISOString(),
  regelversie: 1,
  ...extra,
})

describe('aanpak benoemen', () => {
  it('noemt zelf ophalen, raden, beelden en toetsvorm', () => {
    const s = {
      ...startSessie('s', [item('a'), item('b'), item('c')]),
      geraden: { c: false },
      pogingen: [
        poging('a', 1, { strategie: 'beelden koppelen' }),
        poging('b', 1, { toetsvorm: true }),
        poging('c', 1, { hulp: 'herkend' }),
      ],
    }
    expect(beschrijfAanpak(s)).toBe(
      'Je haalde 2 vragen eerst zelf op uit je geheugen, voordat je het antwoord zag. Bij 1 nieuwe vraag raadde je eerst. Bij 1 hielp je eigen geheugenbeeld. 1 vraag deed je in toetsvorm, zonder hulp.',
    )
  })
})

describe('vergelijking met en zonder beeld', () => {
  const ids = (n: number, v: string) => Array.from({ length: n }, (_, i) => `${v}${i}`)

  it('telt per leeritem de eerste vraag na een week', () => {
    const met = ids(5, 'm')
    const zonder = ids(5, 'z')
    const pogingen = [
      ...met.flatMap((id, i) => [poging(id, 1), poging(id, 9, i < 4 ? {} : { oordeel: 'fout' }), poging(id, 20, { oordeel: 'fout' })]),
      ...zonder.flatMap((id, i) => [poging(id, 1), poging(id, 3, { oordeel: 'fout' }), poging(id, 8, i < 2 ? {} : { oordeel: 'fout' })]),
    ]
    const v = vergelijkBeelden([...met, ...zonder].map(item), pogingen, new Set(met), STANDAARD_INSTELLINGEN)
    expect(v).toEqual({ met: { getoetst: 5, geweten: 4 }, zonder: { getoetst: 5, geweten: 2 }, genoeg: true })
  })

  it('vergelijkt pas vanaf vijf per groep en telt alleen goed zonder hulp', () => {
    const pogingen = [poging('a', 1), poging('a', 10, { hulp: 'met hint' }), poging('b', 1), poging('b', 4)]
    const v = vergelijkBeelden([item('a'), item('b')], pogingen, new Set(['a']), STANDAARD_INSTELLINGEN)
    expect(v).toEqual({ met: { getoetst: 1, geweten: 0 }, zonder: { getoetst: 0, geweten: 0 }, genoeg: false })
  })
})

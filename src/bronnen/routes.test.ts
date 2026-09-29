import { describe, expect, it } from 'vitest'
import type { Geheugenbeeld, Route } from './model'
import { beeldTekst, routeMetVrijePlek, standaardRoutenaam } from './routes'

const route = (id: string, aangemaakt: string, plekken = ['voordeur', 'kapstok', 'bank']): Route => ({
  id,
  bronId: 'b1',
  naam: `Route ${id}`,
  plekken,
  aangemaakt,
})
const beeld = (id: string, routeId: string | null, plek: number | null, beschrijving = 'x'): Geheugenbeeld => ({
  id,
  leeritemId: `i-${id}`,
  beschrijving,
  emoji: '',
  plaatje: null,
  routeId,
  plek,
  aangemaakt: 't',
})

describe('routes', () => {
  it('vindt de eerstvolgende vrije plek', () => {
    const r = route('r1', '1')
    expect(routeMetVrijePlek('b1', [r], [])?.vrijePlek).toBe(0)
    expect(routeMetVrijePlek('b1', [r], [beeld('a', 'r1', 0), beeld('b', 'r1', 1)])?.vrijePlek).toBe(2)
  })

  it('geeft geen route als alle routes vol zijn of de bron nog geen route heeft', () => {
    const r = route('r1', '1')
    const vol = [beeld('a', 'r1', 0), beeld('b', 'r1', 1), beeld('c', 'r1', 2)]
    expect(routeMetVrijePlek('b1', [r], vol)).toBeNull()
    expect(routeMetVrijePlek('b2', [r], [])).toBeNull()
  })

  it('kiest de nieuwste route met een vrije plek', () => {
    const oud = route('r1', '1')
    const nieuw = route('r2', '2')
    expect(routeMetVrijePlek('b1', [oud, nieuw], [])?.route.id).toBe('r2')
  })

  it('zet de plek voor de beschrijving in de hint', () => {
    const r = route('r1', '1')
    expect(beeldTekst(beeld('a', 'r1', 1, 'wolk hangt als jas'), [r])).toBe('kapstok: wolk hangt als jas')
    expect(beeldTekst({ ...beeld('b', null, null, 'brug tussen kussens'), emoji: '🌉' }, [r])).toBe('🌉 brug tussen kussens')
  })

  it('geeft routes van dezelfde bron een oplopende naam', () => {
    expect(standaardRoutenaam('Engels H3', [])).toBe('Route Engels H3')
    expect(standaardRoutenaam('Engels H3', [route('r1', '1')])).toBe('Route Engels H3 2')
  })
})

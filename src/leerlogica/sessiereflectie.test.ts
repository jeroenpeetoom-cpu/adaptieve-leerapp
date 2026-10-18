import { describe, expect, it } from 'vitest'
import { beantwoord, kiesSessiereflectie, startSessie, uitkomstVoornemen, volgende, type Leeritem } from './index'

const w = (id: string): Leeritem => ({ id, soort: 'woordpaar', bronId: 'b', woordpaarId: `wp-${id}`, bronversie: 1, oefenrichting: { van: 'en', naar: 'nl' }, vraag: id, toegestaneAntwoorden: [`${id}-nl`] })
const T = (m: number) => new Date(Date.UTC(2026, 9, 18, 10, m)).toISOString()

function sessie(goedA: boolean) {
  let t = startSessie('s', [w('bridge'), w('key')], [])
  t = volgende(beantwoord(t, { pogingId: 'p1', antwoord: goedA ? 'bridge-nl' : 'x', tijdstip: T(1) }).toestand)
  return beantwoord(t, { pogingId: 'p2', antwoord: 'key-nl', tijdstip: T(2) }).toestand
}

describe('reflectie na de sessie', () => {
  it('kijkt naar een woord dat misging, met een volgende stap', () => {
    const v = kiesSessiereflectie(sessie(false), null, 'Europe/Amsterdam')
    expect(v.variant).toBe('misging')
    expect(v.vraag).toContain('"bridge"')
    expect(v.item?.id).toBe('bridge')
  })

  it('stelt nooit twee keer achter elkaar dezelfde vraag', () => {
    expect(kiesSessiereflectie(sessie(false), 'misging', 'Europe/Amsterdam').variant).not.toBe('misging')
    expect(kiesSessiereflectie(sessie(false), 'hielp', 'Europe/Amsterdam').variant).not.toBe('hielp')
  })

  it('vraagt niet naar een fout als alles goed ging', () => {
    expect(kiesSessiereflectie(sessie(true), null, 'Europe/Amsterdam').variant).not.toBe('misging')
  })

  it('controleert het voornemen als het woord terugkomt', () => {
    const voornemen = { itemId: 'bridge', woord: 'bridge', stap: 'er een beeld bij bedenken', tijdstip: T(0) }
    expect(uitkomstVoornemen(voornemen, sessie(true))).toBe('gelukt')
    expect(uitkomstVoornemen(voornemen, sessie(false))).toBe('nog-niet')
    expect(uitkomstVoornemen({ ...voornemen, itemId: 'ander' }, sessie(true))).toBeNull()
  })
})

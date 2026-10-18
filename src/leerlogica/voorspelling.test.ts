import { describe, expect, it } from 'vitest'
import {
  beantwoord,
  duidVoorspelling,
  startSessie,
  uitkomstVoorspelling,
  volgende,
  volgendeVariant,
  voorspel,
  voorspelbareItems,
  voorspellingNodig,
  voorspelvraag,
  type Leeritem,
  type Poging,
} from './index'

const w = (id: string): Leeritem => ({ id, soort: 'woordpaar', bronId: 'b', woordpaarId: `wp-${id}`, bronversie: 1, oefenrichting: { van: 'en', naar: 'nl' }, vraag: id, toegestaneAntwoorden: [`${id}-nl`] })
const eerder = (id: string): Poging => ({ id: `o-${id}`, sessieId: 'oud', leeritemId: id, bronversie: 1, antwoord: 'x', oordeel: 'goed', hulp: 'vrij opgehaald', antwoordZelfToegevoegd: false, tijdstip: '2026-10-01T10:00:00.000Z', regelversie: 1 })
const T = '2026-10-18T10:00:00.000Z'

describe('voorspellen, vergelijken en bijstellen', () => {
  it('vraagt alleen een voorspelling over herhalingen, niet over nieuwe woorden', () => {
    const t = startSessie('s', [w('a'), w('b'), w('nieuw')], [eerder('a'), eerder('b')])
    expect(voorspelbareItems(t).map((i) => i.id)).toEqual(['a', 'b'])
    expect(voorspellingNodig(t)).toBe(true)
    expect(voorspellingNodig(startSessie('s', [w('nieuw')]))).toBe(false)
  })

  it('vraagt het één keer, ook na overslaan', () => {
    const t = startSessie('s', [w('a')], [eerder('a')])
    expect(voorspellingNodig(voorspel(t, 1, 0))).toBe(false)
    expect(voorspellingNodig(voorspel(t, null, 0))).toBe(false)
  })

  it('vergelijkt met de eerste poging zonder hulp', () => {
    let t = voorspel(startSessie('s', [w('a'), w('b')], [eerder('a'), eerder('b')]), 2, 0)
    t = volgende(beantwoord(t, { pogingId: 'p1', antwoord: 'a-nl', tijdstip: T }).toestand)
    t = beantwoord(t, { pogingId: 'p2', antwoord: 'mis', tijdstip: T }).toestand
    expect(uitkomstVoorspelling(t)).toEqual({ voorspeld: 2, uitkomst: 1, van: 2 })
  })

  it('geeft geen uitkomst na overslaan', () => {
    expect(uitkomstVoorspelling(voorspel(startSessie('s', [w('a')], [eerder('a')]), null, 0))).toBeNull()
  })

  it('wisselt de formulering af', () => {
    expect(volgendeVariant(null)).toBe(0)
    expect(volgendeVariant(0)).not.toBe(0)
    expect(voorspelvraag(0, 6)).toContain('6')
    expect(voorspelvraag(1, 6)).not.toBe(voorspelvraag(0, 6))
  })

  it('duidt het verschil zonder oordeel', () => {
    expect(duidVoorspelling(4, 4)).toContain('klopte')
    expect(duidVoorspelling(3, 5)).toContain('meer dan je dacht')
    expect(duidVoorspelling(5, 3)).toContain('komen snel terug')
  })
})

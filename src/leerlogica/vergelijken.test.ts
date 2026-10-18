import { describe, expect, it } from 'vitest'
import { beantwoord, kiesVergelijking, lijkenOpElkaar, metVergelijking, startSessie, vergelijkStap, volgende, type Leeritem, type Poging } from './index'

const w = (id: string, vraag: string, antwoord: string): Leeritem => ({ id, soort: 'woordpaar', bronId: 'b', woordpaarId: `wp-${id}`, bronversie: 1, oefenrichting: { van: 'en', naar: 'nl' }, vraag, toegestaneAntwoorden: [antwoord] })
const p = (leeritemId: string, antwoord: string | null, oordeel: Poging['oordeel'], dag: number): Poging => ({ id: `${leeritemId}-${dag}-${antwoord}`, sessieId: 's', leeritemId, bronversie: 1, antwoord, oordeel, hulp: 'vrij opgehaald', antwoordZelfToegevoegd: false, tijdstip: new Date(Date.UTC(2026, 9, dag, 10)).toISOString(), regelversie: 1 })
const NU = new Date(Date.UTC(2026, 9, 20, 10)).toISOString()

const fitter = w('fitter', 'fitter', 'fitter')
const healthier = w('healthier', 'healthier', 'gezonder')
const young = w('young', 'young', 'jong')

describe('overeenkomsten en verschillen', () => {
  it('vindt een paar dat de leerling door elkaar haalde', () => {
    const v = kiesVergelijking([fitter, healthier, young], [p('fitter', 'gezonder', 'fout', 18)], [], NU)
    expect(v).toEqual({ a: 'fitter', b: 'healthier', reden: 'verward' })
  })

  it('laat een verwarring los als beide daarna zonder hulp goed gingen', () => {
    const pogingen = [p('fitter', 'gezonder', 'fout', 15), p('fitter', 'fitter', 'goed', 17), p('healthier', 'gezonder', 'goed', 17)]
    expect(kiesVergelijking([fitter, healthier], pogingen, [], NU)).toBeNull()
  })

  it('kiest anders een paar dat op elkaar lijkt, maar niet steeds hetzelfde', () => {
    const house = w('house', 'house', 'huis')
    const horse = w('horse', 'horse', 'paard')
    const pogingen = [p('house', 'huis', 'goed', 15), p('horse', 'paard', 'goed', 15)]
    expect(kiesVergelijking([house, horse], pogingen, [], NU)).toEqual({ a: 'house', b: 'horse', reden: 'lijkt' })
    expect(kiesVergelijking([house, horse], pogingen, [{ a: 'horse', b: 'house', tijdstip: NU }], NU)).toBeNull()
  })

  it('ziet woorden die heel anders zijn niet als gelijkend', () => {
    expect(lijkenOpElkaar(young, healthier)).toBe(false)
  })

  it('zet het paar direct na elkaar aan het eind en herkent de stappen', () => {
    let t = metVergelijking(startSessie('s', [young]), { a: 'fitter', b: 'healthier', reden: 'verward' }, [fitter, healthier, young])
    expect(t.leeritems.map((i) => i.id)).toEqual(['young', 'fitter', 'healthier'])
    expect(vergelijkStap(t)).toBeNull()
    t = volgende(beantwoord(t, { pogingId: 'p1', antwoord: 'jong', tijdstip: NU }).toestand)
    expect(vergelijkStap(t)).toBe('a')
    t = volgende(beantwoord(t, { pogingId: 'p2', antwoord: 'fitter', tijdstip: NU }).toestand)
    expect(vergelijkStap(t)).toBe('b')
  })
})

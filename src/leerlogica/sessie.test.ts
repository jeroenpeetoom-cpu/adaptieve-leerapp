import { describe, expect, it } from 'vitest'
import {
  beantwoord,
  huidigLeeritem,
  isKlaar,
  nogTeGaan,
  startSessie,
  volgende,
  type Leeritem,
  type SessieToestand,
} from './index'

const item = (id: string, vraag: string, antwoord: string): Leeritem => ({
  id,
  soort: 'woordpaar',
  bronId: 'b1',
  woordpaarId: `wp-${id}`,
  bronversie: 1,
  oefenrichting: { van: 'en', naar: 'nl' },
  vraag,
  toegestaneAntwoorden: [antwoord],
})

const items = [item('1', 'bridge', 'brug'), item('2', 'cloud', 'wolk')]
const t = '2026-10-01T16:00:00.000Z'

function antwoord(toestand: SessieToestand, pogingId: string, tekst: string | null) {
  return beantwoord(toestand, { pogingId, antwoord: tekst, tijdstip: t })
}

describe('sessie', () => {
  it('registreert een vrij opgehaald goed antwoord en gaat daarna door', () => {
    const { toestand, poging } = antwoord(startSessie('s1', items), 'p1', 'brug')
    expect(poging).toMatchObject({
      leeritemId: '1',
      oordeel: 'goed',
      hulp: 'vrij opgehaald',
      bronversie: 1,
      tijdstip: t,
      regelversie: 1,
      antwoordZelfToegevoegd: false,
    })
    expect(huidigLeeritem(volgende(toestand))?.id).toBe('2')
  })

  it('geeft na bijna meteen een nieuwe kans met hulp "met hint"', () => {
    const eerste = antwoord(startSessie('s1', [item('1', 'bridge', 'bridge')]), 'p1', 'brigde')
    expect(eerste.poging?.oordeel).toBe('bijna')
    expect(volgende(eerste.toestand)).toBe(eerste.toestand) // nog niet door naar volgende

    const tweede = antwoord(eerste.toestand, 'p2', 'bridge')
    expect(tweede.poging).toMatchObject({ oordeel: 'goed', hulp: 'met hint' })
    expect(isKlaar(volgende(tweede.toestand))).toBe(true)
  })

  it('geeft na een tweede bijna geen derde kans', () => {
    const eerste = antwoord(startSessie('s1', [item('1', 'bridge', 'bridge')]), 'p1', 'brigde')
    const tweede = antwoord(eerste.toestand, 'p2', 'bridgee')
    expect(tweede.poging).toMatchObject({ oordeel: 'bijna', hulp: 'met hint' })
    expect(antwoord(tweede.toestand, 'p3', 'bridge').poging).toBeNull()
  })

  it('laat een leeritem dat niet goed ging aan het eind één keer terugkomen', () => {
    let toestand = startSessie('s1', items)
    toestand = volgende(antwoord(toestand, 'p1', 'lucht').toestand) // bridge fout
    toestand = volgende(antwoord(toestand, 'p2', 'wolk').toestand) // cloud goed
    expect(nogTeGaan(toestand)).toBe(1)
    expect(huidigLeeritem(toestand)?.id).toBe('1')

    const terug = antwoord(toestand, 'p3', 'fiets')
    expect(terug.poging).toMatchObject({ leeritemId: '1', hulp: 'vrij opgehaald', oordeel: 'fout' })
    expect(isKlaar(volgende(terug.toestand))).toBe(true) // niet nog een keer terug
  })

  it('registreert niet geweten als eigen oordeel', () => {
    const { poging } = antwoord(startSessie('s1', items), 'p1', null)
    expect(poging).toMatchObject({ oordeel: 'niet geweten', antwoord: null })
  })

  it('negeert een dubbel verzonden poging', () => {
    const eerste = antwoord(startSessie('s1', items), 'p1', 'lucht')
    const dubbel = antwoord(eerste.toestand, 'p1', 'lucht')
    expect(dubbel.poging).toBeNull()
    expect(dubbel.toestand.pogingen).toHaveLength(1)
  })

  it('is klaar na het laatste leeritem', () => {
    let toestand = startSessie('s1', items)
    toestand = volgende(antwoord(toestand, 'p1', 'brug').toestand)
    toestand = volgende(antwoord(toestand, 'p2', 'wolk').toestand)
    expect(isKlaar(toestand)).toBe(true)
    expect(toestand.pogingen.map((p) => p.oordeel)).toEqual(['goed', 'goed'])
  })
})

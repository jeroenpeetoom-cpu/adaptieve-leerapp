import { describe, expect, it } from 'vitest'
import { verwerkRegels, type HerkendeRegel, type HerkendWoord } from './index'

const H = 20 // letterhoogte

/**
 * Een regel tekst op positie (x, y). Woorden staan met een spatie ertussen; een woord met een
 * zekerheid in `zekerheden` krijgt die zekerheid, de rest 95.
 */
function tekst(x: number, y: number, inhoud: string, zekerheden: Record<string, number> = {}): HerkendWoord[] {
  return inhoud.split(' ').map((t) => {
    const w = { tekst: t, zekerheid: zekerheden[t] ?? 95, x0: x, x1: x + t.length * 10, y0: y, y1: y + H }
    x = w.x1 + 8
    return w
  })
}
const regel = (...delen: HerkendWoord[][]): HerkendeRegel => ({ woorden: delen.flat() })
const paren = (regels: HerkendeRegel[]) => verwerkRegels(regels).voorstellen.map((v) => [v.woord, v.betekenis])

describe('vorm 1: één paar per regel met een scheidingsteken', () => {
  it('herkent de gangbare scheidingstekens', () => {
    expect(
      paren([
        regel(tekst(0, 0, 'bridge = brug')),
        regel(tekst(0, 30, 'cloud - wolk')),
        regel(tekst(0, 60, 'key – sleutel')),
        regel(tekst(0, 90, 'river: rivier')),
        regel(tekst(0, 120, 'window — raam')),
      ]),
    ).toEqual([
      ['bridge', 'brug'],
      ['cloud', 'wolk'],
      ['key', 'sleutel'],
      ['river', 'rivier'],
      ['window', 'raam'],
    ])
  })

  it('splitst ook als het scheidingsteken aan een woord vastzit', () => {
    expect(paren([regel(tekst(0, 0, 'bridge=brug')), regel(tekst(0, 30, 'cloud= wolk')), regel(tekst(0, 60, 'key :sleutel'))])).toEqual([
      ['bridge', 'brug'],
      ['cloud', 'wolk'],
      ['key', 'sleutel'],
    ])
  })

  it('houdt woorden met meerdere delen en koppeltekens heel', () => {
    expect(paren([regel(tekst(0, 0, 'to look after = zorgen voor')), regel(tekst(0, 30, 'ice-cream = ijsje'))])).toEqual([
      ['to look after', 'zorgen voor'],
      ['ice-cream', 'ijsje'],
    ])
  })

  it('laat een nummer of opsommingsteken aan het begin weg', () => {
    expect(paren([regel(tekst(0, 0, '1. bridge = brug')), regel(tekst(0, 30, '• cloud = wolk'))]).map((p) => p[0])).toEqual(['bridge', 'cloud'])
  })

  it('markeert twijfel per kant op basis van de laagste zekerheid', () => {
    const { voorstellen } = verwerkRegels([regel(tekst(0, 0, 'brldge = brug', { brldge: 45 })), regel(tekst(0, 30, 'cloud = wolk', { wolk: 70 }))])
    expect(voorstellen[0]).toMatchObject({ woord: 'brldge', twijfelWoord: 'grote twijfel', twijfelBetekenis: 'geen' })
    expect(voorstellen[1]).toMatchObject({ twijfelWoord: 'geen', twijfelBetekenis: 'twijfel' })
  })
})

describe('vorm 2: kolommen zonder scheidingsteken', () => {
  it('koppelt twee kolommen', () => {
    expect(
      paren([
        regel(tekst(30, 0, 'colour')),
        regel(tekst(260, 2, 'kleur')),
        regel(tekst(30, 30, 'messy')),
        regel(tekst(260, 32, 'slordig, rommelig')),
      ]),
    ).toEqual([
      ['colour', 'kleur'],
      ['messy', 'slordig, rommelig'],
    ])
  })

  it('koppelt twee tabellen naast elkaar, ook als ze iets scheef lopen', () => {
    // Links loopt de rij steeds verder omlaag ten opzichte van de betekenis (de pagina ligt scheef).
    const links = ['awkward', 'clumsy', 'shy', 'serious'].flatMap((w, i) => [
      regel(tekst(30, i * 32 + i * 2, w)),
      regel(tekst(260, i * 32 + 12, ['ongemakkelijk', 'onhandig', 'verlegen', 'serieus'][i])),
    ])
    const rechts = ['first name', 'kind of music', 'easy', 'usually'].flatMap((w, i) => [
      regel(tekst(620, i * 32 + 18, w)),
      regel(tekst(840, i * 32 + 20, ['voornaam', 'soort muziek', 'makkelijk', 'meestal'][i])),
    ])
    const resultaat = paren([...links, ...rechts])
    expect(resultaat).toHaveLength(8)
    expect(resultaat).toEqual(
      expect.arrayContaining([
        ['awkward', 'ongemakkelijk'],
        ['clumsy', 'onhandig'],
        ['shy', 'verlegen'],
        ['serious', 'serieus'],
        ['first name', 'voornaam'],
        ['kind of music', 'soort muziek'],
        ['easy', 'makkelijk'],
        ['usually', 'meestal'],
      ]),
    )
  })

  it('splitst een herkende regel die over meerdere kolommen loopt', () => {
    // Sommige herkenningsmodi zetten een hele rij van de pagina in één regel.
    expect(paren([regel(tekst(30, 0, 'colour'), tekst(260, 2, 'kleur'), tekst(620, 18, 'country'), tekst(840, 20, 'land'))])).toEqual([
      ['colour', 'kleur'],
      ['country', 'land'],
    ])
  })

  it('koppelt zinnen in twee kolommen', () => {
    expect(paren([regel(tekst(30, 0, 'Do you play football?')), regel(tekst(620, 6, 'Speel jij voetbal?'))])).toEqual([
      ['Do you play football?', 'Speel jij voetbal?'],
    ])
  })

  it('laat een derde kolom met voorbeeldzinnen als losse regels staan', () => {
    const { voorstellen, losseRegels } = verwerkRegels([
      regel(tekst(25, 0, 'after')),
      regel(tekst(160, 4, 'na')),
      regel(tekst(296, 0, 'We can play together after lunch.')),
      regel(tekst(25, 34, 'before')),
      regel(tekst(160, 38, 'voor')),
      regel(tekst(296, 34, "Let's go swimming before dinner.")),
    ])
    expect(voorstellen.map((v) => [v.woord, v.betekenis])).toEqual([
      ['after', 'na'],
      ['before', 'voor'],
    ])
    expect(losseRegels).toEqual(['We can play together after lunch.', "Let's go swimming before dinner."])
  })

  it('bewaart koppen als losse regels', () => {
    const { voorstellen, losseRegels } = verwerkRegels([
      regel(tekst(30, 0, 'Words to know')),
      regel(tekst(30, 40, 'colour')),
      regel(tekst(260, 40, 'kleur')),
      regel(tekst(30, 100, 'Phrases')),
    ])
    expect(voorstellen).toHaveLength(1)
    expect(losseRegels).toEqual(['Words to know', 'Phrases'])
  })

  it('markeert een paar met scheidingsteken als twijfel op een pagina met vooral kolommen', () => {
    const { voorstellen } = verwerkRegels([
      regel(tekst(30, 0, 'colour')),
      regel(tekst(260, 0, 'kleur')),
      regel(tekst(30, 30, 'shy')),
      regel(tekst(260, 30, 'verlegen')),
      regel(tekst(0, 400, 'link Engels - groep 7-8')),
    ])
    const voettekst = voorstellen.find((v) => v.woord === 'link Engels')
    expect(voettekst).toMatchObject({ twijfelWoord: 'twijfel', twijfelBetekenis: 'twijfel' })
    expect(voorstellen.find((v) => v.woord === 'colour')).toMatchObject({ twijfelWoord: 'geen' })
  })
})

describe('ruis en lege invoer', () => {
  it('negeert strepen, vlekken en tekst met heel lage zekerheid', () => {
    const { voorstellen, losseRegels } = verwerkRegels([
      regel(tekst(0, 0, 'EE ——_———', { EE: 20, '——_———': 8 })),
      regel(tekst(10, 30, '|')),
      regel(tekst(30, 60, 'colour')),
      regel(tekst(260, 60, '| kleur')),
    ])
    expect(voorstellen.map((v) => [v.woord, v.betekenis])).toEqual([['colour', 'kleur']])
    expect(losseRegels).toEqual([])
  })

  it('geeft niets bij lege invoer', () => {
    expect(verwerkRegels([])).toEqual({ voorstellen: [], losseRegels: [] })
    expect(verwerkRegels([{ woorden: [] }])).toEqual({ voorstellen: [], losseRegels: [] })
  })

  it('laat bij tekst zonder woordparen niets ongemerkt verdwijnen', () => {
    const { voorstellen, losseRegels } = verwerkRegels([regel(tekst(0, 0, 'Reken uit')), regel(tekst(0, 40, 'Maak de som af'))])
    expect(voorstellen).toEqual([])
    expect(losseRegels).toEqual(['Reken uit', 'Maak de som af'])
  })
})

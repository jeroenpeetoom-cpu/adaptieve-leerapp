import { describe, expect, it } from 'vitest'
import { verwerkRegels, type HerkendeRegel } from './index'

/** Maakt een herkende regel van tekst; een woord met "?" erachter heeft lage zekerheid. */
function regel(tekst: string, zekerheden: Record<string, number> = {}): HerkendeRegel {
  let x = 0
  return {
    woorden: tekst.split(' ').map((t) => {
      const w = { tekst: t, zekerheid: zekerheden[t] ?? 95, x0: x, x1: x + t.length * 10 }
      x = w.x1 + 10
      return w
    }),
  }
}

describe('bronverwerking vorm 1: één paar per regel', () => {
  it('herkent de gangbare scheidingstekens', () => {
    const { voorstellen } = verwerkRegels([
      regel('bridge = brug'),
      regel('cloud - wolk'),
      regel('key – sleutel'),
      regel('river: rivier'),
      regel('window — raam'),
    ])
    expect(voorstellen.map((v) => [v.woord, v.betekenis])).toEqual([
      ['bridge', 'brug'],
      ['cloud', 'wolk'],
      ['key', 'sleutel'],
      ['river', 'rivier'],
      ['window', 'raam'],
    ])
  })

  it('splitst ook als het scheidingsteken aan een woord vastzit', () => {
    const { voorstellen } = verwerkRegels([regel('bridge=brug'), regel('cloud= wolk'), regel('key :sleutel')])
    expect(voorstellen.map((v) => [v.woord, v.betekenis])).toEqual([
      ['bridge', 'brug'],
      ['cloud', 'wolk'],
      ['key', 'sleutel'],
    ])
  })

  it('houdt woorden met meerdere delen en koppeltekens heel', () => {
    const { voorstellen } = verwerkRegels([regel('to look after = zorgen voor'), regel('ice-cream = ijsje')])
    expect(voorstellen.map((v) => [v.woord, v.betekenis])).toEqual([
      ['to look after', 'zorgen voor'],
      ['ice-cream', 'ijsje'],
    ])
  })

  it('laat een nummer of opsommingsteken aan het begin weg', () => {
    const { voorstellen } = verwerkRegels([regel('1. bridge = brug'), regel('• cloud = wolk')])
    expect(voorstellen.map((v) => v.woord)).toEqual(['bridge', 'cloud'])
  })

  it('markeert twijfel per kant op basis van de laagste zekerheid', () => {
    const { voorstellen } = verwerkRegels([regel('brldge = brug', { brldge: 45 }), regel('cloud = wolk', { wolk: 70 })])
    expect(voorstellen[0]).toMatchObject({ woord: 'brldge', twijfelWoord: 'grote twijfel', twijfelBetekenis: 'geen' })
    expect(voorstellen[1]).toMatchObject({ twijfelWoord: 'geen', twijfelBetekenis: 'twijfel' })
  })

  it('bewaart regels zonder woordpaar als losse regels, zodat niets ongemerkt verdwijnt', () => {
    const { voorstellen, losseRegels } = verwerkRegels([
      regel('Hoofdstuk 3 Woorden'),
      regel('bridge = brug'),
      regel('= wolk'),
      regel('river ='),
    ])
    expect(voorstellen).toHaveLength(1)
    expect(losseRegels).toEqual(['Hoofdstuk 3 Woorden', '= wolk', 'river ='])
  })

  it('geeft niets bij lege invoer', () => {
    expect(verwerkRegels([])).toEqual({ voorstellen: [], losseRegels: [] })
    expect(verwerkRegels([{ woorden: [] }, regel(' ')])).toEqual({ voorstellen: [], losseRegels: [] })
  })

  it('laat bij een rekensom niets ongemerkt verdwijnen (herkennen als rekensom volgt in ticket 07)', () => {
    const { voorstellen, losseRegels } = verwerkRegels([regel('12 + 7 = 19'), regel('Reken uit')])
    // "12 + 7 = 19" is technisch te splitsen; de begeleider ziet het in de controle en kan het verwijderen.
    expect(voorstellen.length + losseRegels.length).toBe(2)
  })
})

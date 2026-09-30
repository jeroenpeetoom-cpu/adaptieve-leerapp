import { describe, expect, it } from 'vitest'
import type { HerkendeRegel } from '../bronverwerking'
import { koppelAfkortingen, type KaartLabel } from './afkortingen'
import { leesWerkblad } from './werkblad'

/** Een regel met tekst op (x, y), 20 hoog; woorden 8 uit elkaar. */
function regel(x: number, y: number, tekst: string): HerkendeRegel {
  return {
    woorden: tekst.split(' ').map((t) => {
      const w = { tekst: t, zekerheid: 95, x0: x, x1: x + t.length * 10, y0: y, y1: y + 20 }
      x = w.x1 + 8
      return w
    }),
  }
}

// Naar het voorbeeld van een echt werkblad: het vak "Wat moet je leren?" en opdracht 2.
const werkblad: HerkendeRegel[] = [
  regel(30, 550, 'WAT MOET JE LEREN?'),
  regel(30, 630, 'Landen België, Luxemburg'),
  regel(30, 690, 'Steden Luik, Antwerpen, Brussel, Gent,'),
  regel(250, 750, 'Luxemburg'),
  regel(30, 800, 'Wateren Noordzee, Rijn, Schelde, Maas'),
  regel(30, 850, 'Gebieden Ardennen, Vlaanderen, Wallonië'),
  regel(30, 1320, '2 Schrijf de vetgedrukte letters op de juiste plaats'),
  regel(80, 1430, 'Steden Luxemburg, Luik, Antwerpen,'),
  regel(330, 1486, 'Brussel, Gent, Amsterdam,'),
  regel(330, 1542, 'Rotterdam, Maastricht'),
  regel(80, 1597, 'Rivieren Rijn, Schelde, Maas'),
  regel(80, 1655, 'Zee Noordzee'),
  regel(80, 1705, 'Gebieden Vlaanderen en Wallonié'),
  regel(80, 1760, 'Gebergte Ardennen'),
  regel(1150, 1074, 'Brugge'),
  regel(1150, 1134, 'Charleroi'),
  regel(1150, 1242, 'Oostende'),
]

describe('werkblad lezen', () => {
  const { plekken, woorden } = leesWerkblad([werkblad])
  const plek = (naam: string) => plekken.find((p) => p.naam === naam)

  it('vindt de plekken met hun soort, ook over meerdere regels', () => {
    expect(plekken.map((p) => p.naam).sort()).toEqual(
      ['Amsterdam', 'Antwerpen', 'Ardennen', 'België', 'Brussel', 'Gent', 'Luik', 'Luxemburg', 'Luxemburg', 'Maas', 'Maastricht', 'Noordzee', 'Rijn', 'Rotterdam', 'Schelde', 'Vlaanderen', 'Wallonië'].sort(),
    )
    expect(plek('Rijn')?.soort).toBe('water')
    expect(plek('Noordzee')?.soort).toBe('water')
    expect(plek('Ardennen')?.soort).toBe('gebied')
    expect(plek('België')?.soort).toBe('land')
    expect(plek('Antwerpen')?.soort).toBe('stad')
  })

  it('markeert wat in het vak "Wat moet je leren?" staat als toetsstof', () => {
    expect(plek('Luik')?.toetsstof).toBe(true)
    expect(plek('Wallonië')?.toetsstof).toBe(true)
    expect(plek('Amsterdam')?.toetsstof).toBe(false)
    expect(plek('Maastricht')?.toetsstof).toBe(false)
  })

  it('voegt vervormde namen uit verschillende regels samen, met de spelling met accent', () => {
    expect(plekken.filter((p) => p.naam.startsWith('Wallon'))).toHaveLength(1)
    expect(plek('Wallonië')).toBeDefined()
  })

  it('herkent een categorie ook als de laatste letter mist', () => {
    const { plekken } = leesWerkblad([[regel(30, 100, 'Stede Luik, Gent'), regel(30, 150, 'Rivierer Maas')]])
    expect(plekken.map((p) => [p.naam, p.soort])).toEqual([
      ['Luik', 'stad'],
      ['Gent', 'stad'],
      ['Maas', 'water'],
    ])
  })

  it('leest een categorie en namen die als twee losse stukken herkend zijn', () => {
    const { plekken } = leesWerkblad([[regel(30, 50, 'WAT MOET JE LEREN?'), regel(30, 100, 'Landen'), regel(200, 100, 'België, Luxemburg')]])
    expect(plekken).toEqual([
      { naam: 'België', soort: 'land', toetsstof: true },
      { naam: 'Luxemburg', soort: 'land', toetsstof: true },
    ])
  })

  it('houdt een land en een stad met dezelfde naam apart', () => {
    const { plekken } = leesWerkblad([[regel(30, 100, 'Landen België, Luxemburg'), regel(30, 150, 'Steden Luik, Luxemburg')]])
    expect(plekken.filter((p) => p.naam === 'Luxemburg').map((p) => p.soort).sort()).toEqual(['land', 'stad'])
  })

  it('voegt een afgebroken naam samen met de volledige', () => {
    const { plekken } = leesWerkblad([[regel(30, 100, 'Steden Brusse, Gent')], [regel(30, 100, 'Steden Brussel, Gent')]])
    expect(plekken.map((p) => p.naam).sort()).toEqual(['Brussel', 'Gent'])
  })

  it('ruimt afgebroken namen, samengeplakte namen en een verkeerde soort op', () => {
    const goed = [regel(30, 100, 'Steden Brussel, Gent, Rotterdam'), regel(30, 150, 'Zee Noordzee'), regel(30, 200, 'Gebergte Ardennen')]
    const rommel = [regel(30, 100, 'Steden Brussel Gent, Rott'), regel(30, 150, 'Zee Noorc'), regel(30, 200, 'Rivieren Ardennen')]
    const { plekken } = leesWerkblad([goed, goed, rommel])
    expect(plekken.map((p) => `${p.naam}/${p.soort}`).sort()).toEqual(['Ardennen/gebied', 'Brussel/stad', 'Gent/stad', 'Noordzee/water', 'Rotterdam/stad'])
  })

  it('voegt een anders herkende naam samen met de bekende', () => {
    const { plekken } = leesWerkblad([[regel(30, 100, 'Rivieren Rijn, Schelde, Maas')], [regel(30, 100, 'Rivieren Rijn, Scheide, Maas')]])
    expect(plekken.map((p) => p.naam)).toEqual(['Rijn', 'Schelde', 'Maas'])
  })

  it('houdt korte namen die op elkaar lijken, en langere samenstellingen, wel apart', () => {
    expect(leesWerkblad([[regel(30, 100, 'Steden Luik, Lier')]]).plekken.map((p) => p.naam)).toEqual(['Luik', 'Lier'])
    expect(leesWerkblad([[regel(30, 100, 'Steden Bergen, Bergen op Zoom')]]).plekken.map((p) => p.naam)).toEqual(['Bergen', 'Bergen op Zoom'])
  })

  it('knipt rommel van de herkenning na een naam af', () => {
    const { plekken } = leesWerkblad([[regel(30, 100, 'Steden Bastogne An -, Gent 0 t rad')]])
    expect(plekken.map((p) => p.naam)).toEqual(['Bastogne', 'Gent'])
  })

  it('splitst twee namen zonder komma en negeert afgebroken afkortingen', () => {
    const { plekken } = leesWerkblad([[regel(30, 100, 'Steden Mechelen Leuven, Den Haag'), regel(30, 150, 'Zee Noordzee'), regel(60, 190, 'Vla:')]])
    expect(plekken.map((p) => p.naam)).toEqual(['Mechelen', 'Leuven', 'Den Haag', 'Noordzee'])
  })

  it('bewaart losse woorden om onbekende afkortingen op te zoeken', () => {
    expect(woorden).toContain('Oostende')
    expect(woorden).toContain('Charleroi')
  })
})

describe('afkortingen koppelen', () => {
  const { plekken, woorden } = leesWerkblad([werkblad])
  const label = (tekst: string, x: number, y: number, zekerheid = 95): KaartLabel => ({ tekst, zekerheid, x0: x, y0: y, x1: x + 0.02, y1: y + 0.01 })
  const labels = [
    label('An', 0.44, 0.47),
    label('Ge', 0.3, 0.5),
    label('Br', 0.43, 0.54),
    label('Lu', 0.65, 0.57), // Luik
    label('Lu', 0.74, 0.74), // Luxemburg
    label('Ma', 0.67, 0.54), // Maastricht
    label('Ma', 0.58, 0.59), // Maas
    label('VI', 0.5, 0.49, 82), // Vlaanderen, herkend met hoofdletter i
    label('Oo', 0.16, 0.46),
    label('fr', 0.7, 0.46, 75), // ruis
    label('Sc', 0.37, 0.5),
  ]
  const voorstel = koppelAfkortingen(labels, plekken, woorden)
  const van = (naam: string) => voorstel.find((p) => p.naam === naam)

  it('koppelt unieke afkortingen aan hun plek', () => {
    expect(van('Antwerpen')?.label?.x0).toBe(0.44)
    expect(van('Gent')?.label?.x0).toBe(0.3)
    expect(van('Schelde')?.label?.x0).toBe(0.37)
  })

  it('herkent verwisselde letters, zoals VI voor Vl', () => {
    expect(van('Vlaanderen')?.label?.tekst).toBe('VI')
  })

  it('legt dubbelzinnige afkortingen voor met alternatieven', () => {
    const luik = van('Luik')!
    const luxemburg = voorstel.find((p) => p.naam === 'Luxemburg' && p.soort === 'stad')!
    expect([luik.label, luxemburg.label].every(Boolean)).toBe(true)
    expect(luik.alternatieven).toContain('Luxemburg')
    expect(luxemburg.alternatieven).toContain('Luik')
  })

  it('zoekt een afkorting zonder lijst op in de losse woorden', () => {
    expect(van('Oostende')).toMatchObject({ soort: 'stad', toetsstof: false })
    expect(van('Oostende')?.label?.x0).toBe(0.16)
  })

  it('koppelt een afkorting van drie letters bij voorkeur aan een land', () => {
    const { plekken: p2, woorden: w2 } = leesWerkblad([[regel(30, 100, 'Landen Luxemburg'), regel(30, 150, 'Steden Luik, Luxemburg')]])
    const v = koppelAfkortingen([label('Lux', 0.7, 0.7), label('Lu', 0.72, 0.75)], p2, w2)
    expect(v.find((p) => p.naam === 'Luxemburg' && p.soort === 'land')?.label?.tekst).toBe('Lux')
    // "Lu" past bij Luik en bij de stad Luxemburg: de app kiest er een en legt de ander voor als alternatief.
    const metLu = v.find((p) => p.label?.tekst === 'Lu')!
    expect(['Luik', 'Luxemburg']).toContain(metLu.naam)
    expect(metLu.alternatieven.length).toBeGreaterThan(0)
  })

  it('negeert ruis en laat plekken zonder afkorting staan om aan te tikken', () => {
    expect(voorstel.some((p) => p.label?.tekst === 'fr')).toBe(false)
    expect(van('Rijn')?.label).toBeNull()
    expect(van('Ardennen')?.label).toBeNull()
  })

  it('laat een andere tekst op dezelfde plek een goede afkorting niet verdringen', () => {
    const v = koppelAfkortingen([label('An', 0.44, 0.47, 80), label('Anl', 0.44, 0.47, 96)], plekken, woorden)
    expect(v.find((p) => p.naam === 'Antwerpen')?.label?.tekst).toBe('An')
  })

  it('maakt geen tweede plek van een andere herkenning van dezelfde afkorting', () => {
    // "VI" en "Vl" op dezelfde plek; het werkblad heeft ook de vervormde spelling "Vlaandere".
    const v = koppelAfkortingen([label('VI', 0.5, 0.49, 82), label('Vla', 0.5, 0.49, 70)], plekken, [...woorden, 'Vlaandere'])
    expect(v.filter((p) => p.naam.startsWith('Vlaand'))).toHaveLength(1)
  })

  it('maakt geen nieuwe plek van een woord dat bijna een bekende naam is', () => {
    const v = koppelAfkortingen([label('An', 0.9, 0.1)], plekken.filter((p) => p.naam !== 'Antwerpen').concat([{ naam: 'Antwerpen', soort: 'stad', toetsstof: true }]), ['Antwerpe'])
    expect(v.filter((p) => p.naam.startsWith('Antwerp'))).toHaveLength(1)
  })

  it('maakt nooit een plek van een categoriewoord', () => {
    const { woorden: w } = leesWerkblad([[regel(30, 100, 'Landen'), regel(30, 150, 'Kleur de Steden')]])
    expect(w).not.toContain('Landen')
    expect(w).not.toContain('Steden')
  })

  it('voegt labels samen die twee herkenningen op dezelfde plek vonden', () => {
    const dubbel = koppelAfkortingen([label('An', 0.44, 0.47, 80), label('An', 0.441, 0.471, 95)], plekken, woorden)
    expect(dubbel.find((p) => p.naam === 'Antwerpen')?.label?.zekerheid).toBe(95)
  })
})

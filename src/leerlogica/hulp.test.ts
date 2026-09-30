import { describe, expect, it } from 'vitest'
import { hintVoor, optiesVoor, type Leeritem } from './index'

const item = (id: string, antwoord: string, bronId = 'b1'): Leeritem => ({
  id,
  soort: 'woordpaar',
  bronId,
  woordpaarId: `wp-${id}`,
  bronversie: 1,
  oefenrichting: { van: 'en', naar: 'nl' },
  vraag: id,
  toegestaneAntwoorden: [antwoord],
})

const bron = [item('bridge', 'brug'), item('cloud', 'wolk'), item('key', 'sleutel'), item('river', 'rivier'), item('dog', 'hond')]

describe('hint', () => {
  it('noemt de eerste letter en het aantal letters, zonder het antwoord te verklappen', () => {
    expect(hintVoor(bron[2])).toBe('Het begint met een "s" en heeft 7 letters.')
  })

  it('verwijst naar het eigen geheugenbeeld als dat er is', () => {
    expect(hintVoor(bron[1], 'een wolk hangt aan de kapstok')).toBe('Denk aan je beeld: "een wolk hangt aan de kapstok".')
    expect(hintVoor(bron[2], '  ')).toBe('Het begint met een "s" en heeft 7 letters.')
  })
})

describe('opties', () => {
  it('geeft vier verschillende opties met het goede antwoord erbij', () => {
    const opties = optiesVoor(bron[0], bron, 'p1')
    expect(opties).toHaveLength(4)
    expect(new Set(opties).size).toBe(4)
    expect(opties).toContain('brug')
  })

  it('is stabiel voor hetzelfde zaad', () => {
    expect(optiesVoor(bron[0], bron, 'p1')).toEqual(optiesVoor(bron[0], bron, 'p1'))
  })

  it('gebruikt alleen antwoorden uit dezelfde bron', () => {
    const vreemd = item('cat', 'kat', 'b2')
    expect(optiesVoor(bron[0], [...bron, vreemd], 'p1')).not.toContain('kat')
  })

  it('werkt ook met minder dan vier woorden in de bron', () => {
    expect(optiesVoor(bron[0], bron.slice(0, 2), 'p1').sort()).toEqual(['brug', 'wolk'])
  })
})

describe('opties bij een plek', () => {
  const plek = (id: string, soort: 'stad' | 'water'): Leeritem => ({
    ...item(id, id),
    oefenrichting: { van: 'nl', naar: 'nl' },
    plek: { kaartId: 'k', x: 0.5, y: 0.5, soort, richting: 'benoemen' },
  })
  it('kiest namen van plekken van dezelfde soort', () => {
    const bron = [plek('Gent', 'stad'), plek('Luik', 'stad'), plek('Maas', 'water'), plek('Namen', 'stad'), plek('Rijn', 'water'), plek('Bergen', 'stad')]
    const opties = optiesVoor(bron[0], bron, 'zaad')
    expect(opties).toHaveLength(4)
    expect(opties).toContain('Gent')
    expect(opties).not.toContain('Maas')
    expect(opties).not.toContain('Rijn')
  })
})

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

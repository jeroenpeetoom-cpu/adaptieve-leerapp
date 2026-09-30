import { describe, expect, it } from 'vitest'
import { emojiVoor, voorstelVoorPlek, voorstelVoorWoord, type EmojiRegister } from './voorstel'

const register: EmojiRegister = {
  nl: { sleutel: ['🔑', '🔐'], wolk: ['☁️'], zee: ['🌊'], noord: ['🧭'], brug: ['🌉'] },
  en: { key: ['🔑'], cloud: ['☁️'] },
}

describe('emoji zoeken', () => {
  it('vindt emoji bij een woord, ook met een lidwoord', () => {
    expect(emojiVoor('de sleutel', register.nl)).toEqual(['🔑', '🔐'])
    expect(emojiVoor('Wolk', register.nl)).toEqual(['☁️'])
  })

  it('vindt emoji in een samenstelling, zoals een plaatsnaam', () => {
    expect(emojiVoor('Noordzee', register.nl)).toEqual(['🧭'])
  })

  it('geeft niets bij een onbekend woord', () => {
    expect(emojiVoor('hoewel', register.nl)).toEqual([])
  })
})

describe('beeldvoorstel', () => {
  it('maakt bij een woordpaar een gek zinnetje met emoji en een klank-tip', () => {
    const v = voorstelVoorWoord('key', 'sleutel', register, 'zaad')
    expect(v.emoji).toBe('🔑 🔐')
    expect(v.zin).toMatch(/^Stel je voor: een reuzensleutel die /)
    expect(v.zin).toContain('Klinkt "key" als een Nederlands woord?')
    expect(v.kort).toMatch(/^reuzensleutel die /)
  })

  it('geeft bij een abstract woord alleen de klank-tip', () => {
    const v = voorstelVoorWoord('although', 'hoewel', register, 'zaad')
    expect(v.emoji).toBe('💭')
    expect(v.zin).toContain('Klinkt "although" als een Nederlands woord?')
  })

  it('is hetzelfde voor hetzelfde zaad, en wisselt bij een ander zaad', () => {
    const zinnen = new Set(['a', 'b', 'c', 'd', 'e', 'f'].map((z) => voorstelVoorWoord('key', 'sleutel', register, z).zin))
    expect(voorstelVoorWoord('key', 'sleutel', register, 'a')).toEqual(voorstelVoorWoord('key', 'sleutel', register, 'a'))
    expect(zinnen.size).toBeGreaterThan(1)
  })

  it('maakt bij een plaatsnaam een voorstel met de soort en herkenbare delen', () => {
    expect(voorstelVoorPlek('Noordzee', 'zee', register, 'z').emoji).toBe('🌊 🧭')
    expect(voorstelVoorPlek('Luik', 'stad', register, 'z').zin).toContain('Klinkt "Luik" als iets wat je kent?')
  })
})

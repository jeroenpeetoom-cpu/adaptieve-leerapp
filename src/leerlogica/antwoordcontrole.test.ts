import { describe, expect, it } from 'vitest'
import { beoordeel, normaliseer } from './antwoordcontrole'

describe('normaliseer', () => {
  it('negeert hoofdletters, spaties, leestekens en een lidwoord aan het begin', () => {
    expect(normaliseer('  De   Sleutel! ')).toBe('sleutel')
    expect(normaliseer('the Bridge.')).toBe('bridge')
    expect(normaliseer('Key')).toBe('key')
  })

  it('laat een los lidwoord staan', () => {
    expect(normaliseer('een')).toBe('een')
  })
})

describe('beoordeel', () => {
  it('is goed bij een toegestaan antwoord, ook met lidwoord of hoofdletter', () => {
    expect(beoordeel('brug', ['brug'])).toBe('goed')
    expect(beoordeel('De brug', ['brug'])).toBe('goed')
    expect(beoordeel('stroom', ['rivier', 'stroom'])).toBe('goed')
  })

  it('is bijna bij één kleine spelfout in een woord van vijf letters of meer', () => {
    expect(beoordeel('brigde', ['bridge'])).toBe('bijna') // twee letters omgedraaid
    expect(beoordeel('sleutl', ['sleutel'])).toBe('bijna') // letter weggelaten
    expect(beoordeel('rivieer', ['rivier'])).toBe('bijna') // letter toegevoegd
    expect(beoordeel('slautel', ['sleutel'])).toBe('bijna') // letter vervangen
  })

  it('is fout bij een spelfout in een kort woord', () => {
    expect(beoordeel('in', ['on'])).toBe('fout')
    expect(beoordeel('wilk', ['wolk'])).toBe('fout')
  })

  it('is fout bij twee of meer verschillen of een ander woord', () => {
    expect(beoordeel('brgied', ['bridge'])).toBe('fout')
    expect(beoordeel('lucht', ['wolk'])).toBe('fout')
  })

  it('is niet geweten zonder antwoord', () => {
    expect(beoordeel(null, ['brug'])).toBe('niet geweten')
    expect(beoordeel('   ', ['brug'])).toBe('niet geweten')
  })
})

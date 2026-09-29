import { describe, expect, it } from 'vitest'
import { bepaalAntwoordwijze, type Leeritem } from './index'

const item = (naar: 'nl' | 'en'): Leeritem => ({
  id: 'i',
  soort: 'woordpaar',
  bronId: 'b',
  woordpaarId: 'wp',
  bronversie: 1,
  oefenrichting: { van: naar === 'nl' ? 'en' : 'nl', naar },
  vraag: naar === 'nl' ? 'bridge' : 'brug',
  toegestaneAntwoorden: [naar === 'nl' ? 'brug' : 'bridge'],
})

describe('antwoordwijze', () => {
  it('laat naar het Nederlands altijd zeggen', () => {
    expect(bepaalAntwoordwijze(item('nl'), 'zelf teruggehaald', true)).toBe('zeggen')
    expect(bepaalAntwoordwijze(item('nl'), 'later nog geweten', true)).toBe('zeggen')
  })

  it('laat naar het Engels zeggen zolang het woord nog aan het leren is', () => {
    expect(bepaalAntwoordwijze(item('en'), 'nog aan het leren', true)).toBe('zeggen')
  })

  it('vraagt naar het Engels om typen bij de poging die meetelt, zodra het woord zelf teruggehaald is', () => {
    expect(bepaalAntwoordwijze(item('en'), 'zelf teruggehaald', true)).toBe('typen')
    expect(bepaalAntwoordwijze(item('en'), 'later nog geweten', true)).toBe('typen')
  })

  it('laat extra pogingen op dezelfde dag weer zeggen', () => {
    expect(bepaalAntwoordwijze(item('en'), 'zelf teruggehaald', false)).toBe('zeggen')
  })
})

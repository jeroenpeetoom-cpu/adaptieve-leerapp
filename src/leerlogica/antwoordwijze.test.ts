import { describe, expect, it } from 'vitest'
import { bepaalAntwoordwijze, lijktIngesproken, type Leeritem } from './index'

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

describe('ingesproken of getypt', () => {
  it('ziet de eerste letter na een spatie als typen', () => {
    expect(lijktIngesproken('stay ', 'stay u')).toBe(false)
    expect(lijktIngesproken('stay up ', 'stay up l')).toBe(false)
  })

  it('ziet een spatie of één letter als typen', () => {
    expect(lijktIngesproken('stay', 'stay ')).toBe(false)
    expect(lijktIngesproken('sta', 'stay')).toBe(false)
  })

  it('ziet een heel woord in één keer als ingesproken', () => {
    expect(lijktIngesproken('', 'bridge')).toBe(true)
    expect(lijktIngesproken('stay ', 'stay up')).toBe(true)
  })
})

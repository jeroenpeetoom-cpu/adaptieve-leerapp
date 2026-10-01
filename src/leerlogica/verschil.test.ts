import { describe, expect, it } from 'vitest'
import { beschrijfVerschil, dichtstbijzijnde, markeerVerschil, verschilfeedback } from './index'

describe('verschil tussen antwoord en goed antwoord', () => {
  it('herkent twee omgedraaide letters', () => {
    expect(beschrijfVerschil('brigde', 'bridge')).toEqual({ soort: 'omgedraaid', begin: 'bri', letters: ['d', 'g'] })
  })

  it('herkent een ontbrekende, een extra en een verkeerde letter', () => {
    expect(beschrijfVerschil('brige', 'bridge')).toMatchObject({ soort: 'mist', begin: 'bri', letters: ['d'] })
    expect(beschrijfVerschil('briddge', 'bridge')).toMatchObject({ soort: 'extra', begin: 'brid', letters: ['d'] })
    expect(beschrijfVerschil('brudge', 'bridge')).toMatchObject({ soort: 'verkeerd', begin: 'br', letters: ['u'] })
  })

  it('negeert hoofdletters en een lidwoord aan het begin', () => {
    expect(beschrijfVerschil('The Brige', 'bridge')).toMatchObject({ soort: 'mist', begin: 'Bri' })
  })

  it('noemt bij een nieuw woord wat klopt en waar het misgaat', () => {
    expect(verschilfeedback(beschrijfVerschil('brigde', 'bridge'), false)).toBe('"bri" klopt. Daarna staan de d en de g verkeerd om.')
    expect(verschilfeedback(beschrijfVerschil('prug', 'brug'), false)).toBe('Meteen aan het begin klopt de p niet.')
  })

  it('geeft bij een bekend woord alleen een lichte aanwijzing', () => {
    expect(verschilfeedback(beschrijfVerschil('brigde', 'bridge'), true)).toBe('Er staan twee letters verkeerd om.')
    expect(verschilfeedback(beschrijfVerschil('kat', 'bridge'), true)).toBeNull()
  })

  it('zegt bij een heel ander antwoord alleen welk begin klopt', () => {
    expect(verschilfeedback(beschrijfVerschil('brood', 'bridge'), false)).toBe('"br" klopt, daarna gaat het mis.')
    expect(verschilfeedback(beschrijfVerschil('kat', 'bridge'), false)).toBeNull()
  })

  it('markeert per letter wat klopt', () => {
    const { gegeven, goed } = markeerVerschil('brige', 'bridge')
    expect(gegeven.every((t) => t.klopt)).toBe(true)
    expect(goed.filter((t) => !t.klopt).map((t) => t.teken)).toEqual(['d'])
  })

  it('vergelijkt met het toegestane antwoord dat er het meest op lijkt', () => {
    expect(dichtstbijzijnde('vlieger', ['vliegtuig', 'vlieger zijn', 'kite'])).toBe('vlieger zijn')
  })
})

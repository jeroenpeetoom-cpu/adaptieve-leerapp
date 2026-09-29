import { describe, expect, it } from 'vitest'
import { splits, splitsbareWoorden, voegSamen } from './bewerken'

describe('herstelacties', () => {
  it('splitst "colour kleur" uit één vak in woord en betekenis', () => {
    expect(splitsbareWoorden({ woord: 'colour kleur', betekenis: '' })).toEqual(['colour', 'kleur'])
    expect(splits({ woord: 'colour kleur', betekenis: '' }, 1)).toEqual({ woord: 'colour', betekenis: 'kleur' })
  })

  it('verplaatst een verkeerde grens', () => {
    expect(splits({ woord: 'to look', betekenis: 'after zorgen voor' }, 3)).toEqual({ woord: 'to look after', betekenis: 'zorgen voor' })
  })

  it('voegt een losse betekenis van de volgende regel samen', () => {
    expect(voegSamen({ woord: 'colour', betekenis: '' }, { woord: 'kleur', betekenis: '' })).toEqual({ woord: 'colour', betekenis: 'kleur' })
  })

  it('voegt een afgebroken zin samen', () => {
    expect(voegSamen({ woord: 'What do you like?', betekenis: 'Wat doe jij graag in je vrije' }, { woord: 'tijd?', betekenis: '' })).toEqual({
      woord: 'What do you like?',
      betekenis: 'Wat doe jij graag in je vrije tijd?',
    })
  })
})

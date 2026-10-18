import { describe, expect, it } from 'vitest'
import { KEUZEREDENEN, reactieOpReden } from './strategiekaarten'

describe('kiezen met reden', () => {
  it('heeft bij elke keuze minstens één reden die past bij waar de aanpak voor bedoeld is', () => {
    for (const redenen of Object.values(KEUZEREDENEN)) expect(redenen.some((r) => r.soort === 'past')).toBe(true)
  })

  it('reageert op een passende reden anders dan op uitproberen', () => {
    const [past, , proberen] = KEUZEREDENEN['beelden koppelen']
    expect(reactieOpReden(past)).toContain('past')
    expect(reactieOpReden(proberen)).toContain('uit te proberen')
  })
})

import { describe, expect, it } from 'vitest'
import { ankerhint, ankerzin, kiesAnkers } from './index'

const brussel = { naam: 'Brussel', x: 0.45, y: 0.55 }
const hasselt = { naam: 'Hasselt', x: 0.6, y: 0.52 }
const luik = { naam: 'Luik', x: 0.65, y: 0.58 }
const oostende = { naam: 'Oostende', x: 0.15, y: 0.46 }

describe('ankers', () => {
  const antwerpen = { naam: 'Antwerpen', x: 0.45, y: 0.47 }

  it('kiest de dichtstbijzijnde bekende plekken, met de windrichting naar de plek', () => {
    const ankers = kiesAnkers(antwerpen, [oostende, luik, brussel, hasselt], 1)
    expect(ankers).toEqual([
      { naam: 'Brussel', richting: 'noorden' },
      { naam: 'Hasselt', richting: 'westen' },
    ])
  })

  it('maakt er een zin en een hint van', () => {
    const ankers = kiesAnkers(antwerpen, [brussel, hasselt], 1)
    expect(ankerzin('Antwerpen', ankers)).toBe('Antwerpen ligt ten noorden van Brussel en ten westen van Hasselt.')
    expect(ankerhint(ankers)).toBe('Kijk ten noorden van Brussel.')
  })

  it('gebruikt de plek zelf en plekken die er bijna op liggen niet als anker', () => {
    expect(kiesAnkers(antwerpen, [{ ...antwerpen }, { naam: 'Vlak bij', x: 0.451, y: 0.471 }], 1)).toEqual([])
  })

  it('geeft niets zolang de leerling nog geen plekken kent', () => {
    expect(ankerzin('Antwerpen', kiesAnkers(antwerpen, [], 1))).toBeNull()
    expect(ankerhint([])).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'
import { labelsUit, midden, vakRond } from './labels'

describe('labels', () => {
  it('rekent posities om naar een fractie van de kaart', () => {
    const [l] = labelsUit([[{ woorden: [{ tekst: 'An', zekerheid: 90, x0: 100, x1: 120, y0: 50, y1: 60 }] }]], 1000, 500)
    expect(l).toMatchObject({ tekst: 'An', x0: 0.1, x1: 0.12, y0: 0.1, y1: 0.12 })
  })

  it('maakt een afdekvak rond een aangetikte plek, zo groot als de andere afkortingen', () => {
    const vak = vakRond(0.5, 0.5, [{ x0: 0, x1: 0.02, y0: 0, y1: 0.01 }])
    expect(midden(vak)).toEqual({ x: 0.5, y: 0.5 })
    expect(vak.x1 - vak.x0).toBeCloseTo(0.026)
  })
})

import { describe, expect, it } from 'vitest'
import { REGELVERSIE } from './index'

describe('leerlogica', () => {
  it('heeft een regelversie', () => {
    expect(REGELVERSIE).toBe(1)
  })
})

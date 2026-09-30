import { describe, expect, it } from 'vitest'
import { binnenVierhoek, klikVast, omrekeningUit, reken, vindStippen } from './uitlijnen'

describe('uitlijnen', () => {
  it('rekent punten om tussen twee foto’s, ook als de ene verschoven, kleiner en scheef is', () => {
    const van = [{ x: 0.1, y: 0.1 }, { x: 0.9, y: 0.1 }, { x: 0.9, y: 0.9 }, { x: 0.1, y: 0.9 }]
    // De tweede foto: kleiner, verschoven, en onderaan iets breder (schuin genomen).
    const naar = [{ x: 0.2, y: 0.15 }, { x: 0.8, y: 0.12 }, { x: 0.85, y: 0.8 }, { x: 0.15, y: 0.82 }]
    const h = omrekeningUit(van, naar)
    for (let i = 0; i < 4; i++) {
      const p = reken(h, van[i])
      expect(p.x).toBeCloseTo(naar[i].x, 6)
      expect(p.y).toBeCloseTo(naar[i].y, 6)
    }
    const midden = reken(h, { x: 0.5, y: 0.5 })
    expect(midden.x).toBeGreaterThan(0.45)
    expect(midden.x).toBeLessThan(0.55)
  })

  it('weet of een punt binnen het kader ligt', () => {
    const kader = [{ x: 0.1, y: 0.1 }, { x: 0.9, y: 0.1 }, { x: 0.9, y: 0.9 }, { x: 0.1, y: 0.9 }]
    expect(binnenVierhoek({ x: 0.5, y: 0.5 }, kader)).toBe(true)
    expect(binnenVierhoek({ x: 0.95, y: 0.5 }, kader)).toBe(false)
  })

  it('vindt losse stipjes, maar geen rij letters en niets buiten het kader', () => {
    const B = 400
    const H = 400
    const grijs = new Uint8Array(B * H).fill(230)
    const stip = (cx: number, cy: number) => {
      for (let y = cy - 3; y <= cy + 3; y++) for (let x = cx - 3; x <= cx + 3; x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= 9) grijs[y * B + x] = 20
    }
    stip(100, 100)
    stip(250, 300)
    for (let i = 0; i < 6; i++) stip(60 + i * 20, 20) // een regel tekst bovenaan
    stip(390, 390) // buiten het kader
    const kader = [{ x: 0.05, y: 0.1 }, { x: 0.95, y: 0.1 }, { x: 0.95, y: 0.95 }, { x: 0.05, y: 0.95 }]
    const stippen = vindStippen(grijs, B, H, kader)
    expect(stippen).toHaveLength(2)
    expect(stippen[0].x).toBeCloseTo(0.25, 2)
    expect(stippen[1].y).toBeCloseTo(0.75, 2)
  })

  it('klikt steden vast op het dichtstbijzijnde stipje, elk stipje hooguit één keer', () => {
    const steden = [{ id: 'an', x: 0.47, y: 0.5 }, { id: 'me', x: 0.49, y: 0.52 }, { id: 'ver', x: 0.9, y: 0.9 }]
    const stippen = [{ x: 0.45, y: 0.5 }, { x: 0.5, y: 0.53 }]
    const vast = klikVast(steden, stippen, 1)
    expect(vast.get('an')).toEqual({ x: 0.45, y: 0.5 })
    expect(vast.get('me')).toEqual({ x: 0.5, y: 0.53 })
    expect(vast.has('ver')).toBe(false)
  })
})

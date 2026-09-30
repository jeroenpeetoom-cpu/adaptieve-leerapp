import type { HerkendeRegel } from '../bronverwerking'
import type { Rechthoek } from '../bronnen/model'
import type { KaartLabel } from './afkortingen'

/** Alle woorden van de kaartherkenningen als labels, met positie als fractie van de kaart. */
export function labelsUit(varianten: HerkendeRegel[][], breedte: number, hoogte: number): KaartLabel[] {
  return varianten.flatMap((regels) =>
    regels.flatMap((r) =>
      r.woorden.map((w) => ({
        tekst: w.tekst,
        zekerheid: w.zekerheid,
        x0: w.x0 / breedte,
        x1: w.x1 / breedte,
        y0: w.y0 / hoogte,
        y1: w.y1 / hoogte,
      })),
    ),
  )
}

/** Een afdekvak rond een aangetikte plek, zo groot als een gewone afkorting op deze kaart. */
export function vakRond(x: number, y: number, voorbeelden: Rechthoek[]): Rechthoek {
  const mediaan = (w: number[], standaard: number) => {
    if (w.length === 0) return standaard
    const s = [...w].sort((a, b) => a - b)
    return s[Math.floor(s.length / 2)]
  }
  const b = mediaan(voorbeelden.map((v) => v.x1 - v.x0), 0.03) * 1.3
  const h = mediaan(voorbeelden.map((v) => v.y1 - v.y0), 0.015) * 1.4
  return { x0: x - b / 2, x1: x + b / 2, y0: y - h / 2, y1: y + h / 2 }
}

export const midden = (r: Rechthoek) => ({ x: (r.x0 + r.x1) / 2, y: (r.y0 + r.y1) / 2 })

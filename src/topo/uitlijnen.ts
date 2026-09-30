// Een ingevulde kaart over een lege kaart leggen (spec topografie, vraag 52). Pure module.

export interface Punt {
  x: number
  y: number
}

/** Een projectieve omrekening (homografie) als 3×3-matrix, rij voor rij, met de laatste waarde 1. */
export type Omrekening = number[]

/**
 * Rekent uit hoe vier punten op de ene foto (bijvoorbeeld de hoeken van het kaartkader) op de andere
 * foto vallen. Werkt ook als een foto scheef of schuin genomen is.
 */
export function omrekeningUit(van: Punt[], naar: Punt[]): Omrekening {
  if (van.length !== 4 || naar.length !== 4) throw new Error('Vier punten nodig')
  // Acht vergelijkingen voor h11..h32 (h33 = 1), opgelost met Gauss-eliminatie.
  const A: number[][] = []
  for (let i = 0; i < 4; i++) {
    const { x, y } = van[i]
    const { x: u, y: v } = naar[i]
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u])
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y, v])
  }
  for (let k = 0; k < 8; k++) {
    let max = k
    for (let r = k + 1; r < 8; r++) if (Math.abs(A[r][k]) > Math.abs(A[max][k])) max = r
    ;[A[k], A[max]] = [A[max], A[k]]
    if (Math.abs(A[k][k]) < 1e-12) throw new Error('Punten liggen op één lijn')
    for (let r = 0; r < 8; r++) {
      if (r === k) continue
      const f = A[r][k] / A[k][k]
      for (let c = k; c < 9; c++) A[r][c] -= f * A[k][c]
    }
  }
  return [...A.map((rij, i) => rij[8] / rij[i]), 1]
}

export function reken(h: Omrekening, p: Punt): Punt {
  const w = h[6] * p.x + h[7] * p.y + h[8]
  return { x: (h[0] * p.x + h[1] * p.y + h[2]) / w, y: (h[3] * p.x + h[4] * p.y + h[5]) / w }
}

/**
 * Vindt de stipjes op een lege kaart: kleine, ronde, donkere vlekjes die los staan. Punten in een rij op
 * dezelfde hoogte (letters van een titel of een regel tekst) vallen af, net als alles buiten het kaartkader.
 * Geeft posities als fractie van breedte en hoogte.
 */
export function vindStippen(grijs: ArrayLike<number>, breedte: number, hoogte: number, kader?: Punt[]): Punt[] {
  const drempel = 90
  const gezien = new Uint8Array(breedte * hoogte)
  const vlekjes: { x: number; y: number }[] = []
  const maxZijde = Math.max(9, Math.round(breedte * 0.012))
  for (let y = 1; y < hoogte - 1; y++) {
    for (let x = 1; x < breedte - 1; x++) {
      const i = y * breedte + x
      if (gezien[i] || grijs[i] >= drempel) continue
      const stapel = [i]
      gezien[i] = 1
      let n = 0
      let sx = 0
      let sy = 0
      let x0 = x
      let x1 = x
      let y0 = y
      let y1 = y
      while (stapel.length > 0 && n <= 600) {
        const j = stapel.pop()!
        const a = j % breedte
        const b = (j - a) / breedte
        n++
        sx += a
        sy += b
        x0 = Math.min(x0, a)
        x1 = Math.max(x1, a)
        y0 = Math.min(y0, b)
        y1 = Math.max(y1, b)
        for (const k of [j + 1, j - 1, j + breedte, j - breedte]) {
          if (k >= 0 && k < gezien.length && !gezien[k] && grijs[k] < drempel) {
            gezien[k] = 1
            stapel.push(k)
          }
        }
      }
      const b = x1 - x0 + 1
      const h = y1 - y0 + 1
      // Een stipje is rond en gevuld; een streepje van een grens of een stukje rivier is langwerpig of dun.
      if (n >= 10 && b >= 4 && h >= 4 && b <= maxZijde && h <= maxZijde && Math.abs(b - h) <= 2 && n / (b * h) > 0.55) {
        vlekjes.push({ x: sx / n, y: sy / n })
      }
    }
  }
  // Rijen van vlekjes op dezelfde hoogte zijn tekst, geen stipjes.
  const rijHoogte = hoogte * 0.004
  const inRij = (v: { y: number }) => vlekjes.filter((w) => Math.abs(w.y - v.y) <= rijHoogte).length >= 4
  const binnen = (p: Punt) => !kader || binnenVierhoek(p, kader)
  return vlekjes
    .filter((v) => !inRij(v))
    .map((v) => ({ x: v.x / breedte, y: v.y / hoogte }))
    .filter(binnen)
}

/** Ligt een punt binnen de vierhoek (in volgorde van de hoeken)? */
export function binnenVierhoek(p: Punt, hoeken: Punt[]): boolean {
  let binnen = false
  for (let i = 0, j = hoeken.length - 1; i < hoeken.length; j = i++) {
    const a = hoeken[i]
    const b = hoeken[j]
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) binnen = !binnen
  }
  return binnen
}

/**
 * Zet een stad op het dichtstbijzijnde stipje, als dat binnen `straal` ligt (fractie van de breedte).
 * Elk stipje wordt hooguit één keer gebruikt; de dichtstbijzijnde paren gaan voor.
 */
export function klikVast<T extends { id: string; x: number; y: number }>(
  steden: T[],
  stippen: Punt[],
  verhouding: number,
  straal = 0.04,
): Map<string, Punt> {
  const paren = steden
    .flatMap((s) => stippen.map((p, i) => ({ s, i, d: Math.hypot(p.x - s.x, (p.y - s.y) * verhouding) })))
    .filter((p) => p.d <= straal)
    .sort((a, b) => a.d - b.d)
  const gebruikt = new Set<number>()
  const uit = new Map<string, Punt>()
  for (const p of paren) {
    if (uit.has(p.s.id) || gebruikt.has(p.i)) continue
    uit.set(p.s.id, stippen[p.i])
    gebruikt.add(p.i)
  }
  return uit
}

// Werken met het kaartbeeld in de browser: bewaren als verkleinde JPEG en afkortingen afdekken.
import type { Rechthoek } from '../bronnen/model'

export function naarJpeg(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/jpeg', 0.85)
}

async function laad(dataUrl: string): Promise<HTMLImageElement> {
  const img = new Image()
  img.src = dataUrl
  await img.decode()
  return img
}

/**
 * Dekt stukken van de kaart af met de kleur eromheen, zodat de afkortingen verdwijnen en de kaart
 * blind wordt. De rand van elk stuk wordt gemeten en het stuk wordt met die gemiddelde kleur gevuld.
 */
export async function dekAf(dataUrl: string, stukken: Rechthoek[]): Promise<string> {
  const img = await laad(dataUrl)
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0)
  for (const r of stukken) {
    // Ruime rand: de herkenning meet de letters vaak net te krap (de B van "Be" bleef staan).
    const hoogte = (r.y1 - r.y0) * canvas.height
    const marge = Math.max(3, Math.round(hoogte * 0.3))
    const x0 = Math.max(0, Math.floor(r.x0 * canvas.width) - marge)
    const y0 = Math.max(0, Math.floor(r.y0 * canvas.height) - marge)
    const x1 = Math.min(canvas.width, Math.ceil(r.x1 * canvas.width) + marge)
    const y1 = Math.min(canvas.height, Math.ceil(r.y1 * canvas.height) + marge)
    const b = x1 - x0
    const h = y1 - y0
    if (b <= 0 || h <= 0) continue
    // Gemiddelde kleur van een smalle rand net buiten het stuk.
    const rand = ctx.getImageData(Math.max(0, x0 - 2), Math.max(0, y0 - 2), Math.min(canvas.width - x0 + 2, b + 4), Math.min(canvas.height - y0 + 2, h + 4))
    let rood = 0
    let groen = 0
    let blauw = 0
    let n = 0
    for (let y = 0; y < rand.height; y++) {
      for (let x = 0; x < rand.width; x++) {
        const opRand = x < 2 || y < 2 || x >= rand.width - 2 || y >= rand.height - 2
        if (!opRand) continue
        const i = (y * rand.width + x) * 4
        rood += rand.data[i]
        groen += rand.data[i + 1]
        blauw += rand.data[i + 2]
        n++
      }
    }
    if (n === 0) continue
    ctx.fillStyle = `rgb(${rood / n}, ${groen / n}, ${blauw / n})`
    ctx.fillRect(x0, y0, b, h)
  }
  return canvas.toDataURL('image/jpeg', 0.85)
}

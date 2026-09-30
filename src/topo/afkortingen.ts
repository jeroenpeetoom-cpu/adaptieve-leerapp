// Afkortingen op een ingevulde kaart koppelen aan plekken van het werkblad. Pure module.
import { sleutel, type Soort, type WerkbladPlek } from './werkblad'

/** Een stukje tekst op de kaart, met positie als fractie van de kaartafmetingen (0 tot 1). */
export interface KaartLabel {
  tekst: string
  zekerheid: number
  x0: number
  y0: number
  x1: number
  y1: number
}

export interface VoorgesteldePlek {
  naam: string
  soort: Soort
  toetsstof: boolean
  /** De afkorting op de kaart; null als de app hem niet vond (dan aantikken). */
  label: KaartLabel | null
  /** Andere namen die bij dezelfde afkorting passen, zoals Luik en Luxemburg bij "Lu". */
  alternatieven: string[]
}

const MIN_ZEKERHEID = 60

/** Letters die de herkenning vaak verwisselt bij korte afkortingen. */
const VERWISSELD: Record<string, string> = { i: 'l', l: 'i', '1': 'l', '0': 'o', e: 'c', c: 'e' }

function varianten(token: string): string[] {
  const t = token.toLowerCase()
  const uit = new Set([t])
  for (let i = 0; i < t.length; i++) {
    const v = VERWISSELD[t[i]]
    if (v) uit.add(t.slice(0, i) + v + t.slice(i + 1))
  }
  return [...uit]
}

const schoon = (tekst: string) => tekst.replace(/[^\p{L}]/gu, '')

/** Past het label bij het begin van de naam? */
function past(label: string, naam: string): boolean {
  const n = sleutel(naam)
  return varianten(sleutel(label)).some((v) => v.length >= 2 && n.startsWith(v))
}

function overlapt(a: KaartLabel, b: KaartLabel): boolean {
  return a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1
}

/** Voegt labels samen die twee herkenningen op dezelfde plek vonden. */
export function voegLabelsSamen(labels: KaartLabel[]): KaartLabel[] {
  const uit: KaartLabel[] = []
  for (const l of [...labels].sort((a, b) => b.zekerheid - a.zekerheid)) {
    if (!uit.some((u) => overlapt(u, l))) uit.push(l)
  }
  return uit
}

/**
 * Koppelt afkortingen aan plekken. Elke plek van het werkblad komt in het voorstel, met of zonder label.
 * Een afkorting die bij geen plek van de lijsten past, wordt opgezocht in de losse woorden van het
 * werkblad (bijvoorbeeld "Oo" wordt Oostende); zo'n plek is geen toetsstof en krijgt als soort stad.
 */
export function koppelAfkortingen(labels: KaartLabel[], plekken: WerkbladPlek[], woorden: string[]): VoorgesteldePlek[] {
  const bruikbaar = voegLabelsSamen(
    labels
      .map((l) => ({ ...l, tekst: schoon(l.tekst) }))
      .filter((l) => l.zekerheid >= MIN_ZEKERHEID && /^\p{L}{2,4}$/u.test(l.tekst) && /^\p{Lu}/u.test(l.tekst)),
  )

  const voorstel: VoorgesteldePlek[] = plekken.map((p) => ({ ...p, label: null, alternatieven: [] }))
  const vrij = new Set(bruikbaar)

  // Eerst de labels die maar bij één plek passen, daarna de dubbelzinnige.
  // Landen hebben meestal een afkorting van drie letters ("Bel", "Lux"), de rest van twee.
  const kandidaten = (l: KaartLabel) =>
    voorstel
      .filter((p) => p.label === null && past(l.tekst, p.naam))
      .sort((a, b) => Number((b.soort === 'land') === (l.tekst.length >= 3)) - Number((a.soort === 'land') === (l.tekst.length >= 3)))
  for (const ronde of [1, 2]) {
    for (const l of [...vrij].sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0)) {
      const k = kandidaten(l)
      if (k.length === 0 || (ronde === 1 && k.length > 1)) continue
      // Bij meerdere kandidaten: de langste passende naamlengte eerst, en de rest als alternatief.
      const gekozen = k[0]
      gekozen.label = l
      gekozen.alternatieven = voorstel.filter((p) => p !== gekozen && p.label === null && past(l.tekst, p.naam)).map((p) => p.naam)
      vrij.delete(l)
    }
  }

  // Afkortingen zonder plek: zoek een woord van het werkblad dat ermee begint.
  const bekend = new Set(voorstel.map((p) => sleutel(p.naam)))
  for (const l of [...vrij].sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0)) {
    const woord = woorden.find((w) => !bekend.has(sleutel(w)) && past(l.tekst, w))
    if (!woord) continue
    bekend.add(sleutel(woord))
    voorstel.push({ naam: woord, soort: 'stad', toetsstof: false, label: l, alternatieven: [] })
    vrij.delete(l)
  }

  // Dezelfde afkorting bij twee plekken (Lu, Ma): markeer beide als dubbelzinnig voor de controle.
  // Een alternatief dat inmiddels een eigen, andere afkorting kreeg, vervalt.
  for (const p of voorstel) {
    if (!p.label) continue
    p.alternatieven = p.alternatieven.filter((naam) =>
      voorstel.some((q) => q !== p && q.naam === naam && (!q.label || sleutel(q.label.tekst) === sleutel(p.label!.tekst))),
    )
    const zelfde = voorstel.filter((q) => q !== p && q.label && sleutel(q.label.tekst) === sleutel(p.label!.tekst) && q.naam !== p.naam)
    p.alternatieven = [...new Set([...p.alternatieven, ...zelfde.map((q) => q.naam)])]
  }
  return voorstel
}

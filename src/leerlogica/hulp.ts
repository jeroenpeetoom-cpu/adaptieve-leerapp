import type { Hulp, Leeritem } from './types'

/** Van meest naar minst zelfstandig. */
export const HULP_VOLGORDE: Hulp[] = ['vrij opgehaald', 'met hint', 'herkend', 'na voorbeeld']

/** De zwaarste van twee soorten hulp: eenmaal gekregen hulp gaat niet terug. */
export function zwaarsteHulp(a: Hulp, b: Hulp): Hulp {
  return HULP_VOLGORDE.indexOf(a) >= HULP_VOLGORDE.indexOf(b) ? a : b
}

/**
 * Een hint verwijst naar het eigen geheugenbeeld als dat er is; anders noemt hij de eerste letter
 * en het aantal letters.
 */
export function hintVoor(item: Leeritem, geheugenbeeld?: string | null): string {
  if (geheugenbeeld && geheugenbeeld.trim() !== '') return `Denk aan je beeld: "${geheugenbeeld.trim()}".`
  const antwoord = item.toegestaneAntwoorden[0]
  const letters = antwoord.replace(/[^\p{L}]/gu, '').length
  return `Het begint met een "${antwoord[0]}" en heeft ${letters} ${letters === 1 ? 'letter' : 'letters'}.`
}

function zaad(tekst: string): () => number {
  let h = 2166136261
  for (let i = 0; i < tekst.length; i++) h = Math.imul(h ^ tekst.charCodeAt(i), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

/**
 * Vier opties voor meerkeuze: het goede antwoord en drie andere antwoorden uit dezelfde bron,
 * in een vaste volgorde per `zaadTekst` zodat de opties niet verspringen.
 */
export function optiesVoor(item: Leeritem, bronItems: Leeritem[], zaadTekst: string): string[] {
  const goed = item.toegestaneAntwoorden[0]
  const kandidaten = bronItems.filter((i) => i.bronId === item.bronId && i.id !== item.id && i.oefenrichting.naar === item.oefenrichting.naar)
  // Bij een plek: eerst namen van dezelfde soort (steden bij een stad), dan de rest.
  const opVolgorde = item.plek ? [...kandidaten.filter((i) => i.plek?.soort === item.plek!.soort), ...kandidaten.filter((i) => i.plek?.soort !== item.plek!.soort)] : kandidaten
  const anderen = [...new Set(opVolgorde.map((i) => i.toegestaneAntwoorden[0]).filter((a) => !item.toegestaneAntwoorden.includes(a)))]
  if (item.plek) {
    // Houd de volgorde van soort aan: schud alleen binnen de eerste drie.
    const kans = zaad(zaadTekst)
    const drie = anderen.slice(0, 3)
    return [goed, ...drie].map((waarde) => ({ waarde, k: kans() })).sort((a, b) => a.k - b.k).map((x) => x.waarde)
  }
  const kans = zaad(zaadTekst)
  const schud = <T,>(lijst: T[]) =>
    lijst
      .map((waarde) => ({ waarde, k: kans() }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.waarde)
  return schud([goed, ...schud(anderen).slice(0, 3)])
}

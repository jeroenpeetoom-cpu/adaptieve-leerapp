import type { Hulp, Leeritem } from './types'

/** Van meest naar minst zelfstandig. */
export const HULP_VOLGORDE: Hulp[] = ['vrij opgehaald', 'met hint', 'herkend', 'na voorbeeld']

/** De zwaarste van twee soorten hulp: eenmaal gekregen hulp gaat niet terug. */
export function zwaarsteHulp(a: Hulp, b: Hulp): Hulp {
  return HULP_VOLGORDE.indexOf(a) >= HULP_VOLGORDE.indexOf(b) ? a : b
}

/** Hint zonder geheugenbeeld: eerste letter en aantal letters. */
export function hintVoor(item: Leeritem): string {
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
  const anderen = [
    ...new Set(
      bronItems
        .filter((i) => i.bronId === item.bronId && i.id !== item.id && i.oefenrichting.naar === item.oefenrichting.naar)
        .map((i) => i.toegestaneAntwoorden[0])
        .filter((a) => !item.toegestaneAntwoorden.includes(a)),
    ),
  ]
  const kans = zaad(zaadTekst)
  const schud = <T,>(lijst: T[]) =>
    lijst
      .map((waarde) => ({ waarde, k: kans() }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.waarde)
  return schud([goed, ...schud(anderen).slice(0, 3)])
}

import type { Oordeel } from './types'

const LIDWOORDEN = ['de', 'het', 'een', 'the', 'a', 'an']

/** Minimale lengte van het toegestane antwoord waarbij een kleine spelfout "bijna" is. */
export const MINIMALE_LENGTE_BIJNA = 5

/**
 * Hoofdletters, spaties, leestekens en een lidwoord aan het begin tellen niet mee.
 * Dezelfde regel bepaalt ook of een wijziging een nieuwe bronversie maakt.
 */
export function normaliseer(tekst: string): string {
  const woorden = tekst
    .toLowerCase()
    .replace(/[\p{P}\p{S}]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
  if (woorden.length > 1 && LIDWOORDEN.includes(woorden[0])) woorden.shift()
  return woorden.join(' ')
}

/** Afstand in bewerkingen: vervangen, toevoegen, weglaten, of twee naast elkaar liggende letters omdraaien. */
function bewerkingsafstand(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const kosten = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + kosten)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
      }
    }
  }
  return d[a.length][b.length]
}

/** Beoordeelt een antwoord; null betekent dat de leerling op "niet geweten" tikte. */
export function beoordeel(antwoord: string | null, toegestaneAntwoorden: string[]): Oordeel {
  if (antwoord === null) return 'niet geweten'
  const gegeven = normaliseer(antwoord)
  if (gegeven === '') return 'niet geweten'
  const toegestaan = toegestaneAntwoorden.map(normaliseer)
  if (toegestaan.includes(gegeven)) return 'goed'
  const bijna = toegestaan.some(
    (t) => t.length >= MINIMALE_LENGTE_BIJNA && bewerkingsafstand(gegeven, t) === 1,
  )
  return bijna ? 'bijna' : 'fout'
}

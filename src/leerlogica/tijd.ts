import type { Tijdstip } from './types'

/** Lokale kalenderdag (JJJJ-MM-DD) van een tijdstip in de gegeven tijdzone. */
export function kalenderdag(tijdstip: Tijdstip, tijdzone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tijdzone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(tijdstip))
}

function naarUtc(dag: string): number {
  const [j, m, d] = dag.split('-').map(Number)
  return Date.UTC(j, m - 1, d)
}

export function telDagenOp(dag: string, dagen: number): string {
  return new Date(naarUtc(dag) + dagen * 86_400_000).toISOString().slice(0, 10)
}

/** Aantal kalenderdagen van `van` tot `tot` (positief als `tot` later is). */
export function dagenTussen(van: string, tot: string): number {
  return Math.round((naarUtc(tot) - naarUtc(van)) / 86_400_000)
}

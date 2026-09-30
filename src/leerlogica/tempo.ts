import type { Instellingen } from './instellingen'
import type { Poging } from './types'

/** Hoe lang de leerling gemiddeld bezig is met een herhaling en met een nieuw leeritem, in seconden. */
export interface Tempo {
  herhalingSec: number
  nieuwSec: number
}

/** Pas met zoveel metingen vervangt het eigen tempo de schatting. */
const MIN_METINGEN = 5
/** Alleen de laatste metingen tellen, zodat het tempo meegroeit. */
const LAATSTE_METINGEN = 30

function mediaan(waarden: number[]): number {
  const s = [...waarden].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/**
 * Meet het tempo uit de tijd tussen opeenvolgende pogingen in dezelfde sessie. De tijd tot de volgende
 * poging hoort bij de poging ervoor (feedback, eventueel leermoment, en de volgende vraag). Een poging die
 * de allereerste op een leeritem is, telt als nieuw. Pauzes tellen niet mee. Tempo is alleen voor het
 * plannen van sessies, nooit een oordeel over de leerling.
 */
export function berekenTempo(pogingen: Poging[], instellingen: Instellingen): Tempo {
  const opVolgorde = [...pogingen].sort((a, b) => a.tijdstip.localeCompare(b.tijdstip))
  const gezien = new Set<string>()
  const herhaling: number[] = []
  const nieuw: number[] = []
  for (let i = 0; i < opVolgorde.length; i++) {
    const p = opVolgorde[i]
    const eerste = !gezien.has(p.leeritemId)
    gezien.add(p.leeritemId)
    const volgende = opVolgorde[i + 1]
    if (!volgende || volgende.sessieId !== p.sessieId) continue
    const sec = (new Date(volgende.tijdstip).getTime() - new Date(p.tijdstip).getTime()) / 1000
    if (sec <= 0 || sec > instellingen.pauzeGrensSec) continue
    ;(eerste ? nieuw : herhaling).push(sec)
  }
  const schat = (metingen: number[], schatting: number) =>
    metingen.length >= MIN_METINGEN ? mediaan(metingen.slice(-LAATSTE_METINGEN)) : schatting
  return {
    herhalingSec: schat(herhaling, instellingen.schattingHerhalingSec),
    nieuwSec: schat(nieuw, instellingen.schattingNieuwSec),
  }
}

import type { Instellingen } from './instellingen'
import type { Poging } from './types'

/** Hoe lang de leerling gemiddeld bezig is met een herhaling en met een nieuw leeritem, in seconden. */
export interface Tempo {
  herhalingSec: number
  nieuwSec: number
  /**
   * Kans dat een nieuw leeritem niet goed gaat en daardoor binnen de sessie nog een keer terugkomt.
   * Ontbreekt: geen terugkomers meerekenen.
   */
  terugkans?: number
}

/** Zolang er te weinig metingen zijn: de meeste nieuwe woorden kent de leerling nog niet. */
const SCHATTING_TERUGKANS = 0.7
/** Een antwoord van deze lengte (in tekens) kost de gemeten tijd; langere naar verhouding meer. */
const REFERENTIELENGTE = 12
/** Ook een heel lange zin telt hooguit zoveel keer een gewoon woord. */
const MAX_LENGTEFACTOR = 4

/** Hoeveel keer zo lang een leeritem duurt als een gewoon woord, door de lengte van het antwoord. */
export function lengtefactor(antwoord: string): number {
  return Math.min(MAX_LENGTEFACTOR, Math.max(1, antwoord.trim().length / REFERENTIELENGTE))
}

/** Geschatte seconden voor een herhaling van dit leeritem. */
export function duurHerhaling(tempo: Tempo, antwoord: string): number {
  return tempo.herhalingSec * lengtefactor(antwoord)
}

/** Geschatte seconden voor een nieuw leeritem, inclusief de kans dat het binnen de sessie terugkomt. */
export function duurNieuw(tempo: Tempo, antwoord: string): number {
  return (tempo.nieuwSec + (tempo.terugkans ?? 0) * tempo.herhalingSec) * lengtefactor(antwoord)
}

/** Pas met zoveel metingen vervangt het eigen tempo de schatting. */
const MIN_METINGEN = 5
/** Alleen de laatste metingen tellen, zodat het tempo meegroeit. */
const LAATSTE_METINGEN = 30

/** Gemiddelde: voor een optelsom over een hele sessie telt ook de lange staart mee (een mediaan schat te laag). */
function gemiddelde(waarden: number[]): number {
  return waarden.reduce((a, b) => a + b, 0) / waarden.length
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
  let nieuwNietGoed = 0
  let nieuwTotaal = 0
  for (let i = 0; i < opVolgorde.length; i++) {
    const p = opVolgorde[i]
    const eerste = !gezien.has(p.leeritemId)
    gezien.add(p.leeritemId)
    if (eerste) {
      nieuwTotaal++
      if (p.oordeel !== 'goed') nieuwNietGoed++
    }
    const volgende = opVolgorde[i + 1]
    if (!volgende || volgende.sessieId !== p.sessieId) continue
    const sec = (new Date(volgende.tijdstip).getTime() - new Date(p.tijdstip).getTime()) / 1000
    if (sec <= 0 || sec > instellingen.pauzeGrensSec) continue
    ;(eerste ? nieuw : herhaling).push(sec)
  }
  const schat = (metingen: number[], schatting: number) =>
    metingen.length >= MIN_METINGEN ? gemiddelde(metingen.slice(-LAATSTE_METINGEN)) : schatting
  return {
    herhalingSec: schat(herhaling, instellingen.schattingHerhalingSec),
    nieuwSec: schat(nieuw, instellingen.schattingNieuwSec),
    terugkans: nieuwTotaal >= MIN_METINGEN ? nieuwNietGoed / nieuwTotaal : SCHATTING_TERUGKANS,
  }
}

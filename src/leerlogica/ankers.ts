import { windrichting, type Punt } from './kaarttik'

export interface Ankerkandidaat extends Punt {
  naam: string
}

export interface Anker {
  naam: string
  /** De windrichting van het anker naar de plek: de plek ligt ten <richting> van het anker. */
  richting: string
}

/** Te dichtbij om een zinnige windrichting te geven (bijvoorbeeld een stad in een gebied). */
const TE_DICHTBIJ = 0.02

/**
 * Kiest de ankers voor een plek: de dichtstbijzijnde plekken die de leerling al kent (de ouder kiest
 * welke kandidaten dat zijn), met de windrichting van het anker naar de plek.
 */
export function kiesAnkers(doel: Punt & { naam: string }, kandidaten: Ankerkandidaat[], verhouding: number, max = 2): Anker[] {
  return kandidaten
    .filter((k) => k.naam !== doel.naam)
    .map((k) => ({ k, d: Math.hypot(k.x - doel.x, (k.y - doel.y) * verhouding) }))
    .filter(({ d }) => d > TE_DICHTBIJ)
    .sort((a, b) => a.d - b.d)
    .slice(0, max)
    .map(({ k }) => ({ naam: k.naam, richting: windrichting(k, doel, verhouding) }))
}

/** "Antwerpen ligt ten noorden van Brussel en ten westen van Hasselt." */
export function ankerzin(naam: string, ankers: Anker[]): string | null {
  if (ankers.length === 0) return null
  const delen = ankers.map((a) => `ten ${a.richting} van ${a.naam}`)
  return `${naam} ligt ${delen.join(' en ')}.`
}

/** Een hint met het dichtstbijzijnde anker: "Kijk ten noorden van Brussel." */
export function ankerhint(ankers: Anker[]): string | null {
  return ankers.length === 0 ? null : `Kijk ten ${ankers[0].richting} van ${ankers[0].naam}.`
}

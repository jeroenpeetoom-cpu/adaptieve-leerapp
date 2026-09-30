import type { Instellingen } from './instellingen'
import type { Leeritem, Poging } from './types'
import { berekenVoortgang } from './voortgang'

/** Punten per onderdeel (spec, vraag 51). */
export const PUNTEN = {
  missie: 10,
  codewoord: 1,
  zelfTeruggehaald: 5,
  laterNogGeweten: 10,
  strategiestap: 20,
} as const

export interface Puntentelling {
  missies: number
  codewoorden: number
  zelfTeruggehaald: number
  laterNogGeweten: number
  strategie: number
  totaal: number
}

/**
 * Telt de punten: volhouden (afgeronde missies), vooruitgang (codewoorden, en per leeritem de eerste keer
 * zelf teruggehaald en later nog geweten, ook als het daarna weer vergeten is) en leren leren
 * (bereikte strategiestappen). Punten laten motivatie zien; de echte maatstaf blijft de voortgangsstatus.
 */
export function telPunten(
  pogingen: Poging[],
  afgerondeMissies: number,
  strategiestappen: number,
  instellingen: Instellingen,
): Puntentelling {
  const codewoorden = pogingen.filter((p) => p.oordeel === 'goed' && p.hulp === 'vrij opgehaald' && !p.antwoordZelfToegevoegd).length
  let zelf = 0
  let later = 0
  const perItem = new Map<string, Set<number>>()
  for (const p of pogingen) perItem.set(p.leeritemId, (perItem.get(p.leeritemId) ?? new Set()).add(p.bronversie))
  for (const [id, versies] of perItem) {
    let hoogste = 0
    for (const bronversie of versies) {
      const { hoogsteOoit } = berekenVoortgang({ id, bronversie } as Leeritem, pogingen, instellingen)
      hoogste = Math.max(hoogste, hoogsteOoit === 'later nog geweten' ? 2 : hoogsteOoit === 'zelf teruggehaald' ? 1 : 0)
    }
    if (hoogste >= 1) zelf++
    if (hoogste >= 2) later++
  }
  const t = {
    missies: afgerondeMissies * PUNTEN.missie,
    codewoorden: codewoorden * PUNTEN.codewoord,
    zelfTeruggehaald: zelf * PUNTEN.zelfTeruggehaald,
    laterNogGeweten: later * PUNTEN.laterNogGeweten,
    strategie: strategiestappen * PUNTEN.strategiestap,
  }
  return { ...t, totaal: t.missies + t.codewoorden + t.zelfTeruggehaald + t.laterNogGeweten + t.strategie }
}

export const RANGEN = [
  { naam: 'Verkenner', vanaf: 0 },
  { naam: 'Piloot', vanaf: 250 },
  { naam: 'Kapitein', vanaf: 750 },
  { naam: 'Commandant', vanaf: 1500 },
  { naam: 'Admiraal', vanaf: 3000 },
] as const

export interface Rang {
  naam: string
  /** De volgende rang, of null bij de hoogste. */
  volgende: { naam: string; vanaf: number } | null
  /** Hoe ver op weg naar de volgende rang, 0 tot 1. */
  voortgang: number
}

export function rangVan(punten: number): Rang {
  const i = RANGEN.findLastIndex((r) => punten >= r.vanaf)
  const huidig = RANGEN[i]
  const volgende = RANGEN[i + 1] ?? null
  return {
    naam: huidig.naam,
    volgende,
    voortgang: volgende ? (punten - huidig.vanaf) / (volgende.vanaf - huidig.vanaf) : 1,
  }
}

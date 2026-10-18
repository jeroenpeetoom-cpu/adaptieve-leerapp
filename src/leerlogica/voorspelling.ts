// Zelfinschatting als leercyclus: vooraf voorspellen, achteraf vergelijken met bewijs, en de volgende keer
// terugkomen op de vorige inschatting (spec leren-leren, S1).
import type { SessieToestand } from './sessie'
import type { Leeritem } from './types'

export interface Voorspelling {
  /** Hoeveel van de herhalingen de leerling denkt zonder hulp te weten. */
  aantal: number
  /** Over hoeveel herhalingen de voorspelling gaat. */
  van: number
  /** Welke formulering van de vraag gesteld is, voor variatie. */
  variant: number
}

/** De vraag in een paar formuleringen; {n} is het aantal herhalingen. */
export const VOORSPELVRAGEN = [
  'Je krijgt {n} woorden die je al eerder oefende. Hoeveel weet je nog zonder hulp, denk je?',
  'Voorspel eens: hoeveel van deze {n} haal je straks zelf terug?',
  'Deze {n} heb je al eens geleerd. Hoeveel zitten er nog in je hoofd?',
]

export function voorspelvraag(variant: number, n: number): string {
  return VOORSPELVRAGEN[variant % VOORSPELVRAGEN.length].replace('{n}', String(n))
}

/** Kiest een andere formulering dan de vorige keer. */
export function volgendeVariant(vorige: number | null): number {
  return vorige === null ? 0 : (vorige + 1) % VOORSPELVRAGEN.length
}

/** De geplande leeritems die de leerling vóór deze sessie al eens oefende: daarover kan hij iets voorspellen. */
export function voorspelbareItems(toestand: SessieToestand): Leeritem[] {
  const gepland = toestand.leeritems.slice(0, toestand.aantalGepland ?? toestand.leeritems.length)
  const uniek = [...new Map(gepland.map((i) => [i.id, i])).values()]
  return uniek.filter((i) => i.id in toestand.laatsteOordeelVooraf)
}

/** Moet de sessie beginnen met een voorspelling? Alleen aan het begin, met herhalingen, en één keer. */
export function voorspellingNodig(toestand: SessieToestand): boolean {
  return (
    toestand.voorspelling === undefined &&
    toestand.huidige === 0 &&
    toestand.pogingen.length === 0 &&
    voorspelbareItems(toestand).length > 0
  )
}

/** Legt de voorspelling vast; null betekent overgeslagen. */
export function voorspel(toestand: SessieToestand, aantal: number | null, variant: number): SessieToestand {
  const van = voorspelbareItems(toestand).length
  return { ...toestand, voorspelling: aantal === null ? null : { aantal: Math.max(0, Math.min(van, aantal)), van, variant } }
}

/** Het bewijs: hoeveel van de voorspelde leeritems bij de eerste poging goed en zonder hulp gingen. */
export function uitkomstVoorspelling(toestand: SessieToestand): { voorspeld: number; uitkomst: number; van: number } | null {
  const v = toestand.voorspelling
  if (!v) return null
  const ids = new Set(voorspelbareItems(toestand).map((i) => i.id))
  const eerste = new Map<string, (typeof toestand.pogingen)[number]>()
  for (const p of toestand.pogingen) if (ids.has(p.leeritemId) && !eerste.has(p.leeritemId)) eerste.set(p.leeritemId, p)
  const uitkomst = [...eerste.values()].filter((p) => p.oordeel === 'goed' && p.hulp === 'vrij opgehaald' && !p.antwoordZelfToegevoegd).length
  return { voorspeld: v.aantal, uitkomst, van: v.van }
}

/** Korte duiding van het verschil tussen inschatting en bewijs, zonder oordeel over de leerling. */
export function duidVoorspelling(voorspeld: number, uitkomst: number): string {
  if (voorspeld === uitkomst) return 'Je inschatting klopte precies. Je weet goed wat je al kunt.'
  if (uitkomst > voorspeld) return 'Je wist meer dan je dacht. Dat mag je de volgende keer best vertrouwen.'
  return 'Je dacht dat je meer wist. Goed om te merken: die woorden komen snel terug, zodat je ze echt leert.'
}

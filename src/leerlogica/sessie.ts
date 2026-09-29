import { beoordeel } from './antwoordcontrole'
import type { Hulp, Leeritem, Poging, Tijdstip } from './types'
import { REGELVERSIE } from './versie'

/**
 * Het verloop van één sessie. Na "bijna" krijgt de leerling meteen een nieuwe kans met hulp
 * "met hint"; elk ander oordeel sluit het leeritem voor nu af.
 */
export interface SessieToestand {
  sessieId: string
  leeritems: Leeritem[]
  /** Index van het huidige leeritem; gelijk aan leeritems.length als de sessie klaar is. */
  huidige: number
  /** Hulp voor de volgende poging op het huidige leeritem. */
  volgendeHulp: Hulp
  pogingen: Poging[]
}

export interface Antwoord {
  /** Wordt gemaakt als de vraag verschijnt, zodat dubbel verzenden geen dubbele poging geeft. */
  pogingId: string
  /** null als de leerling op "niet geweten" tikte. */
  antwoord: string | null
  tijdstip: Tijdstip
}

export function startSessie(sessieId: string, leeritems: Leeritem[]): SessieToestand {
  return { sessieId, leeritems, huidige: 0, volgendeHulp: 'vrij opgehaald', pogingen: [] }
}

export function huidigLeeritem(toestand: SessieToestand): Leeritem | undefined {
  return toestand.leeritems[toestand.huidige]
}

export function isKlaar(toestand: SessieToestand): boolean {
  return toestand.huidige >= toestand.leeritems.length
}

/** Het leeritem is afgesloten en de leerling moet eerst "volgende" kiezen. */
export function wachtOpVolgende(toestand: SessieToestand): boolean {
  const laatste = toestand.pogingen.at(-1)
  const item = huidigLeeritem(toestand)
  if (!laatste || !item || laatste.leeritemId !== item.id) return false
  return !(laatste.oordeel === 'bijna' && laatste.hulp === 'vrij opgehaald')
}

export function beantwoord(
  toestand: SessieToestand,
  invoer: Antwoord,
): { toestand: SessieToestand; poging: Poging | null } {
  const item = huidigLeeritem(toestand)
  const alGezien = toestand.pogingen.some((p) => p.id === invoer.pogingId)
  if (!item || alGezien || wachtOpVolgende(toestand)) return { toestand, poging: null }

  const oordeel = beoordeel(invoer.antwoord, item.toegestaneAntwoorden)
  const poging: Poging = {
    id: invoer.pogingId,
    sessieId: toestand.sessieId,
    leeritemId: item.id,
    bronversie: item.bronversie,
    antwoord: invoer.antwoord,
    oordeel,
    hulp: toestand.volgendeHulp,
    antwoordZelfToegevoegd: false,
    tijdstip: invoer.tijdstip,
    regelversie: REGELVERSIE,
  }
  const nieuweKans = oordeel === 'bijna' && toestand.volgendeHulp === 'vrij opgehaald'
  return {
    toestand: {
      ...toestand,
      volgendeHulp: nieuweKans ? 'met hint' : toestand.volgendeHulp,
      pogingen: [...toestand.pogingen, poging],
    },
    poging,
  }
}

export function volgende(toestand: SessieToestand): SessieToestand {
  if (!wachtOpVolgende(toestand)) return toestand
  return { ...toestand, huidige: toestand.huidige + 1, volgendeHulp: 'vrij opgehaald' }
}

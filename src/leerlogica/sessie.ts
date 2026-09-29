import { beoordeel } from './antwoordcontrole'
import type { Hulp, Leeritem, Poging, Tijdstip } from './types'
import { REGELVERSIE } from './versie'

/**
 * Het verloop van één sessie. Na "bijna" krijgt de leerling meteen een nieuwe kans met hulp
 * "met hint"; elk ander oordeel sluit het leeritem voor nu af. Een leeritem dat niet goed ging,
 * komt aan het eind van de sessie één keer terug.
 */
export interface SessieToestand {
  sessieId: string
  /** De wachtrij; groeit als een leeritem terugkomt. */
  leeritems: Leeritem[]
  /** Positie in de wachtrij; gelijk aan leeritems.length als de sessie klaar is. */
  huidige: number
  /** Hulp voor de volgende poging op de huidige positie. */
  volgendeHulp: Hulp
  /** Aantal pogingen op de huidige positie. */
  pogingenBijHuidige: number
  /** Leeritems die al één keer zijn teruggezet. */
  teruggezet: string[]
  pogingen: Poging[]
}

export interface Antwoord {
  /** Vast per poging, zodat dubbel verzenden geen dubbele poging geeft. */
  pogingId: string
  /** null als de leerling op "niet geweten" tikte. */
  antwoord: string | null
  tijdstip: Tijdstip
}

export function startSessie(sessieId: string, leeritems: Leeritem[]): SessieToestand {
  return {
    sessieId,
    leeritems,
    huidige: 0,
    volgendeHulp: 'vrij opgehaald',
    pogingenBijHuidige: 0,
    teruggezet: [],
    pogingen: [],
  }
}

export function huidigLeeritem(toestand: SessieToestand): Leeritem | undefined {
  return toestand.leeritems[toestand.huidige]
}

export function isKlaar(toestand: SessieToestand): boolean {
  return toestand.huidige >= toestand.leeritems.length
}

/** Het leeritem op de huidige positie is afgesloten en de leerling moet eerst "volgende" kiezen. */
export function wachtOpVolgende(toestand: SessieToestand): boolean {
  if (toestand.pogingenBijHuidige === 0) return false
  const laatste = toestand.pogingen.at(-1)!
  return !(laatste.oordeel === 'bijna' && laatste.hulp === 'vrij opgehaald')
}

/** Aantal leeritems dat nog komt, inclusief het huidige. */
export function nogTeGaan(toestand: SessieToestand): number {
  return toestand.leeritems.length - toestand.huidige
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
      pogingenBijHuidige: toestand.pogingenBijHuidige + 1,
      pogingen: [...toestand.pogingen, poging],
    },
    poging,
  }
}

export function volgende(toestand: SessieToestand): SessieToestand {
  if (!wachtOpVolgende(toestand)) return toestand
  const item = huidigLeeritem(toestand)!
  const laatste = toestand.pogingen.at(-1)!
  const terugzetten = laatste.oordeel !== 'goed' && !toestand.teruggezet.includes(item.id)
  return {
    ...toestand,
    leeritems: terugzetten ? [...toestand.leeritems, item] : toestand.leeritems,
    teruggezet: terugzetten ? [...toestand.teruggezet, item.id] : toestand.teruggezet,
    huidige: toestand.huidige + 1,
    volgendeHulp: 'vrij opgehaald',
    pogingenBijHuidige: 0,
  }
}

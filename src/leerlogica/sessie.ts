import { beoordeel } from './antwoordcontrole'
import { zwaarsteHulp } from './hulp'
import type { Hulp, Leeritem, Oordeel, Poging, Strategie, Tijdstip } from './types'
import { REGELVERSIE } from './versie'

export type Vorm = 'typen' | 'meerkeuze'

/**
 * Het verloop van één sessie.
 * - Op een typvraag krijgt de leerling na "bijna" of "fout" één nieuwe kans met hulp "met hint".
 *   Bij een nieuw leeritem (de voorkennischeck) geldt dat alleen voor "bijna": wie een woord nog
 *   niet kent, krijgt meteen een leermoment in plaats van een hint.
 * - Daarna, of na "niet geweten", is het leeritem afgesloten en ziet de leerling het antwoord.
 * - Een leeritem dat niet goed ging, komt een paar vragen later één keer terug.
 * - Was de laatste poging op een leeritem fout of niet geweten, dan komt het als meerkeuze
 *   (hulp "herkend"); na een goede meerkeuze is het weer een typvraag.
 * - Een nieuw leeritem begint met een raadvraag (meerkeuze). De gok zelf is geen poging. Goed gegokt:
 *   daarna de voorkennischeck als typvraag, die gewoon telt. Fout gegokt of geen idee: de leerling
 *   kende het nog niet, dat wordt "niet geweten" en het leermoment volgt.
 *   Bij aanwijzen is de eerste tik op de kaart zelf al de raadvraag.
 * - Een sessie kan beginnen met een toetsronde: leeritems in schoolvorm, zonder hulp, zonder nieuwe kans
 *   en zonder tussentijdse feedback. Na de ronde volgt de uitslag; wat niet goed ging komt daarna terug.
 */
export interface SessieToestand {
  sessieId: string
  /** De wachtrij; groeit als een leeritem terugkomt. */
  leeritems: Leeritem[]
  /** Positie in de wachtrij; gelijk aan leeritems.length als de sessie klaar is. */
  huidige: number
  vorm: Vorm
  /** Hulp die de leerling op de huidige positie al kreeg. */
  hulp: Hulp
  pogingenBijHuidige: number
  afgesloten: boolean
  /** Leeritems die al één keer zijn teruggezet. */
  teruggezet: string[]
  pogingen: Poging[]
  /** Laatste oordeel per leeritem van vóór deze sessie, voor de meerkeuze-opstap. */
  laatsteOordeelVooraf: Record<string, Oordeel>
  /** De strategie waarmee een leeritem geleerd is, om bij elke poging vast te leggen. */
  strategiePerItem: Record<string, Strategie>
  /** Aantal leeritems waarmee de sessie begon; daarna volgen de teruggezette leeritems. */
  aantalGepland?: number
  /** Per nieuw leeritem of de raadvraag goed gegokt was. */
  geraden?: Record<string, boolean>
  /** Aantal leeritems aan het begin van de wachtrij dat in toetsvorm gesteld wordt. */
  toetsronde?: number
  /** De leerling heeft de uitslag van de toetsronde gezien. */
  toetsUitslagGezien?: boolean
}

export interface Antwoord {
  /** Vast per poging, zodat dubbel verzenden geen dubbele poging geeft. */
  pogingId: string
  /** null als de leerling op "niet geweten" tikte. */
  antwoord: string | null
  tijdstip: Tijdstip
  /** Het antwoord is ingesproken in plaats van getypt. */
  ingesproken?: boolean
  /** Al beoordeeld buiten de antwoordcontrole, zoals een tik op de kaart. */
  oordeel?: Oordeel
}

function laatsteOordeel(toestand: Pick<SessieToestand, 'pogingen' | 'laatsteOordeelVooraf'>, itemId: string) {
  return toestand.pogingen.findLast((p) => p.leeritemId === itemId)?.oordeel ?? toestand.laatsteOordeelVooraf[itemId]
}

function vormVoor(toestand: Pick<SessieToestand, 'pogingen' | 'laatsteOordeelVooraf'>, item?: Leeritem): Vorm {
  if (!item) return 'typen'
  const oordeel = laatsteOordeel(toestand, item.id)
  return oordeel === 'fout' || oordeel === 'niet geweten' ? 'meerkeuze' : 'typen'
}

function opPositie(toestand: SessieToestand, positie: number): SessieToestand {
  const vorm = positie < (toestand.toetsronde ?? 0) ? 'typen' : vormVoor(toestand, toestand.leeritems[positie])
  return {
    ...toestand,
    huidige: positie,
    vorm,
    hulp: vorm === 'meerkeuze' ? 'herkend' : 'vrij opgehaald',
    pogingenBijHuidige: 0,
    afgesloten: false,
  }
}

export function startSessie(
  sessieId: string,
  leeritems: Leeritem[],
  eerderePogingen: Poging[] = [],
  strategiePerItem: Record<string, Strategie> = {},
  /** Zoveel leeritems aan het begin van de wachtrij vormen de toetsronde. */
  toetsronde = 0,
): SessieToestand {
  const laatsteOordeelVooraf: Record<string, Oordeel> = {}
  for (const p of [...eerderePogingen].sort((a, b) => a.tijdstip.localeCompare(b.tijdstip))) {
    laatsteOordeelVooraf[p.leeritemId] = p.oordeel
  }
  const leeg: SessieToestand = {
    sessieId,
    leeritems,
    huidige: 0,
    vorm: 'typen',
    hulp: 'vrij opgehaald',
    pogingenBijHuidige: 0,
    afgesloten: false,
    teruggezet: [],
    pogingen: [],
    laatsteOordeelVooraf,
    strategiePerItem,
    aantalGepland: leeritems.length,
    toetsronde: Math.min(toetsronde, leeritems.length),
  }
  return opPositie(leeg, 0)
}

export function huidigLeeritem(toestand: SessieToestand): Leeritem | undefined {
  return toestand.leeritems[toestand.huidige]
}

export function isKlaar(toestand: SessieToestand): boolean {
  return toestand.huidige >= toestand.leeritems.length && !toetsUitslagNodig(toestand)
}

/** Het huidige leeritem hoort bij de toetsronde. */
export function inToetsronde(toestand: SessieToestand): boolean {
  return toestand.huidige < (toestand.toetsronde ?? 0)
}

/** De toetsronde is voorbij en de leerling moet de uitslag nog zien. */
export function toetsUitslagNodig(toestand: SessieToestand): boolean {
  return (toestand.toetsronde ?? 0) > 0 && toestand.huidige >= toestand.toetsronde! && !toestand.toetsUitslagGezien
}

/** De pogingen van de toetsronde, in volgorde. */
export function toetsUitslag(toestand: SessieToestand): Poging[] {
  return toestand.pogingen.filter((p) => p.toetsvorm)
}

export function uitslagGezien(toestand: SessieToestand): SessieToestand {
  return { ...toestand, toetsUitslagGezien: true }
}

/** Het leeritem op de huidige positie is afgesloten en de leerling moet eerst "volgende" kiezen. */
export function wachtOpVolgende(toestand: SessieToestand): boolean {
  return toestand.afgesloten
}

/** Aantal leeritems dat nog komt, inclusief het huidige. */
export function nogTeGaan(toestand: SessieToestand): number {
  return toestand.leeritems.length - toestand.huidige
}

/** Een leeritem zonder enige poging van vóór deze sessie. */
export function isNieuwLeeritem(toestand: SessieToestand, itemId: string): boolean {
  return !(itemId in toestand.laatsteOordeelVooraf)
}

/** Het huidige leeritem is voor het eerst aan de beurt en de leerling kende het niet: tijd om het te leren. */
export function leermomentNodig(toestand: SessieToestand): boolean {
  const item = huidigLeeritem(toestand)
  const laatste = laatstePogingHier(toestand)
  if (!item || !laatste || !toestand.afgesloten || laatste.oordeel === 'goed') return false
  const eerdereHier = toestand.pogingen.slice(0, -toestand.pogingenBijHuidige).some((p) => p.leeritemId === item.id)
  return isNieuwLeeritem(toestand, item.id) && !eerdereHier
}

/** Het huidige leeritem is nieuw en de leerling heeft nog niet geraden: eerst de raadvraag. */
export function raadvraagNodig(toestand: SessieToestand): boolean {
  const item = huidigLeeritem(toestand)
  if (!item || toestand.afgesloten || toestand.pogingenBijHuidige > 0 || toestand.vorm !== 'typen') return false
  if (item.plek?.richting === 'aanwijzen') return false
  if (toestand.hulp !== 'vrij opgehaald') return false
  return (
    isNieuwLeeritem(toestand, item.id) &&
    !toestand.pogingen.some((p) => p.leeritemId === item.id) &&
    !(item.id in (toestand.geraden ?? {}))
  )
}

/** Legt de gok op de raadvraag vast. Na een foute gok volgt "niet geweten" (via beantwoord met null). */
export function raad(toestand: SessieToestand, goedGegokt: boolean): SessieToestand {
  const item = huidigLeeritem(toestand)
  if (!item || !raadvraagNodig(toestand)) return toestand
  return { ...toestand, geraden: { ...toestand.geraden, [item.id]: goedGegokt } }
}

/** Legt vast met welke strategie een leeritem geleerd wordt. */
export function koppelStrategie(toestand: SessieToestand, itemId: string, strategie: Strategie): SessieToestand {
  return { ...toestand, strategiePerItem: { ...toestand.strategiePerItem, [itemId]: strategie } }
}

/** De laatste poging op de huidige positie, als die er is. */
export function laatstePogingHier(toestand: SessieToestand): Poging | undefined {
  return toestand.pogingenBijHuidige > 0 ? toestand.pogingen.at(-1) : undefined
}

/** De leerling vraagt om hulp: een hint, kiezen uit opties, of een voorbeeld. */
export function vraagHulp(toestand: SessieToestand, soort: Exclude<Hulp, 'vrij opgehaald'>): SessieToestand {
  if (toestand.afgesloten || isKlaar(toestand) || inToetsronde(toestand)) return toestand
  return {
    ...toestand,
    hulp: zwaarsteHulp(toestand.hulp, soort),
    vorm: soort === 'herkend' ? 'meerkeuze' : toestand.vorm,
  }
}

export function beantwoord(
  toestand: SessieToestand,
  invoer: Antwoord,
): { toestand: SessieToestand; poging: Poging | null } {
  const item = huidigLeeritem(toestand)
  const alGezien = toestand.pogingen.some((p) => p.id === invoer.pogingId)
  if (!item || alGezien || toestand.afgesloten) return { toestand, poging: null }

  const oordeel = invoer.oordeel ?? beoordeel(invoer.antwoord, item.toegestaneAntwoorden, item.soort === 'plek')
  const poging: Poging = {
    id: invoer.pogingId,
    sessieId: toestand.sessieId,
    leeritemId: item.id,
    bronversie: item.bronversie,
    antwoord: invoer.antwoord,
    oordeel,
    hulp: toestand.hulp,
    antwoordZelfToegevoegd: false,
    strategie: toestand.strategiePerItem[item.id] ?? null,
    ingesproken: invoer.ingesproken ?? false,
    ...(inToetsronde(toestand) ? { toetsvorm: true } : {}),
    tijdstip: invoer.tijdstip,
    regelversie: REGELVERSIE,
  }
  const voorkennischeck = isNieuwLeeritem(toestand, item.id) && !toestand.pogingen.some((p) => p.leeritemId === item.id)
  const nieuweKans =
    !inToetsronde(toestand) &&
    (oordeel === 'bijna' || (oordeel === 'fout' && !voorkennischeck)) &&
    toestand.vorm === 'typen' &&
    toestand.pogingenBijHuidige === 0 &&
    toestand.hulp !== 'na voorbeeld'
  return {
    toestand: {
      ...toestand,
      hulp: nieuweKans ? zwaarsteHulp(toestand.hulp, 'met hint') : toestand.hulp,
      pogingenBijHuidige: toestand.pogingenBijHuidige + 1,
      afgesloten: !nieuweKans,
      pogingen: [...toestand.pogingen, poging],
    },
    poging,
  }
}

/** Mag de leerling nu zeggen dat zijn antwoord ook goed was? */
export function kanAntwoordToevoegen(toestand: SessieToestand): boolean {
  const laatste = laatstePogingHier(toestand)
  return (
    laatste !== undefined &&
    laatste.antwoord !== null &&
    toestand.vorm === 'typen' &&
    (laatste.oordeel === 'fout' || laatste.oordeel === 'bijna')
  )
}

/**
 * "Mijn antwoord was ook goed": het antwoord wordt een toegestaan antwoord voor de volgende keer.
 * De poging wordt goed, met de markering antwoordZelfToegevoegd, en telt niet als vrij opgehaald.
 */
export function voegAntwoordToe(toestand: SessieToestand): { toestand: SessieToestand; poging: Poging | null } {
  if (!kanAntwoordToevoegen(toestand)) return { toestand, poging: null }
  const laatste = toestand.pogingen.at(-1)!
  const poging: Poging = { ...laatste, oordeel: 'goed', antwoordZelfToegevoegd: true }
  const antwoord = laatste.antwoord!
  const leeritems = toestand.leeritems.map((i) =>
    i.id === laatste.leeritemId ? { ...i, toegestaneAntwoorden: [...i.toegestaneAntwoorden, antwoord] } : i,
  )
  return {
    toestand: { ...toestand, leeritems, afgesloten: true, pogingen: [...toestand.pogingen.slice(0, -1), poging] },
    poging,
  }
}

/** Schudt een lijst in een vaste volgorde per zaad, zodat hervatten dezelfde volgorde geeft. */
function schud<T>(lijst: T[], zaadTekst: string): T[] {
  let h = 2166136261
  for (let i = 0; i < zaadTekst.length; i++) h = Math.imul(h ^ zaadTekst.charCodeAt(i), 16777619)
  const kans = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
  const kopie = [...lijst]
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(kans() * (i + 1))
    ;[kopie[i], kopie[j]] = [kopie[j], kopie[i]]
  }
  return kopie
}

/** Een leeritem dat niet goed ging, komt terug na zoveel andere vragen (of aan het eind als er minder over zijn). */
export const TERUG_NA = 3

/**
 * De plek in de wachtrij waar een teruggezet leeritem komt: een paar vragen later, en niet vlak na of voor
 * een leeritem van hetzelfde woordpaar of dezelfde plek (zoals de andere richting).
 */
function terugPlek(leeritems: Leeritem[], na: number, item: Leeritem): number {
  const buur = (i: number) => leeritems[i]?.woordpaarId === item.woordpaarId
  for (let plek = Math.min(leeritems.length, na + 1 + TERUG_NA); plek <= leeritems.length; plek++) {
    if (!buur(plek - 1) && !buur(plek)) return plek
  }
  return leeritems.length
}

export function volgende(toestand: SessieToestand): SessieToestand {
  if (!toestand.afgesloten) return toestand
  const item = huidigLeeritem(toestand)!
  const laatste = toestand.pogingen.at(-1)!
  const toets = inToetsronde(toestand)
  const terugzetten = !toets && laatste.oordeel !== 'goed' && !toestand.teruggezet.includes(item.id)
  let leeritems = toestand.leeritems
  let teruggezet = toestand.teruggezet
  if (terugzetten) {
    const plek = terugPlek(leeritems, toestand.huidige, item)
    leeritems = [...leeritems.slice(0, plek), item, ...leeritems.slice(plek)]
    teruggezet = [...teruggezet, item.id]
  }
  // Einde van de toetsronde: wat niet goed ging, komt verderop in de sessie terug, verspreid.
  if (toets && toestand.huidige + 1 === toestand.toetsronde) {
    const mis = toetsUitslag(toestand)
      .filter((p) => p.oordeel !== 'goed')
      .map((p) => leeritems.slice(0, toestand.toetsronde).find((i) => i.id === p.leeritemId)!)
      .filter(Boolean)
    mis.forEach((m, k) => {
      const plek = terugPlek(leeritems, toestand.huidige + k * 2, m)
      leeritems = [...leeritems.slice(0, plek), m, ...leeritems.slice(plek)]
    })
    teruggezet = [...teruggezet, ...mis.map((m) => m.id)]
  }
  return opPositie({ ...toestand, leeritems, teruggezet }, toestand.huidige + 1)
}

/**
 * Mengt de volgorde van een sessie willekeurig (vast per zaad, zodat hervatten dezelfde volgorde geeft),
 * zo dat twee leeritems van hetzelfde woordpaar of dezelfde plek (bijvoorbeeld aanwijzen en benoemen van
 * Luik) niet vlak na elkaar komen: er zitten minstens `afstand` andere leeritems tussen, als dat kan.
 */
export function mengVolgorde<T extends { woordpaarId: string }>(items: T[], zaad: string, afstand = 2): T[] {
  const pool = schud(items, zaad)
  const over = new Map<string, number>()
  for (const i of pool) over.set(i.woordpaarId, (over.get(i.woordpaarId) ?? 0) + 1)
  const uit: T[] = []
  while (pool.length > 0) {
    const recent = new Set(uit.slice(-afstand).map((i) => i.woordpaarId))
    // Kies uit wat mag het item waarvan er nog de meeste over zijn; zo blijven er aan het eind geen paren over.
    let index = -1
    for (let i = 0; i < pool.length; i++) {
      if (recent.has(pool[i].woordpaarId)) continue
      if (index === -1 || over.get(pool[i].woordpaarId)! > over.get(pool[index].woordpaarId)!) index = i
    }
    const gekozen = pool.splice(index === -1 ? 0 : index, 1)[0]
    over.set(gekozen.woordpaarId, over.get(gekozen.woordpaarId)! - 1)
    uit.push(gekozen)
  }
  return uit
}

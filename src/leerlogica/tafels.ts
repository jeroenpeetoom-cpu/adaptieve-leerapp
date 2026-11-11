// Tafels oefenen (spec tafels): elke som heeft een eigen tijd die met de echte snelheid van de leerling meegaat,
// van 10 naar 3 seconden. Tafels die al vlot gaan worden snel overgeslagen; lastige sommen krijgen tijd en komen
// vaker terug. Alles wordt afgeleid uit de pogingen, zodat er geen aparte stand opgeslagen hoeft te worden.
import { kalenderdag } from './tijd'

export type Tafeluitkomst = 'goed' | 'fout' | 'te laat'

export interface Tafelpoging {
  id: string
  /** De som als "a x b": a keer de tafel b. */
  som: string
  antwoord: string
  uitkomst: Tafeluitkomst
  /** Hoe lang de leerling erover deed. */
  tijdMs: number
  /** De tijd die de leerling had. */
  limietSec: number
  tijdstip: string
  rondeId: string
  /** Hoort bij de instapronde: kijken wat de leerling al kan. */
  instap?: boolean
  /** De truc die de leerling na een fout of te laat zag (strategie, apart van kennis). */
  truc?: string
}

/** De volgorde waarin tafels erbij komen: eerst de makkelijke, de lastigste het laatst. */
export const TAFELVOLGORDE = [1, 2, 5, 10, 3, 4, 9, 6, 7, 8] as const
/** Zoveel tafels uit de volgorde zijn er vanaf het begin. */
export const STARTTAFELS = 4
export const MAX_SEC = 10
export const MIN_SEC = 3
/** Begintijd voor sommen van een tafel die in de instapronde al vlot ging. */
export const BEGIN_SNELLE_TAFEL_SEC = 5
/** Goed binnen zoveel tijd telt als vlot. */
export const VLOT_MS = 4000
/** Goed binnen zoveel tijd, op twee dagen, telt als beheerst. */
export const BEHEERST_MS = 3000
export const BEHEERST_DAGEN = 2
/** Zoveel van de 10 sommen moeten vlot zijn voordat de volgende tafel erbij komt. */
export const VLOT_VOOR_VOLGENDE = 8
export const SOMMEN_PER_RONDE = 20
/** Een beheerste som komt pas na zoveel dagen weer volop terug. */
export const HERHAAL_BEHEERST_NA_DAGEN = 3

export interface Som {
  id: string
  a: number
  /** De tafel. */
  b: number
  uitkomst: number
}

export function som(a: number, b: number): Som {
  return { id: `${a}x${b}`, a, b, uitkomst: a * b }
}

export function ontleed(id: string): Som {
  const [a, b] = id.split('x').map(Number)
  return som(a, b)
}

export function sommenVanTafel(b: number): Som[] {
  return Array.from({ length: 10 }, (_, i) => som(i + 1, b))
}

export interface Somstand {
  som: Som
  /** De tijd voor de volgende keer, in seconden. */
  limietSec: number
  keer: number
  vlot: boolean
  beheerst: boolean
  laatst: string | null
  /** De tijd van de laatste goede poging, om "sneller dan vorige keer" te kunnen tonen. */
  laatsteGoedMs: number | null
}

export interface Tafelstand {
  sommen: Map<string, Somstand>
  /** Actieve tafels, in de volgorde waarin ze erbij kwamen. */
  actief: number[]
  /** Tafels die in de instapronde meteen vlot gingen. */
  snel: number[]
  instapGedaan: boolean
}

/** De volgende tijd na een poging: met de echte snelheid mee, en bij goed altijd minstens 1 seconde korter. */
export function volgendeLimiet(limietSec: number, uitkomst: Tafeluitkomst, tijdMs: number): number {
  if (uitkomst !== 'goed') return Math.min(MAX_SEC, limietSec + 2)
  return Math.max(MIN_SEC, Math.min(limietSec - 1, Math.ceil(tijdMs / 1000) + 1))
}

function vlotAantal(sommen: Map<string, Somstand>, b: number): number {
  return sommenVanTafel(b).filter((s) => sommen.get(s.id)!.vlot).length
}

/** Speelt alle pogingen op volgorde na: zo blijft een tafel die erbij kwam altijd actief. */
export function tafelstand(pogingen: Tafelpoging[], tijdzone: string): Tafelstand {
  const op = [...pogingen].sort((x, y) => x.tijdstip.localeCompare(y.tijdstip))
  const instap = op.filter((p) => p.instap)
  const snel = TAFELVOLGORDE.filter((b) => {
    const eigen = instap.filter((p) => ontleed(p.som).b === b)
    return eigen.length >= 2 && eigen.every((p) => p.uitkomst === 'goed' && p.tijdMs <= BEHEERST_MS)
  })
  const sommen = new Map<string, Somstand>()
  for (const b of TAFELVOLGORDE)
    for (const s of sommenVanTafel(b))
      sommen.set(s.id, {
        som: s,
        limietSec: snel.includes(b) ? BEGIN_SNELLE_TAFEL_SEC : MAX_SEC,
        keer: 0,
        vlot: false,
        beheerst: false,
        laatst: null,
        laatsteGoedMs: null,
      })
  const actief: number[] = TAFELVOLGORDE.slice(0, STARTTAFELS).map(Number)
  const voegToe = (b: number) => {
    if (!actief.includes(b)) actief.push(b)
  }
  const snelleDagen = new Map<string, Set<string>>()
  const ontgrendel = () => {
    for (;;) {
      const volgende = TAFELVOLGORDE.find((b) => !actief.includes(b))
      if (volgende === undefined || !actief.every((b) => vlotAantal(sommen, b) >= VLOT_VOOR_VOLGENDE)) return
      voegToe(volgende)
    }
  }
  let instapKlaar = false
  for (const p of op) {
    const st = sommen.get(p.som)
    if (!st) continue
    if (!p.instap && !instapKlaar) {
      instapKlaar = true
      snel.forEach(voegToe)
    }
    st.limietSec = volgendeLimiet(st.limietSec, p.uitkomst, p.tijdMs)
    st.keer++
    st.laatst = p.tijdstip
    st.vlot = p.uitkomst === 'goed' && p.tijdMs <= VLOT_MS
    if (p.uitkomst === 'goed') st.laatsteGoedMs = p.tijdMs
    if (p.uitkomst === 'goed' && p.tijdMs <= BEHEERST_MS) {
      const dagen = snelleDagen.get(p.som) ?? new Set<string>()
      dagen.add(kalenderdag(p.tijdstip, tijdzone))
      snelleDagen.set(p.som, dagen)
      if (dagen.size >= BEHEERST_DAGEN) st.beheerst = true
    }
    if (instapKlaar) ontgrendel()
  }
  const instapGedaan = instap.length > 0
  if (instapGedaan && !instapKlaar) {
    snel.forEach(voegToe)
    ontgrendel()
  }
  return { sommen, actief, snel, instapGedaan }
}

/** Een willekeurig getal tussen 0 en 1; in tests vast, zodat de uitkomst voorspelbaar is. */
export type Toeval = () => number

function schud<T>(lijst: T[], toeval: Toeval): T[] {
  const uit = [...lijst]
  for (let i = uit.length - 1; i > 0; i--) {
    const j = Math.floor(toeval() * (i + 1))
    ;[uit[i], uit[j]] = [uit[j], uit[i]]
  }
  return uit
}

/** Zet de sommen zo dat dezelfde tafel niet twee keer achter elkaar komt, als dat kan (door elkaar oefenen). */
export function doorElkaar(sommen: Som[]): Som[] {
  const rest = [...sommen]
  const uit: Som[] = []
  while (rest.length > 0) {
    const vorige = uit[uit.length - 1]
    let i = rest.findIndex((s) => !vorige || (s.b !== vorige.b && s.a !== vorige.b))
    if (i < 0) i = 0
    uit.push(rest.splice(i, 1)[0])
  }
  return uit
}

/** De instapronde: van elke tafel 2 sommen, om te zien wat de leerling al vlot kan. */
export function instapronde(toeval: Toeval): Som[] {
  const sommen = TAFELVOLGORDE.flatMap((b) => schud([3, 4, 6, 7, 8, 9], toeval).slice(0, 2).map((a) => som(a, b)))
  return doorElkaar(schud(sommen, toeval))
}

function gewicht(st: Somstand, nu: string, tijdzone: string): number {
  if (st.beheerst) {
    const dagen = st.laatst ? dagenTussen(st.laatst, nu, tijdzone) : 99
    return dagen >= HERHAAL_BEHEERST_NA_DAGEN ? 1 : 0.15
  }
  if (st.keer === 0) return 2.5
  if (!st.vlot) return 4
  return 2
}

function dagenTussen(van: string, tot: string, tijdzone: string): number {
  const a = Date.parse(kalenderdag(van, tijdzone))
  const b = Date.parse(kalenderdag(tot, tijdzone))
  return Math.round((b - a) / 86_400_000)
}

/**
 * Een gewone ronde uit de actieve tafels: sommen die nog niet vlot gaan het vaakst, nieuwe sommen ook, beheerste
 * sommen af en toe (gespreid). De eerste keer is het de instapronde.
 */
export function kiesRonde(stand: Tafelstand, nu: string, tijdzone: string, toeval: Toeval, aantal = SOMMEN_PER_RONDE): { sommen: Som[]; instap: boolean } {
  if (!stand.instapGedaan) return { sommen: instapronde(toeval), instap: true }
  const kandidaten = stand.actief.flatMap((b) => sommenVanTafel(b)).map((s) => stand.sommen.get(s.id)!)
  const gekozen: Som[] = []
  const pool = kandidaten.map((st) => ({ st, w: gewicht(st, nu, tijdzone) }))
  while (gekozen.length < aantal && pool.length > 0) {
    const totaal = pool.reduce((t, k) => t + k.w, 0)
    let r = toeval() * totaal
    let i = 0
    for (; i < pool.length - 1; i++) {
      r -= pool[i].w
      if (r <= 0) break
    }
    gekozen.push(pool.splice(i, 1)[0].st.som)
  }
  return { sommen: doorElkaar(schud(gekozen, toeval)), instap: false }
}

export type Trucsoort = 'blijft' | 'nul-erachter' | 'omdraaien' | 'dubbel' | 'dubbel-dubbel' | 'drie-keer-dubbel' | 'helft-van-tien' | 'tien-min' | 'vijf-plus' | 'twee-plus'

export interface Truc {
  soort: Trucsoort
  naam: string
  uitleg: string
}

/**
 * Een truc die bij deze som past (strategieontwikkeling): de leerling ziet hoe je een som die je nog niet weet
 * uitrekent vanuit wat je wel weet. Omdraaien eerst, als de omgekeerde som al vlot gaat.
 */
export function trucVoor(s: Som, stand?: Tafelstand): Truc {
  const { a, b, uitkomst } = s
  if (a === 1 || b === 1) return { soort: 'blijft', naam: 'Keer 1', uitleg: `Keer 1 verandert niets: ${a} × ${b} = ${uitkomst}.` }
  if (a === 10 || b === 10) {
    const n = a === 10 ? b : a
    return { soort: 'nul-erachter', naam: 'Keer 10', uitleg: `Keer 10: zet een 0 achter ${n}. Dat is ${uitkomst}.` }
  }
  const om = stand?.sommen.get(`${b}x${a}`)
  if (a !== b && om?.vlot) return { soort: 'omdraaien', naam: 'Omdraaien', uitleg: `Draai hem om: ${b} × ${a} weet je al. Dat is ook ${uitkomst}.` }
  // Kies de tafel waar de handigste truc bij hoort, en reken met het andere getal.
  const voorkeur = [2, 5, 9, 4, 3, 6, 8, 7]
  const t = voorkeur.find((x) => x === a || x === b)!
  const n = t === b ? a : b
  switch (t) {
    case 2:
      return { soort: 'dubbel', naam: 'Dubbel', uitleg: `Keer 2 is het dubbele: ${n} + ${n} = ${uitkomst}.` }
    case 5:
      return { soort: 'helft-van-tien', naam: 'Helft van keer 10', uitleg: `Keer 5 is de helft van keer 10: de helft van ${n * 10} is ${uitkomst}.` }
    case 9:
      return { soort: 'tien-min', naam: 'Keer 10, één keer eraf', uitleg: `Keer 9 is keer 10 min één keer: ${n * 10} − ${n} = ${uitkomst}.` }
    case 4:
      return { soort: 'dubbel-dubbel', naam: 'Dubbel dubbel', uitleg: `Keer 4 is twee keer verdubbelen: ${n} → ${n * 2} → ${uitkomst}.` }
    case 8:
      return { soort: 'drie-keer-dubbel', naam: 'Drie keer dubbel', uitleg: `Keer 8 is drie keer verdubbelen: ${n} → ${n * 2} → ${n * 4} → ${uitkomst}.` }
    case 3:
      return { soort: 'twee-plus', naam: 'Keer 2, één keer erbij', uitleg: `Keer 3 is keer 2 plus één keer: ${n * 2} + ${n} = ${uitkomst}.` }
    case 6:
      return { soort: 'vijf-plus', naam: 'Keer 5, één keer erbij', uitleg: `Keer 6 is keer 5 plus één keer: ${n * 5} + ${n} = ${uitkomst}.` }
    default:
      return { soort: 'vijf-plus', naam: 'Keer 5 plus keer 2', uitleg: `Keer 7 is keer 5 plus keer 2: ${n * 5} + ${n * 2} = ${uitkomst}.` }
  }
}

export interface Rondebewijs {
  /** Sommen die nu sneller goed gingen dan de vorige keer. */
  sneller: number
  /** Sommen die nu binnen 3 seconden goed gingen. */
  opDoel: number
  goed: number
  totaal: number
  /** Tafels die door deze ronde erbij kwamen. */
  nieuweTafels: number[]
  /** Sommen die door deze ronde beheerst zijn. */
  nuBeheerst: number
}

/** Het eigen bewijs na een ronde: vergeleken met de vorige keer, niet met een ander. */
export function rondebewijs(alle: Tafelpoging[], rondeId: string, tijdzone: string): Rondebewijs {
  const ronde = alle.filter((p) => p.rondeId === rondeId)
  const eerder = alle.filter((p) => p.rondeId !== rondeId)
  const voor = tafelstand(eerder, tijdzone)
  const na = tafelstand(alle, tijdzone)
  const eerste = new Map<string, Tafelpoging>()
  for (const p of ronde) if (!eerste.has(p.som)) eerste.set(p.som, p)
  let sneller = 0
  for (const p of eerste.values()) {
    const vorig = voor.sommen.get(p.som)?.laatsteGoedMs
    if (p.uitkomst === 'goed' && vorig != null && p.tijdMs < vorig) sneller++
  }
  return {
    sneller,
    opDoel: [...eerste.values()].filter((p) => p.uitkomst === 'goed' && p.tijdMs <= BEHEERST_MS).length,
    goed: [...eerste.values()].filter((p) => p.uitkomst === 'goed').length,
    totaal: eerste.size,
    nieuweTafels: na.actief.filter((b) => !voor.actief.includes(b) && voor.instapGedaan),
    nuBeheerst: [...na.sommen.values()].filter((s) => s.beheerst && !voor.sommen.get(s.som.id)!.beheerst).length,
  }
}

/** Waar een som staat, voor het raster: kennis apart van strategie. */
export type Somstatus = 'nieuw' | 'bezig' | 'vlot' | 'beheerst'

export function somstatus(st: Somstand): Somstatus {
  if (st.beheerst) return 'beheerst'
  if (st.vlot) return 'vlot'
  return st.keer === 0 ? 'nieuw' : 'bezig'
}

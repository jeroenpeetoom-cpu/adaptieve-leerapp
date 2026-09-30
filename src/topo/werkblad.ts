// Werkblad van een topo-hoofdstuk lezen: welke plekken er zijn, van welke soort, en wat toetsstof is.
// Pure module; de herkenner levert de regels, eventueel van meerdere varianten van dezelfde foto.
import { tekstvakkenVan, type HerkendeRegel } from '../bronverwerking'

import type { PlekSoort } from '../leerlogica'

export type Soort = PlekSoort

export interface WerkbladPlek {
  naam: string
  soort: Soort
  /** Staat in het vak "Wat moet je leren?". */
  toetsstof: boolean
}

export interface Werkblad {
  plekken: WerkbladPlek[]
  /** Alle woorden met een hoofdletter, om onbekende afkortingen later nog op te zoeken. */
  woorden: string[]
}

const CATEGORIE: [RegExp, Soort][] = [
  [/^(landen|land)$/i, 'land'],
  [/^(steden|stad|hoofdsteden|plaatsen)$/i, 'stad'],
  [/^(rivieren|rivier)$/i, 'rivier'],
  [/^(zee|zeeën|zeeen|oceanen|oceaan)$/i, 'zee'],
  // "Wateren" kan van alles zijn: de naam bepaalt daarna of het een zee, rivier of ander water is.
  [/^(wateren|water|meren|meer|kanalen|kanaal)$/i, 'water'],
  [/^(gebergte|gebergten)$/i, 'gebergte'],
  [/^(gebieden|gebied|provincies|provincie|streken|streek|eilanden|eiland|regio's)$/i, 'gebied'],
]

/** Bij een lijst "Wateren": een zee of oceaan aan de naam herkennen, meren en kanalen als ander water, de rest als rivier. */
function waterSoort(naam: string): Soort {
  if (/(zee|oceaan)$/i.test(naam.replace(/\s+/g, ''))) return 'zee'
  if (/(meer|kanaal|plas)$/i.test(naam.replace(/\s+/g, ''))) return 'water'
  return 'rivier'
}

/** Van twee soorten voor dezelfde naam is de ene preciezer ("Gebergte" boven "Gebieden"). */
const PRECIEZER: Partial<Record<Soort, Soort[]>> = { gebied: ['gebergte'], water: ['rivier', 'zee'] }

/** Zonder accenten en hoofdletters, om namen uit verschillende herkenningen samen te voegen. */
export const sleutel = (naam: string) =>
  naam
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')

/** Twee sleutels zijn bijna hetzelfde: de ene begint met de andere, of ze verschillen hooguit twee letters. */
export function lijktOp(a: string, b: string): boolean {
  if (a === b) return true
  const [kort, lang] = a.length <= b.length ? [a, b] : [b, a]
  // Een afgebroken naam ("Rott", "Noorc"): het begin klopt, op hooguit één letter na. Meer dan vijf
  // letters verschil is een andere naam ("Bergen" en "Bergen op Zoom").
  if (kort.length >= 4 && lang.length - kort.length <= 5) {
    let anders = 0
    for (let i = 0; i < kort.length; i++) if (kort[i] !== lang[i]) anders++
    if (anders <= (kort.length >= 5 ? 1 : 0)) return lang.length - kort.length <= 2 || anders <= 1
  }
  if (Math.abs(a.length - b.length) > 2 || Math.min(a.length, b.length) < 5) return false
  const d = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)))
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return d[a.length][b.length] <= 2
}

function soortVan(woord: string): Soort | null {
  const schoon = woord.replace(/[^\p{L}']/gu, '')
  // De herkenning mist soms de laatste letter ("Stede", "Rivierer"): vergelijk ook het begin.
  for (const [patroon, soort] of CATEGORIE) {
    if (patroon.test(schoon)) return soort
  }
  for (const [patroon, soort] of CATEGORIE) {
    const vormen = patroon.source.replace(/^\^\(|\)\$$/g, '').split('|')
    if (schoon.length >= 4 && vormen.some((v) => v.startsWith(schoon.toLowerCase()) || schoon.toLowerCase().startsWith(v.slice(0, 5)))) return soort
  }
  return null
}

const VERBINDING = new Set(['op', 'aan', 'den', 'de', 'van', 'het', 'ter', 'der', 'bij', 'en'])

/** Aardrijkskundige woorden die bij de naam ervoor horen ("Atlantische Oceaan", "Noordelijke IJszee"). */
const AARDRIJKSKUNDIG = /^(oceaan|zee|ijszee|meer|kanaal|golf|baai|woud|gebergte|eilanden|eiland|delta|vlakte|plateau|rivier|kust)$/i

/**
 * Twee lange woorden met een hoofdletter zijn meestal twee namen zonder komma ("Mechelen Leuven"), tenzij
 * het tweede een aardrijkskundig woord is of het eerste een bijvoeglijk naamwoord ("Atlantische").
 */
function zijnLosseNamen(woorden: string[]): boolean {
  if (woorden.some((w) => w.length < 5 || VERBINDING.has(w))) return false
  if (woorden.slice(1).some((w) => AARDRIJKSKUNDIG.test(w))) return false
  if (woorden.slice(0, -1).some((w) => /(ische|sche|lijke|ige)$/i.test(w))) return false
  return true
}

function namenUit(lijst: string): string[] {
  return lijst
    .split(/,|\s+en\s+/)
    .map((n) => {
      // Een naam is een of meer woorden met een hoofdletter; wat daarna komt is rommel van de herkenning.
      const woorden = n.replace(/[^\p{L}\s'-]/gu, ' ').trim().split(/\s+/)
      const naam: string[] = []
      for (let i = 0; i < woorden.length; i++) {
        const w = woorden[i]
        // Verbindingswoorden horen bij de naam als er weer een hoofdletter volgt ("Bergen op Zoom").
        if (naam.length > 0 && VERBINDING.has(w) && /^\p{Lu}\p{Ll}/u.test(woorden[i + 1] ?? '')) {
          naam.push(w)
          continue
        }
        // Een naam begint met een hoofdletter en een kleine letter, of met de IJ ("IJsselmeer").
        if (!/^(\p{Lu}\p{Ll}|IJ)/u.test(w) || (naam.length > 0 && w.length < 3)) break
        naam.push(w)
      }
      return naam.slice(0, 5)
    })
    // Twee lange woorden met een hoofdletter zijn meestal twee namen zonder komma ("Mechelen Leuven");
    // korte samenstellingen zoals "Den Haag" blijven heel.
    .flatMap((woorden) => (woorden.length > 1 && zijnLosseNamen(woorden) ? woorden : [woorden.join(' ')]))
    // Minstens vier letters: afgebroken afkortingen zoals "Vla" zijn geen naam.
    .filter((n) => n.replace(/[^\p{L}]/gu, '').length >= 4)
}

interface Lijst {
  soort: Soort
  namen: string[]
  x: number
  y: number
  hoogte: number
  toetsstof: boolean
}

function leesVariant(regels: HerkendeRegel[]): { lijsten: Lijst[]; woorden: string[] } {
  const vakken = regels.flatMap(tekstvakkenVan).sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0)
  const kop = vakken.find((v) => /wat\s+moet\s+je\s+leren/i.test(v.tekst))
  const lijsten: Lijst[] = []
  const woorden: string[] = []
  // Het vak "Wat moet je leren?" loopt van de kop tot de eerste regel eronder die geen lijst is.
  let inVak = false

  // Een categorie en de namen staan soms als twee tekstvakken naast elkaar ("Landen" … "België, Luxemburg").
  const alleen = new Set<(typeof vakken)[number]>()
  const samengevoegd = vakken.map((v) => {
    if (alleen.has(v) || !soortVan(v.tekst) || v.tekst.split(/\s+/).length > 1) return v
    const rechts = vakken
      .filter((r) => r !== v && r.x0 > v.x0 && Math.abs(r.y0 - v.y0) < v.hoogte * 0.8 && r.x0 - v.x0 < v.hoogte * 15)
      .sort((a, b) => a.x0 - b.x0)[0]
    if (!rechts) return v
    alleen.add(rechts)
    return { ...v, tekst: `${v.tekst} ${rechts.tekst}` }
  })

  for (const vak of samengevoegd) {
    if (alleen.has(vak)) continue
    if (vak === kop) {
      inVak = true
      continue
    }
    for (const w of vak.tekst.split(/[\s,]+/)) {
      // Categoriewoorden ("Landen", "Steden") zijn nooit een plek.
      if (/^\p{Lu}\p{L}{3,}/u.test(w) && !soortVan(w)) woorden.push(w.replace(/[^\p{L}-]/gu, ''))
    }
    const [eerste, ...rest] = vak.tekst.split(/\s+/)
    const soort = soortVan(eerste ?? '')
    const onderKop = kop !== undefined && Math.abs(vak.x0 - kop.x0) < kop.hoogte * 3
    if (soort && rest.length > 0) {
      lijsten.push({ soort, namen: namenUit(rest.join(' ')), x: vak.x0, y: vak.y0, hoogte: vak.hoogte, toetsstof: inVak && onderKop })
      continue
    }
    // Een vervolgregel: vlak onder een lijst, ingesprongen tot waar de namen beginnen.
    const vorige = lijsten.at(-1)
    const inKolom = vorige !== undefined && vak.x0 > vorige.x && vak.x0 - vorige.x < vorige.hoogte * 15
    if (vorige && inKolom && vak.y0 - vorige.y < vorige.hoogte * 3.5 && vak.y0 > vorige.y && /^\p{Lu}\p{Ll}/u.test(vak.tekst)) {
      vorige.namen.push(...namenUit(vak.tekst))
      vorige.y = vak.y0
      continue
    }
    if (inVak && onderKop) inVak = false
  }
  return { lijsten, woorden }
}

/** Leest een werkblad uit één of meer herkenningen van dezelfde foto en voegt de plekken samen. */
export function leesWerkblad(varianten: HerkendeRegel[][]): Werkblad {
  const perSleutel = new Map<string, WerkbladPlek>()
  const woorden = new Set<string>()
  /** Hoe vaak een naam met een soort gelezen is, over alle lijsten en varianten. */
  const tellingen = new Map<string, number>()
  for (const regels of varianten) {
    const { lijsten, woorden: w } = leesVariant(regels)
    w.forEach((x) => woorden.add(x))
    for (const lijst of lijsten) {
      for (const naam of lijst.namen) {
        const soortHier = lijst.soort === 'water' ? waterSoort(naam) : lijst.soort
        // Dezelfde naam kan twee plekken zijn (Luxemburg, land en stad): de soort hoort bij de sleutel.
        const k = `${soortHier}:${sleutel(naam)}`
        tellingen.set(k, (tellingen.get(k) ?? 0) + 1)
        // Een afgebroken of anders herkende naam ("Brusse", "Scheide") hoort bij de bekende ("Brussel", "Schelde").
        const woordenIn = (t: string) => t.trim().split(/\s+/).length
        const afgebroken = [...perSleutel.keys()].find(
          (b) =>
            b !== k &&
            b.startsWith(`${soortHier}:`) &&
            woordenIn(perSleutel.get(b)!.naam) === woordenIn(naam) &&
            lijktOp(b.slice(b.indexOf(':') + 1), k.slice(k.indexOf(':') + 1)),
        )
        if (afgebroken) {
          const bestaand = perSleutel.get(afgebroken)!
          bestaand.toetsstof ||= lijst.toetsstof
          const samen = (tellingen.get(afgebroken) ?? 0) + (tellingen.get(k) ?? 0)
          if (k.length > afgebroken.length) {
            perSleutel.delete(afgebroken)
            perSleutel.set(k, { ...bestaand, naam })
            tellingen.set(k, samen)
          } else tellingen.set(afgebroken, samen)
          continue
        }
        const bestaand = perSleutel.get(k)
        if (!bestaand) perSleutel.set(k, { naam, soort: soortHier, toetsstof: lijst.toetsstof })
        else {
          bestaand.toetsstof ||= lijst.toetsstof
          // Een naam met accenten ("Wallonië") gaat voor op een vervormde ("Wallonié").
          if (/[ëéïöü]/.test(naam) && naam.includes('ë')) bestaand.naam = naam
        }
      }
    }
  }
  let plekken = [...perSleutel.values()]

  // Een naam die uit andere namen bestaat ("Brussel Gent"), is twee namen die aan elkaar kwamen.
  const enkel = new Set(plekken.map((p) => sleutel(p.naam)))
  plekken = plekken.filter((p) => {
    const delen = p.naam.split(/\s+/)
    return delen.length < 2 || !delen.every((d) => enkel.has(sleutel(d)))
  })

  // Dezelfde naam bij een algemene en een preciezere soort (de Ardennen als gebied én gebergte): houd de
  // preciezere, en neem mee of hij toetsstof is.
  plekken = plekken.filter((p) => {
    const precies = plekken.find((q) => q !== p && sleutel(q.naam) === sleutel(p.naam) && (PRECIEZER[p.soort] ?? []).includes(q.soort))
    if (precies) precies.toetsstof ||= p.toetsstof
    return !precies
  })

  // Dezelfde naam bij twee soorten: houd de soort die veel vaker gelezen is, tenzij beide in het vak
  // "Wat moet je leren?" staan (Luxemburg is een land én een stad).
  plekken = plekken.filter((p) => {
    const anderen = plekken.filter((q) => q !== p && q.soort !== p.soort && sleutel(q.naam) === sleutel(p.naam))
    const telling = (x: WerkbladPlek) => tellingen.get(`${x.soort}:${sleutel(x.naam)}`) ?? 0
    return anderen.every((q) => {
      if (p.toetsstof && q.toetsstof) return true
      // Staat de andere soort in het vak en deze niet, dan wint het vak.
      if (q.toetsstof && !p.toetsstof) return false
      return telling(p) * 2 > telling(q)
    })
  })
  return { plekken, woorden: [...woorden] }
}

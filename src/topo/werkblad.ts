// Werkblad van een topo-hoofdstuk lezen: welke plekken er zijn, van welke soort, en wat toetsstof is.
// Pure module; de herkenner levert de regels, eventueel van meerdere varianten van dezelfde foto.
import { tekstvakkenVan, type HerkendeRegel } from '../bronverwerking'

export type Soort = 'stad' | 'water' | 'gebied' | 'land'

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
  [/^(wateren|water|rivieren|rivier|zee|zeeën|zeeen|meren|meer|kanalen)$/i, 'water'],
  [/^(gebieden|gebied|gebergte|gebergten|provincies|provincie|streken|streek|eilanden|eiland|regio's)$/i, 'gebied'],
]

/** Zonder accenten en hoofdletters, om namen uit verschillende herkenningen samen te voegen. */
export const sleutel = (naam: string) =>
  naam
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')

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

function namenUit(lijst: string): string[] {
  return lijst
    .split(/,|\s+en\s+/)
    .map((n) => {
      // Een naam is een of meer woorden met een hoofdletter; wat daarna komt is rommel van de herkenning.
      const woorden = n.replace(/[^\p{L}\s'-]/gu, ' ').trim().split(/\s+/)
      const naam: string[] = []
      for (const w of woorden) {
        if (!/^\p{Lu}\p{Ll}/u.test(w) || (naam.length > 0 && w.length < 3)) break
        naam.push(w)
      }
      return naam.slice(0, 3)
    })
    // Twee lange woorden met een hoofdletter zijn meestal twee namen zonder komma ("Mechelen Leuven");
    // korte samenstellingen zoals "Den Haag" blijven heel.
    .flatMap((woorden) => (woorden.length > 1 && woorden.every((w) => w.length >= 5) ? woorden : [woorden.join(' ')]))
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
  for (const regels of varianten) {
    const { lijsten, woorden: w } = leesVariant(regels)
    w.forEach((x) => woorden.add(x))
    for (const lijst of lijsten) {
      for (const naam of lijst.namen) {
        // Dezelfde naam kan twee plekken zijn (Luxemburg, land en stad): de soort hoort bij de sleutel.
        const k = `${lijst.soort}:${sleutel(naam)}`
        // Een afgebroken naam ("Brusse") hoort bij de volledige ("Brussel").
        const afgebroken = [...perSleutel.keys()].find(
          (b) => b.startsWith(`${lijst.soort}:`) && b !== k && (b.startsWith(k) || k.startsWith(b)) && Math.min(b.length, k.length) >= 7,
        )
        if (afgebroken) {
          const bestaand = perSleutel.get(afgebroken)!
          bestaand.toetsstof ||= lijst.toetsstof
          if (k.length > afgebroken.length) {
            perSleutel.delete(afgebroken)
            perSleutel.set(k, { ...bestaand, naam })
          }
          continue
        }
        const bestaand = perSleutel.get(k)
        if (!bestaand) perSleutel.set(k, { naam, soort: lijst.soort, toetsstof: lijst.toetsstof })
        else {
          bestaand.toetsstof ||= lijst.toetsstof
          // Een naam met accenten ("Wallonië") gaat voor op een vervormde ("Wallonié").
          if (/[ëéïöü]/.test(naam) && naam.includes('ë')) bestaand.naam = naam
        }
      }
    }
  }
  return { plekken: [...perSleutel.values()], woorden: [...woorden] }
}

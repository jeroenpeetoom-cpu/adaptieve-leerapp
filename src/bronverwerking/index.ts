// Bronverwerking: zet herkende tekst om in voorgestelde woordparen met twijfelmarkeringen.
// Pure module zonder schermen, opslag of tekstherkenning; de herkenner levert woorden met hun positie.
//
// Twee vormen van woordenlijsten:
// - vorm 1: één paar per regel met een scheidingsteken, zoals "bridge = brug";
// - vorm 2: kolommen zonder scheidingsteken, ook meerdere tabellen naast elkaar. Elk tekstvak wordt
//   gekoppeld aan het dichtstbijzijnde tekstvak rechts ervan op ongeveer dezelfde hoogte.

export interface HerkendWoord {
  tekst: string
  /** Zekerheid van de herkenning, 0 tot 100. */
  zekerheid: number
  x0: number
  x1: number
  y0: number
  y1: number
}

export interface HerkendeRegel {
  woorden: HerkendWoord[]
}

export type Twijfel = 'geen' | 'twijfel' | 'grote twijfel'

export interface Voorstel {
  woord: string
  betekenis: string
  twijfelWoord: Twijfel
  twijfelBetekenis: Twijfel
}

export interface Verwerking {
  voorstellen: Voorstel[]
  /** Tekst die geen woordpaar vormt, zoals koppen of voorbeeldzinnen, zodat niets ongemerkt verdwijnt. */
  losseRegels: string[]
}

export const GRENS_TWIJFEL = 80
export const GRENS_GROTE_TWIJFEL = 60
/** Tekst waarvan ook het zekerste woord onder deze grens zit, is ruis (vlekken, strepen). */
const GRENS_RUIS = 50
/** Een horizontale opening groter dan dit aantal keer de letterhoogte scheidt twee kolommen. */
const KOLOMOPENING = 1.5
/** Twee tekstvakken horen bij dezelfde rij als hun middens minder dan dit aantal keer de letterhoogte verschillen. */
const RIJTOLERANTIE = 0.75

const SCHEIDINGSTEKENS = ['=', '-', '–', '—', ':']
/** Tekens die ook aan een woord vast mogen zitten, zoals "bridge=" of "bridge=brug". */
const VASTE_SCHEIDINGSTEKENS = ['=', ':', '–', '—']

/** Een aaneengesloten stuk tekst op één hoogte, bijvoorbeeld één cel van een tabel. */
interface Tekstvak {
  woorden: HerkendWoord[]
  x0: number
  x1: number
  midden: number
  hoogte: number
}

function twijfelVan(woorden: HerkendWoord[]): Twijfel {
  const laagste = Math.min(...woorden.map((w) => w.zekerheid))
  if (laagste < GRENS_GROTE_TWIJFEL) return 'grote twijfel'
  if (laagste < GRENS_TWIJFEL) return 'twijfel'
  return 'geen'
}

const opschonen = (tekst: string) => tekst.replace(/\s+/g, ' ').trim()
const tekstVan = (woorden: HerkendWoord[]) => opschonen(woorden.map((w) => w.tekst).join(' '))
const isOpsommingsteken = (tekst: string) => /^(\d+[.)]|[•·*▪◦])$/.test(tekst)
/** Losse strepen en vlekken, zoals "|" of "——", die geen letter of cijfer bevatten. */
const isSchoon = (w: HerkendWoord) => /[\p{L}\p{N}=:–—-]/u.test(w.tekst) && !/^[|—_–-]{2,}$/.test(w.tekst)

function vak(woorden: HerkendWoord[]): Tekstvak {
  const hoogtes = woorden.map((w) => w.y1 - w.y0).sort((a, b) => a - b)
  return {
    woorden,
    x0: Math.min(...woorden.map((w) => w.x0)),
    x1: Math.max(...woorden.map((w) => w.x1)),
    midden: woorden.reduce((s, w) => s + (w.y0 + w.y1) / 2, 0) / woorden.length,
    hoogte: Math.max(hoogtes[Math.floor(hoogtes.length / 2)], 1),
  }
}

/** De tekst van elk tekstvak in een regel, van links naar rechts, met positie. */
export function tekstvakkenVan(regel: HerkendeRegel): { tekst: string; x0: number; y0: number; hoogte: number }[] {
  return tekstvakken(regel).map((v) => ({ tekst: tekstVan(v.woorden), x0: v.x0, y0: Math.min(...v.woorden.map((w) => w.y0)), hoogte: v.hoogte }))
}

/** Splitst een herkende regel in tekstvakken bij grote horizontale openingen. */
function tekstvakken(regel: HerkendeRegel): Tekstvak[] {
  const woorden = regel.woorden
    .map((w) => ({ ...w, tekst: opschonen(w.tekst.replace(/\|/g, '')) }))
    .filter((w) => w.tekst !== '' && isSchoon(w))
    .sort((a, b) => a.x0 - b.x0)
  const vakken: HerkendWoord[][] = []
  for (const w of woorden) {
    const huidig = vakken.at(-1)
    const vorige = huidig?.at(-1)
    const hoogte = vorige ? Math.max(vorige.y1 - vorige.y0, w.y1 - w.y0, 1) : 1
    if (huidig && vorige && w.x0 - vorige.x1 <= KOLOMOPENING * hoogte) huidig.push(w)
    else vakken.push([w])
  }
  return vakken
    .map((ws) => (ws.length > 1 && isOpsommingsteken(ws[0].tekst) ? ws.slice(1) : ws))
    .filter((ws) => ws.length > 0 && Math.max(...ws.map((w) => w.zekerheid)) >= GRENS_RUIS)
    .map(vak)
}

/** Vorm 1: splitst een tekstvak bij het eerste scheidingsteken. */
function splitsBijTeken(woorden: HerkendWoord[]): [HerkendWoord[], HerkendWoord[]] | null {
  for (let i = 0; i < woorden.length; i++) {
    const w = woorden[i]
    if (SCHEIDINGSTEKENS.includes(w.tekst)) return [woorden.slice(0, i), woorden.slice(i + 1)]
    for (const teken of VASTE_SCHEIDINGSTEKENS) {
      const plek = w.tekst.indexOf(teken)
      if (plek === -1) continue
      const deel = (tekst: string) => (tekst ? [{ ...w, tekst }] : [])
      return [
        [...woorden.slice(0, i), ...deel(w.tekst.slice(0, plek))],
        [...deel(w.tekst.slice(plek + teken.length)), ...woorden.slice(i + 1)],
      ]
    }
  }
  return null
}

function voorstel(links: HerkendWoord[], rechts: HerkendWoord[]): Voorstel {
  return {
    woord: tekstVan(links),
    betekenis: tekstVan(rechts),
    twijfelWoord: twijfelVan(links),
    twijfelBetekenis: twijfelVan(rechts),
  }
}

export function verwerkRegels(regels: HerkendeRegel[]): Verwerking {
  const vakken = regels.flatMap(tekstvakken)
  const paren: { y: number; x: number; voorstel: Voorstel }[] = []
  const overig: Tekstvak[] = []

  // Vorm 1: een tekstvak met een scheidingsteken is zelf al een woordpaar.
  for (const v of vakken) {
    const delen = splitsBijTeken(v.woorden)
    if (delen && tekstVan(delen[0]) !== '' && tekstVan(delen[1]) !== '') {
      paren.push({ y: v.midden, x: v.x0, voorstel: voorstel(delen[0], delen[1]) })
    } else {
      overig.push(v)
    }
  }

  // Vorm 2: koppel van links naar rechts elk tekstvak aan het dichtstbijzijnde vrije tekstvak
  // rechts ervan op dezelfde rij. Werkt ook als tabellen naast elkaar iets scheef lopen.
  const aantalVorm1 = paren.length
  const gekoppeld = new Set<Tekstvak>()
  const opVolgorde = [...overig].sort((a, b) => a.x0 - b.x0 || a.midden - b.midden)
  for (const links of opVolgorde) {
    if (gekoppeld.has(links)) continue
    const kandidaten = opVolgorde.filter(
      (r) =>
        !gekoppeld.has(r) &&
        r !== links &&
        r.x0 > links.x1 &&
        Math.abs(r.midden - links.midden) <= RIJTOLERANTIE * Math.max(links.hoogte, r.hoogte),
    )
    if (kandidaten.length === 0) continue
    const rechts = kandidaten.reduce((beste, r) =>
      r.x0 < beste.x0 || (r.x0 === beste.x0 && Math.abs(r.midden - links.midden) < Math.abs(beste.midden - links.midden))
        ? r
        : beste,
    )
    gekoppeld.add(links).add(rechts)
    paren.push({ y: links.midden, x: links.x0, voorstel: voorstel(links.woorden, rechts.woorden) })
  }

  // Bestaat een pagina vooral uit kolommen, dan is een paar met een scheidingsteken verdacht
  // (bijvoorbeeld een voettekst als "Engels - groep 7"); de leerling moet het dan bekijken.
  if (paren.length - aantalVorm1 > aantalVorm1) {
    for (const p of paren.slice(0, aantalVorm1)) {
      p.voorstel.twijfelWoord = p.voorstel.twijfelWoord === 'geen' ? 'twijfel' : p.voorstel.twijfelWoord
      p.voorstel.twijfelBetekenis = p.voorstel.twijfelBetekenis === 'geen' ? 'twijfel' : p.voorstel.twijfelBetekenis
    }
  }

  const losseRegels = overig
    .filter((v) => !gekoppeld.has(v))
    .sort((a, b) => a.midden - b.midden || a.x0 - b.x0)
    .map((v) => tekstVan(v.woorden))

  // In leesvolgorde: van boven naar beneden, en op dezelfde hoogte van links naar rechts.
  const voorstellen = paren
    .sort((a, b) => (Math.abs(a.y - b.y) < 8 ? a.x - b.x : a.y - b.y))
    .map((p) => p.voorstel)

  return { voorstellen, losseRegels }
}

/**
 * Geplakte tekst als herkende regels: elke regel met volle zekerheid. Tabs (bijvoorbeeld uit een
 * spreadsheet of tabel) worden kolommen, zodat ook vorm 2 werkt.
 */
export function regelsUitTekst(tekst: string): HerkendeRegel[] {
  const hoogte = 20
  return tekst
    .split(/\r?\n/)
    .map((regel, i) => {
      let x = 0
      const woorden: HerkendWoord[] = []
      for (const kolom of regel.split('\t')) {
        for (const t of kolom.trim().split(/\s+/).filter(Boolean)) {
          woorden.push({ tekst: t, zekerheid: 100, x0: x, x1: x + t.length * 10, y0: i * 30, y1: i * 30 + hoogte })
          x += t.length * 10 + 8
        }
        // Een tab is een grote opening: een nieuwe kolom.
        x += hoogte * 10
      }
      return { woorden }
    })
    .filter((r) => r.woorden.length > 0)
}

// Bronverwerking: zet herkende tekst om in voorgestelde woordparen met twijfelmarkeringen.
// Pure module zonder schermen, opslag of tekstherkenning; de herkenner levert de regels aan.

export interface HerkendWoord {
  tekst: string
  /** Zekerheid van de herkenning, 0 tot 100. */
  zekerheid: number
  x0: number
  x1: number
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
  /** Regels met tekst die geen woordpaar vormen, zodat niets ongemerkt verdwijnt. */
  losseRegels: string[]
}

export const GRENS_TWIJFEL = 80
export const GRENS_GROTE_TWIJFEL = 60

const SCHEIDINGSTEKENS = ['=', '-', '–', '—', ':']
/** Tekens die ook aan een woord vast mogen zitten, zoals "bridge=" of "bridge=brug". */
const VASTE_SCHEIDINGSTEKENS = ['=', ':', '–', '—']

function twijfelVan(woorden: HerkendWoord[]): Twijfel {
  const laagste = Math.min(...woorden.map((w) => w.zekerheid))
  if (laagste < GRENS_GROTE_TWIJFEL) return 'grote twijfel'
  if (laagste < GRENS_TWIJFEL) return 'twijfel'
  return 'geen'
}

const opschonen = (tekst: string) => tekst.replace(/\s+/g, ' ').trim()
const isOpsommingsteken = (tekst: string) => /^(\d+[.)]?|[•·*▪◦-])$/.test(tekst)

/** Splitst de woorden van een regel in een linker- en rechterdeel bij het eerste scheidingsteken. */
function splits(woorden: HerkendWoord[]): [HerkendWoord[], HerkendWoord[]] | null {
  for (let i = 0; i < woorden.length; i++) {
    const w = woorden[i]
    if (SCHEIDINGSTEKENS.includes(w.tekst)) return [woorden.slice(0, i), woorden.slice(i + 1)]
    for (const teken of VASTE_SCHEIDINGSTEKENS) {
      const plek = w.tekst.indexOf(teken)
      if (plek === -1) continue
      const links = w.tekst.slice(0, plek)
      const rechts = w.tekst.slice(plek + teken.length)
      const deel = (tekst: string) => (tekst ? [{ ...w, tekst }] : [])
      return [[...woorden.slice(0, i), ...deel(links)], [...deel(rechts), ...woorden.slice(i + 1)]]
    }
  }
  return null
}

const tekstVan = (woorden: HerkendWoord[]) => opschonen(woorden.map((w) => w.tekst).join(' '))

export function verwerkRegels(regels: HerkendeRegel[]): Verwerking {
  const voorstellen: Voorstel[] = []
  const losseRegels: string[] = []

  for (const regel of regels) {
    let woorden = regel.woorden.filter((w) => opschonen(w.tekst) !== '')
    if (woorden.length > 1 && isOpsommingsteken(woorden[0].tekst)) woorden = woorden.slice(1)
    if (woorden.length === 0) continue

    const delen = splits(woorden)
    const [links, rechts] = delen ?? [[], []]
    if (!delen || tekstVan(links) === '' || tekstVan(rechts) === '') {
      losseRegels.push(tekstVan(woorden))
      continue
    }
    voorstellen.push({
      woord: tekstVan(links),
      betekenis: tekstVan(rechts),
      twijfelWoord: twijfelVan(links),
      twijfelBetekenis: twijfelVan(rechts),
    })
  }
  return { voorstellen, losseRegels }
}

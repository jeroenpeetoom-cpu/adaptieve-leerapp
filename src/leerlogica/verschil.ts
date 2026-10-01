// Wat er klopt aan een getypt antwoord en waar het misgaat, voor feedback die meer zegt dan "fout".

const LIDWOORDEN = ['de', 'het', 'een', 'the', 'a', 'an']

/** Eén teken van een antwoord, gemarkeerd als het klopt of niet. */
export interface Teken {
  teken: string
  klopt: boolean
}

export type Verschilsoort = 'omgedraaid' | 'mist' | 'extra' | 'verkeerd' | 'anders'

export interface Verschil {
  soort: Verschilsoort
  /** Het stuk aan het begin dat klopt, zoals de leerling het schreef. */
  begin: string
  /** De letters waar het om gaat: de twee omgedraaide, de ontbrekende, de extra of de verkeerde. */
  letters: string[]
}

/** Spaties gelijktrekken en een lidwoord aan het begin weglaten; hoofdletters blijven voor de weergave. */
function voorbereid(tekst: string): string {
  const woorden = tekst.trim().split(/\s+/).filter(Boolean)
  if (woorden.length > 1 && LIDWOORDEN.includes(woorden[0].toLowerCase())) woorden.shift()
  return woorden.join(' ')
}

const gelijk = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

/** Langste gemeenschappelijke deelreeks: per teken van a en b of het daarin zit. */
function gemeenschappelijk(a: string, b: string): { inA: boolean[]; inB: boolean[] } {
  const l: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      l[i][j] = gelijk(a[i], b[j]) ? l[i + 1][j + 1] + 1 : Math.max(l[i + 1][j], l[i][j + 1])
  const inA = new Array<boolean>(a.length).fill(false)
  const inB = new Array<boolean>(b.length).fill(false)
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (gelijk(a[i], b[j])) {
      inA[i++] = true
      inB[j++] = true
    } else if (l[i + 1][j] >= l[i][j + 1]) i++
    else j++
  }
  return { inA, inB }
}

/** Het gegeven antwoord en het goede antwoord met per teken of het klopt, om het verschil te markeren. */
export function markeerVerschil(gegeven: string, goed: string): { gegeven: Teken[]; goed: Teken[] } {
  const a = voorbereid(gegeven)
  const b = voorbereid(goed)
  const { inA, inB } = gemeenschappelijk(a, b)
  return {
    gegeven: [...a].map((teken, i) => ({ teken, klopt: inA[i] || teken === ' ' })),
    goed: [...b].map((teken, i) => ({ teken, klopt: inB[i] || teken === ' ' })),
  }
}

/** Kiest het toegestane antwoord dat het meest lijkt op wat de leerling gaf. */
export function dichtstbijzijnde(gegeven: string, toegestaan: string[]): string {
  const a = voorbereid(gegeven)
  let beste = toegestaan[0]
  let score = -1
  for (const t of toegestaan) {
    const b = voorbereid(t)
    const { inA } = gemeenschappelijk(a, b)
    const s = inA.filter(Boolean).length / Math.max(a.length, b.length, 1)
    if (s > score) {
      score = s
      beste = t
    }
  }
  return beste
}

/** Beschrijft het verschil tussen een antwoord en het goede antwoord. */
export function beschrijfVerschil(gegeven: string, goed: string): Verschil {
  const a = voorbereid(gegeven)
  const b = voorbereid(goed)
  let p = 0
  while (p < a.length && p < b.length && gelijk(a[p], b[p])) p++
  const begin = a.slice(0, p)
  const restA = a.slice(p)
  const restB = b.slice(p)
  const resultaat = (soort: Verschilsoort, letters: string[] = []): Verschil => ({ soort, begin, letters })

  if (restA.length === restB.length && restA.length >= 2 && gelijk(restA[0], restB[1]) && gelijk(restA[1], restB[0]) && gelijk(restA.slice(2), restB.slice(2)))
    return resultaat('omgedraaid', [restB[0], restB[1]])
  if (restA.length + 1 === restB.length && gelijk(restA, restB.slice(1))) return resultaat('mist', [restB[0]])
  if (restA.length === restB.length + 1 && gelijk(restA.slice(1), restB)) return resultaat('extra', [restA[0]])
  if (restA.length === restB.length && restA.length >= 1 && gelijk(restA.slice(1), restB.slice(1)))
    return resultaat('verkeerd', [restA[0]])
  return resultaat('anders')
}

const letter = (l: string) => (l === ' ' ? 'een spatie' : `de ${l.toLowerCase()}`)

/**
 * Feedback op een antwoord dat (nog) niet goed is. Bij een nieuw woord duidelijk: wat klopt en waar het
 * misgaat. Bij een bekend woord eerst licht: alleen wat voor soort fout het is. Null betekent dat er
 * niets bruikbaars over het verschil te zeggen valt; dan volgt de gewone hint.
 */
export function verschilfeedback(verschil: Verschil, bekend: boolean): string | null {
  const { soort, begin, letters } = verschil
  if (bekend) {
    switch (soort) {
      case 'omgedraaid':
        return 'Er staan twee letters verkeerd om.'
      case 'mist':
        return 'Er mist een letter.'
      case 'extra':
        return 'Er staat een letter te veel.'
      case 'verkeerd':
        return 'Eén letter klopt niet.'
      default:
        return null
    }
  }
  const klopt = begin.trim().length > 0 ? `"${begin}" klopt. Daarna ` : 'Meteen aan het begin '
  switch (soort) {
    case 'omgedraaid':
      return `${klopt}staan ${letter(letters[0])} en ${letter(letters[1])} verkeerd om.`
    case 'mist':
      return `${klopt}mist er een letter.`
    case 'extra':
      return `${klopt}staat er een letter te veel: ${letter(letters[0])}.`
    case 'verkeerd':
      return `${klopt}klopt ${letter(letters[0])} niet.`
    default:
      return begin.trim().length >= 2 ? `"${begin}" klopt, daarna gaat het mis.` : null
  }
}

// Regels en begrippen leren toepassen (spec regels). Een regel heeft een paar begrippen die op elkaar
// lijken, geordend in een schema met beslisvragen. De app maakt steeds nieuwe zinnen met werkwoorden uit de
// eigen lijst, zodat de leerling het begrip toepast in plaats van een zin te onthouden.

/** Eén begrip van een regel, zoals "don't have to". */
export interface Begrip {
  id: string
  /** De Engelse vorm. */
  vorm: string
  /** Wat het betekent, kort: "hoeft niet". */
  betekenis: string
  /** De betekenis als situatie, om in een zin te zetten: "Niet verplicht". */
  situatie: string
  emoji: string
  /** Het antwoord op elke beslisvraag, in dezelfde volgorde als `beslisvragen`. */
  antwoorden: string[]
}

export interface Werkwoord {
  /** Engels, zonder onderwerp: "stay up late". */
  en: string
  /** Nederlands als hele werkwoordsgroep: "laat opblijven". */
  nl: string
}

export interface Regel {
  id: string
  titel: string
  /** Waaraan de app de regel herkent in een kopje of een zin. */
  herken: RegExp
  /** Vragen waarmee je het juiste begrip kiest, met de mogelijke antwoorden. */
  beslisvragen: { vraag: string; opties: string[] }[]
  begrippen: Begrip[]
  /** De valkuil in één zin. */
  valkuil: string
  /** Het voorbeeld voor de startvraag: welk begrip, in welke zin. */
  startvraag: { begrip: string; zin: string }
  /** Hardop voordoen hoe je kiest. */
  hardop: string
  /** Werkwoorden die altijd beschikbaar zijn, ook als de eigen lijst er weinig heeft. */
  werkwoorden: Werkwoord[]
}

export const REGELS: Regel[] = [
  {
    id: 'can-have-to',
    titel: 'Can or have to',
    herken: /\b(can't|cannot|can|have to|has to|don't have to|doesn't have to)\b/i,
    beslisvragen: [
      { vraag: 'Gaat het om mogen of om moeten?', opties: ['mogen', 'moeten'] },
      { vraag: 'Is het wel of niet?', opties: ['wel', 'niet'] },
    ],
    begrippen: [
      { id: 'can', vorm: 'can', betekenis: 'mag of kan', situatie: 'Het mag', emoji: '✅', antwoorden: ['mogen', 'wel'] },
      { id: 'cant', vorm: "can't", betekenis: 'mag niet', situatie: 'Het is verboden', emoji: '🚫', antwoorden: ['mogen', 'niet'] },
      { id: 'have-to', vorm: 'have to', betekenis: 'moet', situatie: 'Het moet', emoji: '❗', antwoorden: ['moeten', 'wel'] },
      { id: 'dont-have-to', vorm: "don't have to", betekenis: 'hoeft niet', situatie: 'Het hoeft niet', emoji: '😌', antwoorden: ['moeten', 'niet'] },
    ],
    valkuil: '"Don\'t have to" betekent niet "moet niet", maar "hoeft niet": het mag wel, het is alleen niet verplicht.',
    startvraag: { begrip: 'dont-have-to', zin: "You don't have to cook dinner." },
    hardop:
      'Ik stel mezelf twee vragen. Eerst: gaat het om mogen of om moeten? Dan: is het wel of niet? "Je hoeft niet te koken": dat gaat over moeten, en het is niet. Dus: don\'t have to.',
    werkwoorden: [
      { en: 'play outside', nl: 'buitenspelen' },
      { en: 'do the dishes', nl: 'afwassen' },
      { en: 'wear a uniform', nl: 'een uniform dragen' },
      { en: 'go to bed early', nl: 'vroeg naar bed gaan' },
      { en: 'clean the room', nl: 'de kamer opruimen' },
      { en: 'use a phone in class', nl: 'een telefoon gebruiken in de klas' },
    ],
  },
]

export function regelMetId(id: string): Regel | undefined {
  return REGELS.find((r) => r.id === id)
}

/** Welke regels passen bij deze zinnen? Minstens twee zinnen met een vorm van de regel. */
export function stelRegelsVoor(zinnen: string[]): Regel[] {
  return REGELS.filter((r) => zinnen.filter((z) => r.herken.test(z)).length >= 2)
}

/**
 * Werkwoorden uit de eigen lijst die in een zin passen: een Engelse woordgroep zonder lidwoord vooraan,
 * hooguit vijf woorden, geen hele zin, en een Nederlandse betekenis die eindigt op een werkwoord (-en).
 */
export function werkwoordenUitLijst(paren: { woord: string; betekenis: string }[]): Werkwoord[] {
  return paren
    .filter(({ woord, betekenis }) => {
      const w = woord.trim()
      const woorden = w.split(/\s+/)
      return (
        woorden.length <= 5 &&
        !/[.?!]$/.test(w) &&
        !/^[A-Z]/.test(w) &&
        !/^(the|a|an)\b/i.test(w) &&
        /en$/i.test(betekenis.trim()) &&
        // "tijd om te spelen" is geen werkwoordsgroep, al eindigt het op -en.
        !/\bom te\b/i.test(betekenis) &&
        !REGELS.some((r) => r.herken.test(w))
      )
    })
    .map(({ woord, betekenis }) => ({ en: woord.trim(), nl: betekenis.trim().replace(/^[A-Z]/, (c) => c.toLowerCase()) }))
}

/** Onderwerp dat bij de woordgroep past: "my" vraagt "I", "your" vraagt "You". */
function onderwerp(en: string, kans: () => number): string {
  if (/\bmy\b/i.test(en)) return 'I'
  if (/\byour\b/i.test(en)) return 'You'
  return ['You', 'I', 'We'][Math.floor(kans() * 3)]
}

export interface Regelvraag {
  /** Begrijpen: een Engelse zin, kies de betekenis. Toepassen: een situatie, kies de vorm. */
  richting: 'begrijpen' | 'toepassen'
  /** De Engelse zin; bij toepassen met ___ op de plek van de vorm. */
  zin: string
  /** Bij toepassen: de situatie in het Nederlands, zoals "😌 Het hoeft niet: laat opblijven". */
  situatie?: string
  opties: { id: string; tekst: string }[]
  goed: string
  /** De volledige goede zin, om na het antwoord te laten zien. */
  heleZin: string
}

function zaadKans(tekst: string): () => number {
  let h = 2166136261
  for (let i = 0; i < tekst.length; i++) h = Math.imul(h ^ tekst.charCodeAt(i), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

/**
 * Maakt een nieuwe vraag voor één begrip, steeds met een ander werkwoord (vast per zaad, zodat hervatten
 * dezelfde vraag geeft). De opties zijn altijd alle begrippen van de regel, in vaste volgorde, zodat de
 * plek van de knop niets verraadt.
 */
export function maakRegelvraag(regel: Regel, begripId: string, richting: 'begrijpen' | 'toepassen', werkwoorden: Werkwoord[], zaad: string): Regelvraag {
  const kans = zaadKans(zaad)
  const begrip = regel.begrippen.find((b) => b.id === begripId)!
  const pool = werkwoorden.length > 0 ? [...werkwoorden, ...regel.werkwoorden] : regel.werkwoorden
  const ww = pool[Math.floor(kans() * pool.length)]
  const wie = onderwerp(ww.en, kans)
  const heleZin = `${wie} ${begrip.vorm} ${ww.en}.`
  if (richting === 'begrijpen') {
    return {
      richting,
      zin: heleZin,
      opties: regel.begrippen.map((b) => ({ id: b.id, tekst: `${b.emoji} ${b.situatie}` })),
      goed: begrip.id,
      heleZin,
    }
  }
  return {
    richting,
    zin: `${wie} ___ ${ww.en}.`,
    situatie: `${begrip.emoji} ${begrip.situatie}: ${ww.nl}`,
    opties: regel.begrippen.map((b) => ({ id: b.id, tekst: b.vorm })),
    goed: begrip.id,
    heleZin,
  }
}

/** Uitleg bij een fout: welke beslisvraag ging mis, en wat het juiste begrip betekent. */
export function regelfeedback(regel: Regel, goedId: string, gekozenId: string): string {
  const goed = regel.begrippen.find((b) => b.id === goedId)!
  const gekozen = regel.begrippen.find((b) => b.id === gekozenId)
  if (!gekozen) return `Het is "${goed.vorm}": ${goed.betekenis}.`
  const mis = regel.beslisvragen.findIndex((_, i) => goed.antwoorden[i] !== gekozen.antwoorden[i])
  const vraag = regel.beslisvragen[mis]
  const val = goed.id === 'dont-have-to' && gekozen.id === 'cant' ? ` ${regel.valkuil}` : ''
  return `${vraag.vraag} Hier is het "${goed.antwoorden[mis]}". Dus "${goed.vorm}": ${goed.betekenis}.${val}`
}

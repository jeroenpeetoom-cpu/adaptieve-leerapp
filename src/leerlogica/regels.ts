// Regels en begrippen leren toepassen (spec regels). Een regel heeft een paar begrippen die op elkaar
// lijken, geordend in een schema met beslisvragen. De app maakt steeds nieuwe zinnen, waar het kan met woorden
// uit de eigen lijst, zodat de leerling het begrip toepast in plaats van een zin te onthouden.

/** Eén begrip van een regel, zoals "don't have to". */
export interface Begrip {
  id: string
  /** De Engelse vorm. */
  vorm: string
  /** Wat het betekent, kort: "hoeft niet". */
  betekenis: string
  /** De betekenis als keuze bij begrijpen: "Het hoeft niet". */
  situatie: string
  emoji: string
  /** Het antwoord op elke beslisvraag, in dezelfde volgorde als `beslisvragen`. */
  antwoorden: string[]
  /** Andere schrijfwijzen die bij typen ook goed zijn. */
  varianten?: string[]
}

/** Een woordpaar uit de eigen lijst. */
export interface Bronwoord {
  woord: string
  betekenis: string
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
  /** Een kopje op het blad waaraan de app de regel herkent, zoals "Voorzetsels van tijd". */
  herkenKopje: RegExp
  /** Een zin met een vorm van de regel, zoals "You don't have to cook dinner." */
  herken: RegExp
  /** Vragen waarmee je het juiste begrip kiest, met de mogelijke antwoorden. */
  beslisvragen: { vraag: string; opties: string[] }[]
  begrippen: Begrip[]
  /** Raster bij twee beslisvragen met elk twee antwoorden; anders een lijst. */
  schema: 'raster' | 'lijst'
  /** De valkuil in één zin, en bij welke verwisseling (goed, gekozen) die hoort. */
  valkuil: string
  valkuilBij: [string, string][]
  /** Een veelgemaakte denkfout, als afleider bij de zelfuitleg. */
  denkfout: string
  /** Het voorbeeld voor de startvraag: welk begrip, in welke zin. */
  startvraag: { begrip: string; zin: string }
  /** Hardop voordoen hoe je kiest. */
  hardop: string
  /** Een zin met ___ op de plek van het begrip, en de Nederlandse betekenis die het begrip vastlegt. */
  maakZin: (begrip: Begrip, bron: Bronwoord[], kans: () => number) => { en: string; nl: string }
}

const kies = <T,>(lijst: T[], kans: () => number): T => lijst[Math.floor(kans() * lijst.length)]

/** Onderwerp dat bij de woordgroep past: "my" vraagt "I", "your" vraagt "You". */
function onderwerp(en: string, kans: () => number): string {
  if (/\bmy\b/i.test(en)) return 'I'
  if (/\byour\b/i.test(en)) return 'You'
  return kies(['You', 'I', 'We'], kans)
}

const STANDAARD_WERKWOORDEN: Werkwoord[] = [
  { en: 'play outside', nl: 'buitenspelen' },
  { en: 'do the dishes', nl: 'afwassen' },
  { en: 'wear a uniform', nl: 'een uniform dragen' },
  { en: 'go to bed early', nl: 'vroeg naar bed gaan' },
  { en: 'clean the room', nl: 'de kamer opruimen' },
  { en: 'use a phone in class', nl: 'een telefoon gebruiken in de klas' },
]

/** Zelfstandige naamwoorden met enkelvoud en meervoud, voor "it is / they are". */
const DINGEN = [
  { en: 'tomato', enMv: 'tomatoes', nl: 'tomaat', nlMv: 'tomaten' },
  { en: 'carrot', enMv: 'carrots', nl: 'wortel', nlMv: 'wortels' },
  { en: 'pepper', enMv: 'peppers', nl: 'paprika', nlMv: "paprika's" },
  { en: 'cucumber', enMv: 'cucumbers', nl: 'komkommer', nlMv: 'komkommers' },
  { en: 'apple', enMv: 'apples', nl: 'appel', nlMv: 'appels' },
  { en: 'banana', enMv: 'bananas', nl: 'banaan', nlMv: 'bananen' },
  { en: 'pizza', enMv: 'pizzas', nl: 'pizza', nlMv: "pizza's" },
  { en: 'meatball', enMv: 'meatballs', nl: 'gehaktbal', nlMv: 'gehaktballen' },
]

const EIGENSCHAPPEN = [
  { en: 'crunchy', nl: 'knapperig' },
  { en: 'sweet', nl: 'zoet' },
  { en: 'sour', nl: 'zuur' },
  { en: 'soft', nl: 'zacht' },
  { en: 'hard', nl: 'hard' },
  { en: 'creamy', nl: 'romig' },
  { en: 'spicy', nl: 'pittig' },
  { en: 'greasy', nl: 'vettig' },
  { en: 'red', nl: 'rood' },
  { en: 'healthy', nl: 'gezond' },
]

/** Woorden uit de eigen lijst gaan voor, als ze in de reeks voorkomen; anders de hele reeks. */
function uitEigenLijst<T extends { en: string }>(reeks: T[], bron: Bronwoord[], sleutel: (t: T) => string[] = (t) => [t.en]): T[] {
  const eigen = new Set(bron.map((b) => b.woord.trim().toLowerCase()))
  const raak = reeks.filter((t) => sleutel(t).some((k) => eigen.has(k)))
  return raak.length >= 2 ? raak : reeks
}

/** Zinnen per voorzetsel van tijd, met de Nederlandse betekenis. */
const TIJDZINNEN: Record<string, { en: string; nl: string }[]> = {
  at: [
    { en: "Let's meet ___ 2 pm.", nl: 'Laten we afspreken om 2 uur.' },
    { en: 'The film starts ___ 8 o\'clock.', nl: 'De film begint om 8 uur.' },
    { en: 'I get up ___ 7 am.', nl: 'Ik sta op om 7 uur.' },
    { en: 'School ends ___ half past three.', nl: 'School is uit om half vier.' },
  ],
  on: [
    { en: 'I always play football ___ Saturdays.', nl: 'Ik voetbal altijd op zaterdag.' },
    { en: 'We have English ___ Monday.', nl: 'We hebben Engels op maandag.' },
    { en: 'My party is ___ Friday.', nl: 'Mijn feestje is op vrijdag.' },
    { en: 'We go swimming ___ Wednesdays.', nl: 'We gaan op woensdag zwemmen.' },
  ],
  before: [
    { en: "Let's go swimming ___ dinner.", nl: 'Laten we gaan zwemmen voor het eten.' },
    { en: 'Wash your hands ___ lunch.', nl: 'Was je handen voor de lunch.' },
    { en: 'I read a book ___ bedtime.', nl: 'Ik lees een boek voor het slapengaan.' },
    { en: 'We warm up ___ the match.', nl: 'We warmen op voor de wedstrijd.' },
  ],
  after: [
    { en: 'We can play together ___ lunch.', nl: 'We kunnen samen spelen na de lunch.' },
    { en: 'I do my homework ___ school.', nl: 'Ik maak mijn huiswerk na school.' },
    { en: 'We eat cake ___ the match.', nl: 'We eten taart na de wedstrijd.' },
    { en: 'I go to bed ___ the film.', nl: 'Ik ga naar bed na de film.' },
  ],
  during: [
    { en: 'We can talk ___ our walk home.', nl: 'We kunnen praten tijdens onze wandeling naar huis.' },
    { en: "Don't eat ___ the lesson.", nl: 'Niet eten tijdens de les.' },
    { en: 'It rained ___ the holiday.', nl: 'Het regende tijdens de vakantie.' },
    { en: 'Be quiet ___ the film.', nl: 'Wees stil tijdens de film.' },
  ],
  until: [
    { en: 'They stayed ___ the end of the concert.', nl: 'Ze bleven tot het einde van het concert.' },
    { en: 'I can stay up ___ ten o\'clock.', nl: 'Ik mag opblijven tot tien uur.' },
    { en: 'The shop is open ___ six.', nl: 'De winkel is open tot zes uur.' },
    { en: 'We played ___ it was dark.', nl: 'We speelden tot het donker was.' },
  ],
}

export const REGELS: Regel[] = [
  {
    id: 'can-have-to',
    titel: 'Can or have to',
    herkenKopje: /can or have to/i,
    herken: /\b(can't|cannot|can|have to|has to|don't have to|doesn't have to)\b/i,
    beslisvragen: [
      { vraag: 'Gaat het om mogen of om moeten?', opties: ['mogen', 'moeten'] },
      { vraag: 'Is het wel of niet?', opties: ['wel', 'niet'] },
    ],
    begrippen: [
      { id: 'can', vorm: 'can', betekenis: 'mag of kan', situatie: 'Het mag', emoji: '✅', antwoorden: ['mogen', 'wel'] },
      { id: 'cant', vorm: "can't", betekenis: 'mag niet', situatie: 'Het is verboden', emoji: '🚫', antwoorden: ['mogen', 'niet'], varianten: ['cannot', 'can not', 'cant'] },
      { id: 'have-to', vorm: 'have to', betekenis: 'moet', situatie: 'Het moet', emoji: '❗', antwoorden: ['moeten', 'wel'] },
      { id: 'dont-have-to', vorm: "don't have to", betekenis: 'hoeft niet', situatie: 'Het hoeft niet', emoji: '😌', antwoorden: ['moeten', 'niet'], varianten: ['do not have to', 'dont have to'] },
    ],
    schema: 'raster',
    valkuil: '"Don\'t have to" betekent niet "moet niet", maar "hoeft niet": het mag wel, het is alleen niet verplicht.',
    valkuilBij: [['dont-have-to', 'cant']],
    denkfout: 'Als er "niet" in staat, is het altijd verboden.',
    startvraag: { begrip: 'dont-have-to', zin: "You don't have to cook dinner." },
    hardop:
      'Ik stel mezelf twee vragen. Eerst: gaat het om mogen of om moeten? Dan: is het wel of niet? "Je hoeft niet te koken": dat gaat over moeten, en het is niet. Dus: don\'t have to.',
    maakZin: (begrip, bron, kans) => {
      const eigen = werkwoordenUitLijst(bron)
      const ww = kies(eigen.length > 0 ? [...eigen, ...STANDAARD_WERKWOORDEN] : STANDAARD_WERKWOORDEN, kans)
      return { en: `${onderwerp(ww.en, kans)} ___ ${ww.en}.`, nl: `${begrip.emoji} ${begrip.situatie}: ${ww.nl}` }
    },
  },
  {
    id: 'it-is-they-are',
    titel: 'It is / They are',
    herkenKopje: /it is\s*\.*\s*\/\s*they are/i,
    herken: /\b(it is|it's|it isn't|they are|they're|they aren't)\b/i,
    beslisvragen: [
      { vraag: 'Gaat het over één ding of over meer dingen?', opties: ['één', 'meer'] },
      { vraag: 'Is het wel of niet?', opties: ['wel', 'niet'] },
    ],
    begrippen: [
      { id: 'it-is', vorm: 'it is', betekenis: 'het is (één ding)', situatie: 'Eén ding: het is', emoji: '1️⃣', antwoorden: ['één', 'wel'], varianten: ["it's", 'its'] },
      { id: 'it-isnt', vorm: "it isn't", betekenis: 'het is niet (één ding)', situatie: 'Eén ding: het is niet', emoji: '1️⃣', antwoorden: ['één', 'niet'], varianten: ['it is not', "it's not", 'its not', 'it isnt'] },
      { id: 'they-are', vorm: 'they are', betekenis: 'ze zijn (meer dingen)', situatie: 'Meer dingen: ze zijn', emoji: '🔢', antwoorden: ['meer', 'wel'], varianten: ["they're", 'theyre'] },
      { id: 'they-arent', vorm: "they aren't", betekenis: 'ze zijn niet (meer dingen)', situatie: 'Meer dingen: ze zijn niet', emoji: '🔢', antwoorden: ['meer', 'niet'], varianten: ['they are not', "they're not", 'theyre not', 'they arent'] },
    ],
    schema: 'raster',
    valkuil: 'In het Nederlands zeg je soms "het zijn tomaten", maar over meer dingen zeg je in het Engels altijd "they are".',
    valkuilBij: [['they-are', 'it-is'], ['they-arent', 'it-isnt']],
    denkfout: 'Je kiest "it is" omdat je in het Nederlands "het" zegt.',
    startvraag: { begrip: 'they-are', zin: 'The tomatoes? They are red.' },
    hardop:
      'Ik stel mezelf twee vragen. Eerst: gaat het over één ding of over meer dingen? Dan: is het wel of niet? "De tomaten zijn rood": dat zijn meer dingen, en het is wel. Dus: they are.',
    maakZin: (begrip, bron, kans) => {
      const ding = kies(uitEigenLijst(DINGEN, bron, (d) => [d.en, d.enMv]), kans)
      const eig = kies(uitEigenLijst(EIGENSCHAPPEN, bron), kans)
      const meer = begrip.antwoorden[0] === 'meer'
      const niet = begrip.antwoorden[1] === 'niet' ? ' niet' : ''
      return meer
        ? { en: `The ${ding.enMv}? ___ ${eig.en}.`, nl: `De ${ding.nlMv} zijn${niet} ${eig.nl}.` }
        : { en: `The ${ding.en}? ___ ${eig.en}.`, nl: `De ${ding.nl} is${niet} ${eig.nl}.` }
    },
  },
  {
    id: 'voorzetsels-tijd',
    titel: 'Voorzetsels van tijd',
    herkenKopje: /voorzetsels van tijd|prepositions of time/i,
    herken: /\b(after|before|during|until)\b|\bat \d|\bon (mon|tues|wednes|thurs|fri|satur|sun)days?\b/i,
    beslisvragen: [{ vraag: 'Wat voor tijd is het?', opties: ['een kloktijd', 'een dag', 'ervoor', 'erna', 'terwijl iets bezig is', 'tot een eindpunt'] }],
    begrippen: [
      { id: 'at', vorm: 'at', betekenis: 'om', situatie: 'om (een kloktijd)', emoji: '⏰', antwoorden: ['een kloktijd'] },
      { id: 'on', vorm: 'on', betekenis: 'op', situatie: 'op (een dag)', emoji: '📅', antwoorden: ['een dag'] },
      { id: 'before', vorm: 'before', betekenis: 'voor', situatie: 'voor (ervoor)', emoji: '⏪', antwoorden: ['ervoor'] },
      { id: 'after', vorm: 'after', betekenis: 'na', situatie: 'na (erna)', emoji: '⏩', antwoorden: ['erna'] },
      { id: 'during', vorm: 'during', betekenis: 'tijdens', situatie: 'tijdens (terwijl iets bezig is)', emoji: '⏯️', antwoorden: ['terwijl iets bezig is'] },
      { id: 'until', vorm: 'until', betekenis: 'tot', situatie: 'tot (een eindpunt)', emoji: '🏁', antwoorden: ['tot een eindpunt'] },
    ],
    schema: 'lijst',
    valkuil: 'Om een kloktijd is "at", op een dag is "on". En "voor" in de tijd (voor het eten) is "before", niet "for".',
    valkuilBij: [['at', 'on'], ['on', 'at'], ['before', 'after'], ['after', 'before']],
    denkfout: 'Je vertaalt woord voor woord, zonder te kijken wat voor tijd het is.',
    startvraag: { begrip: 'on', zin: 'I always play football on Saturdays.' },
    hardop:
      'Ik stel mezelf één vraag: wat voor tijd is het? "Op zaterdag": dat is een dag, dus "on". "Om 3 uur": dat is een kloktijd, dus "at".',
    maakZin: (begrip, _bron, kans) => kies(TIJDZINNEN[begrip.id], kans),
  },
]

export function regelMetId(id: string): Regel | undefined {
  return REGELS.find((r) => r.id === id)
}

const kaal = (t: string) => t.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z' ]/g, '').replace(/\s+/g, ' ').trim()

/**
 * Welke regels staan er op het blad? Een kopje zoals "Voorzetsels van tijd", minstens twee zinnen met een vorm
 * van de regel, of minstens drie losse woorden die precies de begrippen zijn (after, at, before…).
 */
export function stelRegelsVoor(teksten: string[]): Regel[] {
  return REGELS.filter((r) => {
    if (teksten.some((t) => r.herkenKopje.test(t))) return true
    if (teksten.filter((t) => r.herken.test(t)).length >= 2) return true
    const vormen = new Set(r.begrippen.map((b) => kaal(b.vorm)))
    return new Set(teksten.map(kaal).filter((t) => vormen.has(t))).size >= 3
  })
}

/** Hoort dit woordpaar als voorbeeld bij de regel: een begrip zelf (after = na), of een zin met de regel? */
export function isRegelvoorbeeld(regel: Regel, woord: string): boolean {
  const w = woord.trim()
  if (regel.begrippen.some((b) => kaal(b.vorm) === kaal(w))) return true
  const isZin = /[.?!]$/.test(w) || /^[A-Z]/.test(w) || w.split(/\s+/).length >= 4
  return isZin && regel.herken.test(w)
}

/**
 * Werkwoorden uit de eigen lijst die in een zin passen: een Engelse woordgroep zonder lidwoord vooraan,
 * hooguit vijf woorden, geen hele zin, en een Nederlandse betekenis die eindigt op een werkwoord (-en).
 */
export function werkwoordenUitLijst(paren: Bronwoord[]): Werkwoord[] {
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
        !REGELS.some((r) => r.herken.test(w) || r.begrippen.some((b) => kaal(b.vorm) === kaal(w)))
      )
    })
    .map(({ woord, betekenis }) => ({ en: woord.trim(), nl: betekenis.trim().replace(/^[A-Z]/, (c) => c.toLowerCase()) }))
}

export interface Regelvraag {
  /** Begrijpen: een Engelse zin, kies de betekenis. Toepassen: een Nederlandse zin, kies de vorm. */
  richting: 'begrijpen' | 'toepassen'
  /** De Engelse zin; bij toepassen met ___ op de plek van de vorm. */
  zin: string
  /** Bij toepassen: de Nederlandse zin die de betekenis vastlegt. */
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

/** Vult het gat in; aan het begin van de zin met een hoofdletter. */
function vulIn(zin: string, vorm: string): string {
  return zin.startsWith('___') ? zin.replace('___', vorm.charAt(0).toUpperCase() + vorm.slice(1)) : zin.replace(/\? ___/, `? ${vorm.charAt(0).toUpperCase()}${vorm.slice(1)}`).replace('___', vorm)
}

/**
 * Maakt een nieuwe vraag voor één begrip, steeds met een andere zin (vast per zaad, zodat hervatten
 * dezelfde vraag geeft). De opties zijn altijd alle begrippen van de regel, in vaste volgorde, zodat de
 * plek van de knop niets verraadt.
 */
export function maakRegelvraag(regel: Regel, begripId: string, richting: 'begrijpen' | 'toepassen', bron: Bronwoord[], zaad: string): Regelvraag {
  const kans = zaadKans(zaad)
  const begrip = regel.begrippen.find((b) => b.id === begripId)!
  const { en, nl } = regel.maakZin(begrip, bron, kans)
  const heleZin = vulIn(en, begrip.vorm)
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
    zin: en,
    situatie: nl,
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
  const vraag = regel.beslisvragen[Math.max(0, mis)]
  const val = regel.valkuilBij.some(([g, k]) => g === goedId && k === gekozenId) ? ` ${regel.valkuil}` : ''
  return `${vraag.vraag} Hier is het "${goed.antwoorden[Math.max(0, mis)]}". Dus "${goed.vorm}": ${goed.betekenis}.${val}`
}

/**
 * Hoeveel steun een regelvraag krijgt (spec regels, R2), afgebouwd op wat de leerling laat zien:
 * - nog nooit goed: beide beslisvragen, het antwoord volgt daaruit;
 * - één keer goed: alleen de eerste beslisvraag, dan kiezen uit wat overblijft;
 * - daarna: direct kiezen uit alle begrippen;
 * - toepassen, twee keer zonder hulp goed: de vorm zelf typen.
 * Na een fout één stap terug. In de toetsronde nooit steun.
 */
export type Regelsteun = 'twee-vragen' | 'een-vraag' | 'kiezen' | 'typen'

const STEUN: Regelsteun[] = ['twee-vragen', 'een-vraag', 'kiezen', 'typen']

export function regelsteun(
  richting: 'begrijpen' | 'toepassen',
  pogingen: { oordeel: string; hulp: string; antwoordZelfToegevoegd?: boolean }[],
  toetsvorm = false,
): Regelsteun {
  const goed = pogingen.filter((p) => p.oordeel === 'goed').length
  const vrij = pogingen.filter((p) => p.oordeel === 'goed' && p.hulp === 'vrij opgehaald' && !p.antwoordZelfToegevoegd).length
  let steun: Regelsteun = goed === 0 ? 'twee-vragen' : goed === 1 ? 'een-vraag' : richting === 'toepassen' && vrij >= 2 ? 'typen' : 'kiezen'
  const laatste = pogingen.at(-1)
  if (laatste && laatste.oordeel !== 'goed' && steun !== 'twee-vragen') steun = STEUN[STEUN.indexOf(steun) - 1]
  if (toetsvorm) return steun === 'typen' ? 'typen' : 'kiezen'
  return steun
}

/** Welk begrip bedoelde de leerling met dit getypte antwoord? Hoofdletters en leestekens tellen niet. */
export function begripUitGetypt(regel: Regel, getypt: string): string | undefined {
    const g = kaal(getypt)
  // Langste vorm eerst, zodat "don't have to" niet als "have to" telt.
  const opLengte = [...regel.begrippen].sort((a, b) => b.vorm.length - a.vorm.length)
  return opLengte.find((b) => [b.vorm, ...(b.varianten ?? [])].some((v) => kaal(v) === g))?.id
}

/** Het begrip dat er het meest op lijkt: de bekende verwisseling (valkuil) eerst, anders verschil in één beslisvraag. */
export function verwarbaarBegrip(regel: Regel, begripId: string): string {
  const valkuil = regel.valkuilBij.find(([g]) => g === begripId)
  if (valkuil) return valkuil[1]
  const b = regel.begrippen.find((x) => x.id === begripId)!
  const buren = regel.begrippen.filter((x) => x.id !== b.id && x.antwoorden.filter((a, i) => a !== b.antwoorden[i]).length === 1)
  return (buren.find((x) => x.antwoorden.at(-1) === b.antwoorden.at(-1)) ?? buren[0] ?? regel.begrippen.find((x) => x.id !== b.id)!).id
}

export interface Zelfuitleg {
  vraag: string
  opties: { tekst: string; goed: boolean }[]
}

/**
 * Een zelfuitlegvraag (spec regels, R3): waarom is het hier dit begrip en niet het begrip dat erop lijkt?
 * De opties zijn de uitleg via de beslisvragen, dezelfde uitleg voor het andere begrip, en de bekende
 * denkfout dat "niet" altijd "mag niet" betekent.
 */
export function maakZelfuitleg(regel: Regel, begripId: string, zaad: string): Zelfuitleg {
  const b = regel.begrippen.find((x) => x.id === begripId)!
  const ander = regel.begrippen.find((x) => x.id === verwarbaarBegrip(regel, begripId))!
  const uitleg = (x: Begrip) => `Het gaat om ${x.antwoorden.join(', en het is ')}: ${x.betekenis}.`
  const opties = [
    { tekst: uitleg(b), goed: true },
    { tekst: uitleg(ander), goed: false },
    { tekst: regel.denkfout, goed: false },
  ]
  const kans = zaadKans(zaad)
  return {
    vraag: `Waarom is het hier "${b.vorm}" en niet "${ander.vorm}"?`,
    opties: opties.map((o) => ({ o, k: kans() })).sort((x, y) => x.k - y.k).map((x) => x.o),
  }
}

/** Af en toe een zelfuitleg na een goed antwoord zonder steun: ongeveer één op de drie keer, vast per zaad. */
export function zelfuitlegNu(zaad: string): boolean {
  return zaadKans(`${zaad}-uitleg`)() < 1 / 3
}

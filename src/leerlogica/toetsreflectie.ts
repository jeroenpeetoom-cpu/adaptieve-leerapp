// Reflectie na de toets: drie korte tikvragen, elke keer anders gesteld (spec na-de-toets).
import type { Leeritem, Poging } from './types'
import { kalenderdag } from './tijd'

/** De drie onderdelen van de reflectie: kennis, strategie en vooruitkijken. */
export type Reflectiedeel = 'kennis' | 'strategie' | 'vooruit'

export interface Keuze {
  id: string
  tekst: string
}

export interface Reflectievraag {
  id: string
  vraag: string
  keuzes: Keuze[]
  /** Een vervolgvraag die alleen komt bij deze antwoorden. */
  vervolg?: { bij: string[]; vraag: string; keuzes: Keuze[] }
}

/** Welke variant per onderdeel gesteld is. */
export type Varianten = Record<Reflectiedeel, string>

export interface ToetsReflectie {
  bronId: string
  /** De toetsdag waar de reflectie over gaat. */
  toetsdag: string
  tijdstip: string
  varianten: Varianten
  /** Per onderdeel het gekozen antwoord; "ruimte" is het antwoord op de vervolgvraag. */
  antwoorden: Partial<Record<Reflectiedeel | 'ruimte', string>>
  keuze: 'onthouden' | 'klaar'
}

const RUIMTE: Reflectievraag['vervolg'] = {
  bij: ['grotendeels', 'niet-echt'],
  vraag: 'Waar lag nog ruimte?',
  keuzes: [
    { id: 'eerder', tekst: '⏰ Eerder beginnen met leren' },
    { id: 'vaker', tekst: '🔁 Vaker oefenen' },
    { id: 'opletten', tekst: '👀 Beter opletten tijdens het leren' },
    { id: 'toets-zelf', tekst: '😬 Op de toets zelf: haast of zenuwen' },
    { id: 'weet-niet', tekst: '🤷 Weet ik niet' },
  ],
}

export const REFLECTIEVRAGEN: Record<Reflectiedeel, Reflectievraag[]> = {
  kennis: [
    {
      id: 'hoe-ging',
      vraag: 'Hoe ging de toets?',
      keuzes: [
        { id: 'niet-goed', tekst: '😟 Niet goed' },
        { id: 'gaat-wel', tekst: '😐 Gaat wel' },
        { id: 'goed', tekst: '🙂 Goed' },
        { id: 'heel-goed', tekst: '😄 Heel goed' },
      ],
    },
    {
      id: 'hoeveel',
      vraag: 'Hoeveel wist je op de toets?',
      keuzes: [
        { id: 'weinig', tekst: 'Weinig' },
        { id: 'helft', tekst: 'Ongeveer de helft' },
        { id: 'bijna-alles', tekst: 'Bijna alles' },
        { id: 'alles', tekst: 'Alles' },
      ],
    },
    {
      id: 'best',
      vraag: 'Vind je dat je je best hebt gedaan voor deze toets?',
      keuzes: [
        { id: 'helemaal', tekst: '💪 Ja, helemaal' },
        { id: 'grotendeels', tekst: '👍 Grotendeels' },
        { id: 'niet-echt', tekst: '🙈 Niet echt' },
      ],
      vervolg: RUIMTE,
    },
    {
      id: 'verwachting',
      vraag: 'Was de toets makkelijker of moeilijker dan je dacht?',
      keuzes: [
        { id: 'moeilijker', tekst: '🧗 Moeilijker' },
        { id: 'zoals-gedacht', tekst: '🎯 Zoals ik dacht' },
        { id: 'makkelijker', tekst: '🛝 Makkelijker' },
      ],
    },
  ],
  strategie: [
    { id: 'hielp', vraag: 'Wat hielp jou het meest bij het leren?', keuzes: [] },
    { id: 'vriend', vraag: 'Welke aanpak zou je een vriend aanraden voor zo’n toets?', keuzes: [] },
    { id: 'een-ding', vraag: 'Als je maar één ding mocht gebruiken, welke koos je dan?', keuzes: [] },
  ],
  vooruit: [
    {
      id: 'volgende-keer',
      vraag: 'Wat doe je de volgende keer?',
      keuzes: [
        { id: 'hetzelfde', tekst: '✅ Hetzelfde, het werkte' },
        { id: 'eerder', tekst: '⏰ Eerder beginnen' },
        { id: 'beelden', tekst: '🖼️ Meer eigen beelden maken' },
        { id: 'toetsronde', tekst: '📝 Vaker een toetsronde doen' },
      ],
    },
    {
      id: 'meenemen',
      vraag: 'Wat neem je mee naar je volgende toets?',
      keuzes: [
        { id: 'hetzelfde', tekst: '✅ Gewoon zo doorgaan' },
        { id: 'eerder', tekst: '⏰ Op tijd beginnen' },
        { id: 'beelden', tekst: '🖼️ Bij lastige woorden een beeld maken' },
        { id: 'toetsronde', tekst: '📝 Mezelf vaker overhoren' },
      ],
    },
    {
      id: 'anders',
      vraag: 'Zou je de volgende keer iets anders doen?',
      keuzes: [
        { id: 'hetzelfde', tekst: '✅ Nee, dit ging goed' },
        { id: 'eerder', tekst: '⏰ Ja: eerder beginnen' },
        { id: 'beelden', tekst: '🖼️ Ja: meer beelden maken' },
        { id: 'toetsronde', tekst: '📝 Ja: vaker een toetsronde' },
      ],
    },
  ],
}

/** De korte tekst van een voornemen, om bij een volgende bron terug te laten zien. */
export const VOORNEMEN: Record<string, string> = {
  hetzelfde: 'zo doorgaan, want het werkte',
  eerder: 'eerder beginnen',
  beelden: 'meer eigen beelden maken',
  toetsronde: 'vaker een toetsronde doen',
}

/** Wacht deze bron op de reflectie na de toets? */
export function reflectieNodig(bron: { toetsdag: string | null; afgerond: boolean; toetsGereflecteerd?: string }, vandaag: string): boolean {
  return bron.toetsdag !== null && bron.toetsdag < vandaag && !bron.afgerond && bron.toetsGereflecteerd !== bron.toetsdag
}

function hash(tekst: string): number {
  let h = 2166136261
  for (let i = 0; i < tekst.length; i++) h = Math.imul(h ^ tekst.charCodeAt(i), 16777619)
  return h >>> 0
}

/** Kiest per onderdeel een variant, nooit dezelfde als de vorige keer. */
export function kiesVarianten(vorige: Varianten | null, zaad: string): Varianten {
  const kies = (deel: Reflectiedeel): string => {
    const opties = REFLECTIEVRAGEN[deel].map((v) => v.id).filter((id) => id !== vorige?.[deel])
    return opties[hash(`${zaad}-${deel}`) % opties.length]
  }
  return { kennis: kies('kennis'), strategie: kies('strategie'), vooruit: kies('vooruit') }
}

export function reflectievraag(deel: Reflectiedeel, variant: string): Reflectievraag {
  return REFLECTIEVRAGEN[deel].find((v) => v.id === variant) ?? REFLECTIEVRAGEN[deel][0]
}

const AANPAK: Record<string, string> = {
  ophalen: '🧠 Eerst zelf ophalen uit mijn geheugen',
  beelden: '🖼️ Mijn eigen beelden',
  route: '🗺️ De geheugenroute',
  toetsronde: '📝 De toetsronde',
  'elke-dag': '📅 Elke dag een beetje',
  anders: '💡 Iets anders',
}

/** De aanpakken die de leerling bij deze leeritems echt gebruikte, als keuzes voor de strategievraag. */
export function gebruikteAanpakken(leeritems: Leeritem[], pogingen: Poging[], tijdzone: string): Keuze[] {
  const ids = new Set(leeritems.map((i) => i.id))
  const eigen = pogingen.filter((p) => ids.has(p.leeritemId))
  const gebruikt = ['ophalen']
  if (eigen.some((p) => p.strategie === 'beelden koppelen')) gebruikt.push('beelden')
  if (eigen.some((p) => p.strategie === 'geheugenroute')) gebruikt.push('route')
  if (eigen.some((p) => p.toetsvorm)) gebruikt.push('toetsronde')
  if (new Set(eigen.map((p) => kalenderdag(p.tijdstip, tijdzone))).size >= 3) gebruikt.push('elke-dag')
  gebruikt.push('anders')
  return gebruikt.map((id) => ({ id, tekst: AANPAK[id] }))
}

/** Vraag en antwoord van een reflectie, om terug te lezen. */
export function beschrijfReflectie(r: ToetsReflectie): { vraag: string; antwoord: string }[] {
  const tekst = (keuzes: Keuze[], id?: string) => keuzes.find((k) => k.id === id)?.tekst ?? id ?? ''
  const kennis = reflectievraag('kennis', r.varianten.kennis)
  const regels = [{ vraag: kennis.vraag, antwoord: tekst(kennis.keuzes, r.antwoorden.kennis) }]
  if (r.antwoorden.ruimte && kennis.vervolg) regels.push({ vraag: kennis.vervolg.vraag, antwoord: tekst(kennis.vervolg.keuzes, r.antwoorden.ruimte) })
  regels.push({ vraag: reflectievraag('strategie', r.varianten.strategie).vraag, antwoord: AANPAK[r.antwoorden.strategie ?? ''] ?? '' })
  const vooruit = reflectievraag('vooruit', r.varianten.vooruit)
  regels.push({ vraag: vooruit.vraag, antwoord: tekst(vooruit.keuzes, r.antwoorden.vooruit) })
  return regels
}

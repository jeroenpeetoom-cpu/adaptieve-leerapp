// Terugkijken na een sessie met bewijs uit eigen werk, en één volgende stap die de app later controleert
// (spec leren-leren, S4). De vraag wisselt per keer.
import type { SessieToestand } from './sessie'
import { gebruikteAanpakken, type Keuze } from './toetsreflectie'
import type { Leeritem } from './types'

export type Reflectievariant = 'misging' | 'hielp' | 'verraste' | 'buiten' | 'vertrouwen'

export interface Sessiereflectievraag {
  variant: Reflectievariant
  vraag: string
  keuzes: Keuze[]
  /** Bij "misging": het leeritem waar het om gaat. */
  item?: Leeritem
}

/** Een voornemen bij één leeritem, dat de app bij de volgende keer dat het langskomt controleert. */
export interface Voornemen {
  itemId: string
  /** Het woord of de plek, om te tonen. */
  woord: string
  stap: string
  tijdstip: string
}

export const VOLGENDE_STAPPEN: Keuze[] = [
  { id: 'beeld', tekst: '🖼️ Er een beeld bij bedenken' },
  { id: 'zelf', tekst: '🧠 De volgende keer eerst goed zelf proberen' },
  { id: 'hardop', tekst: '🗣️ Het een paar keer hardop zeggen' },
  { id: 'letters', tekst: '🔤 Goed naar de letters kijken' },
]

export const VERRASSINGEN: Keuze[] = [
  { id: 'meer', tekst: '😃 Ik wist meer dan ik dacht' },
  { id: 'minder', tekst: '🤔 Ik wist minder dan ik dacht' },
  { id: 'vergeten', tekst: '😮 Een woord dat ik dacht te kennen, ging mis' },
  { id: 'niets', tekst: '🙂 Niets bijzonders' },
]

/** Eens per week: leren buiten de app (transfer) of zelfvertrouwen en omgaan met fouten. */
export const BUITEN_DE_APP: Keuze[] = [
  { id: 'ophalen', tekst: '🧠 Ja: zelf iets ophalen zonder te kijken (bijvoorbeeld voor een andere toets)' },
  { id: 'beeld', tekst: '🖼️ Ja: een beeld bedacht om iets te onthouden' },
  { id: 'elke-dag', tekst: '📅 Ja: elke dag een beetje geoefend (bijvoorbeeld bij sport of muziek)' },
  { id: 'nog-niet', tekst: '🤔 Nog niet, maar ik ga het proberen' },
]

export const BETER_GEWORDEN: Keuze[] = [
  { id: 'zonder-hulp', tekst: '⭐ Dingen weten zonder hulp' },
  { id: 'spelling', tekst: '🔤 Woorden goed spellen' },
  { id: 'toepassen', tekst: '📐 Een regel toepassen in een nieuwe zin' },
  { id: 'rustig', tekst: '😌 Rustig blijven als iets fout gaat' },
]

/** Plannen bij de check-in halverwege; "beeld" voert de app ook echt uit. */
export const CHECKIN_PLANNEN: Keuze[] = [
  { id: 'beeld', tekst: '🖼️ Bij een woord dat misgaat meteen een beeld maken' },
  { id: 'nadenken', tekst: '🧠 Eerst goed nadenken voordat ik "Weet ik niet" tik' },
  { id: 'letters', tekst: '🔤 Beter op de letters letten' },
  { id: 'doorgaan', tekst: '✅ Zo doorgaan, het gaat goed' },
]

/** De check-invraag, met het eigen bewijs, in een paar formuleringen. */
export function checkinVraag(variant: number, lastig: number, totaal: number): string {
  if (lastig === 0) return ['Halverwege, en alles ging goed! Hoe pak je de rest aan?', 'Je bent op de helft en nog niets ging mis. Wat is je plan?', 'Tot nu toe alles goed. Blijf je het zo doen?'][variant % 3]
  return [
    `Halverwege! Bij ${lastig} ${lastig === 1 ? 'vraag' : 'vragen'} ging het nog mis. Wat doe je bij de volgende lastige?`,
    `Even stilstaan: ${lastig} van de ${totaal} gingen nog niet goed. Wat ga je anders doen?`,
    `Je bent op de helft. ${lastig === 1 ? 'Eén vraag was' : `${lastig} vragen waren`} lastig. Hoe pak je de rest aan?`,
  ][variant % 3]
}

/** Na zoveel dagen komt de weekvraag weer. */
export const WEEKVRAAG_NA_DAGEN = 7

/** Het eerste leeritem dat bij de eerste poging in deze sessie niet goed ging. */
export function misgegaan(sessie: SessieToestand): Leeritem | undefined {
  const gezien = new Set<string>()
  for (const p of sessie.pogingen) {
    if (gezien.has(p.leeritemId)) continue
    gezien.add(p.leeritemId)
    if (p.oordeel !== 'goed') return sessie.leeritems.find((i) => i.id === p.leeritemId)
  }
  return undefined
}

/**
 * Kiest de reflectievraag voor na de sessie: een andere variant dan de vorige keer, en "misging" alleen als
 * er iets misging (dan is er bewijs om naar te kijken).
 */
export function kiesSessiereflectie(
  sessie: SessieToestand,
  vorige: Reflectievariant | null,
  tijdzone: string,
  /** De vorige weekvraag, als die er was, om af te wisselen en eens per week te stellen. */
  weekvraag?: { variant: 'buiten' | 'vertrouwen'; dagenGeleden: number } | null,
): Sessiereflectievraag {
  // Eens per week: leren buiten de app of zelfvertrouwen, afwisselend (spec leren-leren, beslissing 3).
  // undefined: onbekend, dan geen weekvraag; null: nog nooit gesteld.
  if (weekvraag !== undefined && (weekvraag === null || weekvraag.dagenGeleden >= WEEKVRAAG_NA_DAGEN)) {
    const variant = weekvraag?.variant === 'buiten' ? 'vertrouwen' : 'buiten'
    return variant === 'buiten'
      ? { variant, vraag: 'Heb je deze week buiten de app ook een van je aanpakken gebruikt?', keuzes: BUITEN_DE_APP }
      : { variant, vraag: 'Waar ben je deze week beter in geworden?', keuzes: BETER_GEWORDEN }
  }
  const fout = misgegaan(sessie)
  const volgorde: Reflectievariant[] = ['misging', 'hielp', 'verraste']
  const mogelijk = volgorde.filter((v) => (v !== 'misging' || fout) && v !== vorige)
  const start = vorige ? volgorde.indexOf(vorige) + 1 : 0
  const variant = [...volgorde.slice(start), ...volgorde.slice(0, start)].find((v) => mogelijk.includes(v)) ?? 'hielp'
  if (variant === 'misging' && fout) {
    const woord = fout.plek ? fout.toegestaneAntwoorden[0] : fout.vraag
    return { variant, item: fout, vraag: `Bij "${woord}" ging het mis. Wat ga je daarmee doen?`, keuzes: VOLGENDE_STAPPEN }
  }
  if (variant === 'verraste') return { variant, vraag: 'Wat verraste je vandaag?', keuzes: VERRASSINGEN }
  const items = [...new Map(sessie.leeritems.map((i) => [i.id, i])).values()]
  return { variant, vraag: 'Wat hielp je vandaag het meest?', keuzes: gebruikteAanpakken(items, sessie.pogingen, tijdzone) }
}

/** Hoe het voornemen afliep, als het leeritem in deze sessie langskwam: goed zonder hulp, of nog niet. */
export function uitkomstVoornemen(voornemen: Voornemen | null, sessie: SessieToestand): 'gelukt' | 'nog-niet' | null {
  if (!voornemen) return null
  const eerste = sessie.pogingen.find((p) => p.leeritemId === voornemen.itemId && p.tijdstip > voornemen.tijdstip)
  if (!eerste) return null
  return eerste.oordeel === 'goed' && eerste.hulp === 'vrij opgehaald' && !eerste.antwoordZelfToegevoegd ? 'gelukt' : 'nog-niet'
}

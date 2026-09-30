// Een beeldvoorstel als de leerling zelf geen beeld kan bedenken: emoji bij de betekenis en een gek
// zinnetje, plus een klank-tip. Zonder AI en zonder internet (spec, vraag 49). Pure module: het
// emoji-register wordt meegegeven.

import { SOORTEN, type PlekSoort } from '../leerlogica'

export type EmojiRegister = { nl: Record<string, string[]>; en: Record<string, string[]> }

export interface Beeldvoorstel {
  emoji: string
  zin: string
  /** Een korte beschrijving om over te nemen en aan te passen; leeg als er alleen een tip is. */
  kort: string
}

const LIDWOORD = /^(de|het|een|the|a|an|to)\s+/i

const ACTIES = [
  'die op je voordeur klopt',
  'die hardop een liedje zingt',
  'die op je hoofd danst',
  'die uit je broodtrommel springt',
  'die op de bank ligt te snurken',
  'die door de klas vliegt',
  'die met je hond voetbalt',
  'die in je bed ligt',
]


function kies<T>(lijst: T[], zaad: string): T {
  let h = 0
  for (const c of zaad) h = (h * 31 + c.charCodeAt(0)) | 0
  return lijst[Math.abs(h) % lijst.length]
}

const schoon = (w: string) => w.toLowerCase().replace(LIDWOORD, '').trim()

/** Emoji voor een woord of begrip: eerst het hele woord, dan losse woorden, dan delen van een samenstelling. */
export function emojiVoor(tekst: string, register: Record<string, string[]>, max = 2): string[] {
  const uit: string[] = []
  const neem = (lijst?: string[]) => lijst?.forEach((e) => uit.length < max && !uit.includes(e) && uit.push(e))
  const woord = schoon(tekst)
  neem(register[woord])
  for (const deel of woord.split(/\s+/)) if (deel.length >= 3) neem(register[deel])
  // Samenstellingen, zoals "noordzee" of "kapstok": zoek bekende woorden van minstens 4 letters erin.
  if (uit.length === 0 && woord.length >= 6) {
    const delen = Object.keys(register)
      .filter((k) => k.length >= 4 && !k.includes(' ') && woord.includes(k))
      .sort((a, b) => b.length - a.length)
    for (const d of delen) neem(register[d])
  }
  return uit
}

/** Voorstel bij een woordpaar: emoji bij de betekenis (en het vreemde woord), een gek zinnetje en een klank-tip. */
export function voorstelVoorWoord(woord: string, betekenis: string, register: EmojiRegister, zaad: string): Beeldvoorstel {
  const emoji = [...new Set([...emojiVoor(betekenis, register.nl), ...emojiVoor(woord, register.en)])].slice(0, 2)
  const klank = `Klinkt "${schoon(woord)}" als een Nederlands woord? Koppel dat in je hoofd aan ${schoon(betekenis)}.`
  if (emoji.length === 0) {
    return { emoji: '💭', zin: `${klank} Maak er iets groots, grappigs of vreemds van.`, kort: '' }
  }
  const b = schoon(betekenis)
  const actie = kies(ACTIES, zaad)
  const kort = b.includes(' ') ? `${b}, ${actie.replace(/^die /, 'terwijl het ')}` : `reuzen${b} ${actie}`
  return { emoji: emoji.join(' '), zin: `Stel je voor: ${b.includes(' ') ? kort : `een ${kort}`}. ${klank}`, kort }
}

/** Voorstel bij een plaatsnaam: emoji bij delen van de naam of de soort, en een klank-tip. */
export function voorstelVoorPlek(naam: string, soort: PlekSoort, register: EmojiRegister, zaad: string): Beeldvoorstel {
  const delen = emojiVoor(naam, register.nl)
  const emoji = [SOORTEN[soort].emoji, ...delen].slice(0, 3).join(' ')
  const tip =
    delen.length > 0
      ? `In "${naam}" zit iets wat je kent ${delen.join(' ')}. Maak daar een gek plaatje van, precies op die plek op de kaart.`
      : `Klinkt "${naam}" als iets wat je kent? Bij Luik kun je denken aan een luik in de grond. Bedenk zoiets voor ${naam}, precies op die plek op de kaart.`
  return { emoji, zin: `${tip} ${kies(['Hoe gekker, hoe beter.', 'Maak het groot en druk.', 'Laat het bewegen of geluid maken.'], zaad)}`, kort: '' }
}

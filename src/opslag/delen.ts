// Bronnen delen met een groep (spec delen): de begeleider downloadt een bron als bestand, dat versleuteld bij
// de app wordt gezet; de app van een kind met de groepscode haalt nieuwe bronnen vanzelf binnen. Alleen de
// leerstof wordt gedeeld: nooit pogingen, beelden, routes, namen of andere gegevens van het kind.
import type { Bron, Kaart, Plek, Woordpaar } from '../bronnen/model'
import type { Database } from './database'

export interface Deelbestand {
  formaat: 'woordexpeditie-bron'
  versie: 1
  /** Wanneer deze versie van de bron gedeeld is; een nieuwere versie vervangt een oudere. */
  gedeeldOp: string
  bron: Pick<Bron, 'id' | 'naam' | 'soort' | 'plekrichtingen' | 'taal' | 'toetsdag' | 'oefenrichtingen' | 'regels'>
  woordparen: Pick<Woordpaar, 'id' | 'woord' | 'betekenis' | 'bronversie' | 'regelvoorbeeld' | 'volgorde'>[]
  plekken: Omit<Plek, 'bronId'>[]
  kaarten: Pick<Kaart, 'id' | 'beeld' | 'breedte' | 'hoogte' | 'blind' | 'afgedekt' | 'leeg'>[]
}

export interface Indexregel {
  id: string
  naam: string
  gedeeldOp: string
  bestand: string
}

/** Maakt het deelbestand van een bron: alleen bevestigde leerstof. */
export async function maakDeelbestand(db: Database, bronId: string, nu: string): Promise<Deelbestand> {
  const bron = (await db.bronnen.get(bronId))!
  const paren = (await db.woordparen.where('bronId').equals(bronId).toArray()).filter((wp) => wp.bevestigd)
  const plekken = (await db.plekken.where('bronId').equals(bronId).toArray()).filter((p) => p.bevestigd)
  const kaarten = await db.kaarten.where('bronId').equals(bronId).toArray()
  return {
    formaat: 'woordexpeditie-bron',
    versie: 1,
    gedeeldOp: nu,
    bron: {
      id: bron.id,
      naam: bron.naam,
      soort: bron.soort,
      plekrichtingen: bron.plekrichtingen,
      taal: bron.taal,
      toetsdag: bron.toetsdag,
      oefenrichtingen: bron.oefenrichtingen,
      regels: bron.regels,
    },
    woordparen: paren.map(({ id, woord, betekenis, bronversie, regelvoorbeeld, volgorde }) => ({ id, woord, betekenis, bronversie, regelvoorbeeld, volgorde })),
    plekken: plekken.map(({ bronId: _bronId, ...rest }) => rest),
    kaarten: kaarten.map(({ id, beeld, breedte, hoogte, blind, afgedekt, leeg }) => ({ id, beeld, breedte, hoogte, blind, afgedekt, leeg })),
  }
}

// Versleuteling: AES-GCM met een sleutel uit de groepscode. Dezelfde instellingen staan in
// scripts/deel-bron.mjs; wijzig ze altijd op beide plekken.
const ZOUT = new TextEncoder().encode('woordexpeditie-gedeeld-v1')
const RONDES = 150_000

async function sleutel(code: string): Promise<CryptoKey> {
  const basis = await crypto.subtle.importKey('raw', new TextEncoder().encode(code.trim().toLowerCase()), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: ZOUT, iterations: RONDES, hash: 'SHA-256' }, basis, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
}

/** De map van een groep: afgeleid van de code, zodat de code zelf nergens online staat. */
export async function groepsmap(code: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`woordexpeditie:${code.trim().toLowerCase()}`))
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 24)
}

export async function versleutel(tekst: string, code: string): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await sleutel(code), new TextEncoder().encode(tekst)))
  const uit = new Uint8Array(iv.length + data.length)
  uit.set(iv)
  uit.set(data, iv.length)
  return uit
}

export async function ontsleutel(bytes: Uint8Array, code: string): Promise<string> {
  const data = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12) }, await sleutel(code), bytes.slice(12))
  return new TextDecoder().decode(data)
}

/**
 * Zet een gedeelde bron in de app, of werkt hem bij als er een nieuwere versie is. De ids blijven die van de
 * begeleider, zodat de voortgang van het kind bij een nieuwe versie gewoon doorloopt. Wat het kind zelf aan
 * de bron veranderde (afronden, de reflectie na de toets) blijft staan.
 */
export async function importeerDeelbestand(db: Database, deel: Deelbestand): Promise<'nieuw' | 'bijgewerkt' | 'al aanwezig'> {
  const bestaand = await db.bronnen.get(deel.bron.id)
  if (bestaand?.gedeeld && bestaand.gedeeld >= deel.gedeeldOp) return 'al aanwezig'
  // Een bron die het kind zelf heeft (bijvoorbeeld op dezelfde telefoon ingeladen) laten we met rust.
  if (bestaand && !bestaand.gedeeld) return 'al aanwezig'
  await db.transaction('rw', [db.bronnen, db.woordparen, db.plekken, db.kaarten], async () => {
    const bron: Bron = {
      afgerond: false,
      aangemaakt: deel.gedeeldOp,
      ...bestaand,
      ...deel.bron,
      oefenrichtingen: deel.bron.oefenrichtingen,
      gedeeld: deel.gedeeldOp,
    }
    await db.bronnen.put(bron)
    const ids = new Set(deel.woordparen.map((wp) => wp.id))
    await db.woordparen.where('bronId').equals(bron.id).filter((wp) => !ids.has(wp.id)).delete()
    await db.woordparen.bulkPut(
      deel.woordparen.map((wp) => ({
        ...wp,
        bronId: bron.id,
        bronpaginaId: null,
        bevestigd: true,
        twijfelWoord: 'geen' as const,
        twijfelBetekenis: 'geen' as const,
        bekeken: true,
      })),
    )
    const plekIds = new Set(deel.plekken.map((p) => p.id))
    await db.plekken.where('bronId').equals(bron.id).filter((p) => !plekIds.has(p.id)).delete()
    await db.plekken.bulkPut(deel.plekken.map((p) => ({ ...p, bronId: bron.id })))
    await db.kaarten.bulkPut(deel.kaarten.map((k) => ({ ...k, bronId: bron.id })))
  })
  return bestaand ? 'bijgewerkt' : 'nieuw'
}

/** Haalt nieuwe gedeelde bronnen van de groep op. Zonder internet of zonder groep gebeurt er niets. */
export async function haalGedeeldeBronnen(db: Database, code: string, basis: string): Promise<string[]> {
  const map = await groepsmap(code)
  const haal = async (bestand: string) => {
    const antwoord = await fetch(`${basis}gedeeld/${map}/${bestand}`, { cache: 'no-store' })
    if (!antwoord.ok) throw new Error(`niet gevonden: ${bestand}`)
    return ontsleutel(new Uint8Array(await antwoord.arrayBuffer()), code)
  }
  const index = JSON.parse(await haal('index.bin')) as Indexregel[]
  const nieuw: string[] = []
  for (const regel of index) {
    const bestaand = await db.bronnen.get(regel.id)
    if (bestaand && (!bestaand.gedeeld || bestaand.gedeeld >= regel.gedeeldOp)) continue
    const uitkomst = await importeerDeelbestand(db, JSON.parse(await haal(regel.bestand)) as Deelbestand)
    if (uitkomst !== 'al aanwezig') nieuw.push(regel.naam)
  }
  return nieuw
}

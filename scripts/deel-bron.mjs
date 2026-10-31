// Zet een gedeelde bron versleuteld bij de app (spec delen).
// Gebruik: node scripts/deel-bron.mjs <bron.json> [groepscode]
// Zonder groepscode: de groep die elke app vanzelf volgt (src/opslag/groep.json).
// Dezelfde versleuteling staat in src/opslag/delen.ts; wijzig ze altijd op beide plekken.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const [, , pad, codeArg] = process.argv
if (!pad) {
  console.error('Gebruik: node scripts/deel-bron.mjs <bron.json> [groepscode]')
  process.exit(1)
}
const code = codeArg ?? JSON.parse(readFileSync(new URL('../src/opslag/groep.json', import.meta.url), 'utf8')).code

const ZOUT = new TextEncoder().encode('woordexpeditie-gedeeld-v1')
const RONDES = 150_000
const schoon = code.trim().toLowerCase()

async function sleutel() {
  const basis = await crypto.subtle.importKey('raw', new TextEncoder().encode(schoon), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: ZOUT, iterations: RONDES, hash: 'SHA-256' }, basis, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
}
async function versleutel(tekst) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await sleutel(), new TextEncoder().encode(tekst)))
  return Buffer.concat([iv, data])
}
async function ontsleutel(bytes) {
  return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.subarray(0, 12) }, await sleutel(), bytes.subarray(12)))
}

const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`woordexpeditie:${schoon}`))
const map = [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 24)
const doel = join('public', 'gedeeld', map)
mkdirSync(doel, { recursive: true })

const deel = JSON.parse(readFileSync(pad, 'utf8'))
if (deel.formaat !== 'woordexpeditie-bron') throw new Error('Dit is geen gedeelde bron van de app.')
const bestand = `${deel.bron.id}.bin`
writeFileSync(join(doel, bestand), await versleutel(JSON.stringify(deel)))

const indexPad = join(doel, 'index.bin')
const index = existsSync(indexPad) ? JSON.parse(await ontsleutel(readFileSync(indexPad))) : []
const regel = { id: deel.bron.id, naam: deel.bron.naam, gedeeldOp: deel.gedeeldOp, bestand }
const nieuw = [...index.filter((r) => r.id !== regel.id), regel]
writeFileSync(indexPad, await versleutel(JSON.stringify(nieuw)))
console.log(`Gedeeld: "${deel.bron.naam}" (${deel.woordparen.length} woorden, ${deel.plekken.length} plekken) in groep ${map}; ${nieuw.length} bronnen in de groep.`)

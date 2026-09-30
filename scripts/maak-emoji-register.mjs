// Maakt een compact zoekregister van emoji-trefwoorden (Nederlands en Engels) uit emojibase-data (MIT),
// voor beeldvoorstellen bij het maken van een geheugenbeeld. Alles blijft in de app zelf.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const lees = (taal) => JSON.parse(readFileSync(join(root, 'node_modules', 'emojibase-data', taal, 'compact.json'), 'utf8'))

function register(emoji) {
  const uit = {}
  const voeg = (woord, teken, voorrang) => {
    const k = woord.toLowerCase().trim()
    if (k.length < 2) return
    uit[k] ??= []
    if (!uit[k].includes(teken)) (voorrang ? uit[k].unshift(teken) : uit[k].push(teken))
    uit[k] = uit[k].slice(0, 4)
  }
  for (const e of emoji) {
    // Alleen gewone emoji: geen vlaggen, symbolen of huidskleuren (groep 8 en 9, en regionale tekens).
    if (e.group === undefined || e.group >= 8) continue
    voeg(e.label, e.unicode, true)
    for (const w of e.label.split(/[\s:,]+/)) voeg(w, e.unicode, false)
    for (const t of e.tags ?? []) voeg(t, e.unicode, false)
  }
  return uit
}

const doel = join(root, 'src', 'beelden', 'emoji-register.json')
writeFileSync(doel, JSON.stringify({ nl: register(lees('nl')), en: register(lees('en')) }))
console.log(`Emoji-register gemaakt: ${doel}`)

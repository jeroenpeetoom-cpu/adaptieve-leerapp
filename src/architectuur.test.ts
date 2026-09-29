import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// De leerlogica moet los testbaar blijven: geen schermcode, geen opslag en geen systeemklok.
const map = join(import.meta.dirname, 'leerlogica')
const bronbestanden = readdirSync(map, { recursive: true })
  .map(String)
  .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))

const verboden: [string, RegExp][] = [
  ['React', /from ['"]react/],
  ['schermcode', /\bdocument\b|\bwindow\b/],
  ['opslag', /indexedDB|localStorage|sessionStorage/],
  ['systeemklok', /Date\.now\(|new Date\(\s*\)|performance\.now\(/],
  ['imports buiten de leerlogica', /from ['"]\.\.\//],
]

describe('architectuur van de leerlogica', () => {
  it.each(bronbestanden)('%s gebruikt geen schermen, opslag of systeemklok', (bestand) => {
    const inhoud = readFileSync(join(map, bestand), 'utf8')
    for (const [naam, patroon] of verboden) {
      expect(patroon.test(inhoud), `${bestand} gebruikt ${naam}`).toBe(false)
    }
  })
})

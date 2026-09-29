import type { Leeritem } from '../leerlogica'

/** Vaste, al bevestigde testbron uit het bouwdocument. Alleen voor de testfunctie. */
const woordparen: [string, string, string][] = [
  ['wp-bridge', 'bridge', 'brug'],
  ['wp-cloud', 'cloud', 'wolk'],
  ['wp-key', 'key', 'sleutel'],
  ['wp-river', 'river', 'rivier'],
]

export const testLeeritems: Leeritem[] = woordparen.map(([woordpaarId, woord, betekenis]) => ({
  id: `${woordpaarId}-en-nl`,
  soort: 'woordpaar',
  woordpaarId,
  bronversie: 1,
  oefenrichting: { van: 'en', naar: 'nl' },
  vraag: woord,
  toegestaneAntwoorden: [betekenis],
}))

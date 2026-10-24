import type { Leeritem } from '../leerlogica'
import { leeritemsVanRegels } from '../bronnen/leeritems'

export const TESTBRON_ID = 'testbron-engels'

/** Vaste, al bevestigde testbron uit het bouwdocument. Alleen voor de testfunctie. */
const woordparen: [string, string, string][] = [
  ['wp-bridge', 'bridge', 'brug'],
  ['wp-cloud', 'cloud', 'wolk'],
  ['wp-key', 'key', 'sleutel'],
  ['wp-river', 'river', 'rivier'],
]

const woordItems: Leeritem[] = woordparen.map(([woordpaarId, woord, betekenis]) => ({
  id: `${woordpaarId}-en-nl`,
  soort: 'woordpaar',
  bronId: TESTBRON_ID,
  woordpaarId,
  bronversie: 1,
  oefenrichting: { van: 'en', naar: 'nl' },
  vraag: woord,
  toegestaneAntwoorden: [betekenis],
}))

/** De testbron oefent ook de regel "Can or have to", zodat de begeleider de regelles kan bekijken. */
export const testLeeritems: Leeritem[] = [
  ...woordItems,
  ...leeritemsVanRegels({
    id: TESTBRON_ID,
    naam: 'Testwoorden',
    taal: 'en',
    toetsdag: null,
    oefenrichtingen: [],
    afgerond: false,
    aangemaakt: '',
    regels: ['can-have-to'],
  }),
]

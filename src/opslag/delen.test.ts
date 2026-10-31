import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { Database } from './database'
import { verwijderBron } from './verwijderen'
import { importeerDeelbestand, maakDeelbestand, ontsleutel, versleutel, groepsmap, type Deelbestand } from './delen'

// Twee databases tegelijk: die van de begeleider ('echt') en die van het kind ('test').
const open: Database[] = []
const nieuweDb = (omgeving: 'echt' | 'test' = 'echt') => {
  const db = new Database(omgeving)
  open.push(db)
  return db
}
afterEach(async () => {
  for (const db of open.splice(0)) await db.delete()
})

async function metBron(db: Database) {
  await db.bronnen.add({ id: 'b1', naam: 'Song 3', soort: 'woordenlijst', taal: 'en', toetsdag: '2026-11-10', oefenrichtingen: [{ van: 'en', naar: 'nl' }], afgerond: false, aangemaakt: '2026-10-01', regels: ['can-have-to'] })
  const wp = (id: string, woord: string, betekenis: string, bevestigd = true) => ({ id, bronId: 'b1', bronpaginaId: null, woord, betekenis, bronversie: 1, bevestigd, twijfelWoord: 'geen' as const, twijfelBetekenis: 'geen' as const, bekeken: true, volgorde: 1 })
  await db.woordparen.bulkAdd([wp('w1', 'fear', 'angst'), wp('w2', 'job', 'baan'), wp('w3', 'nog niet', 'bevestigd', false)])
  await db.pogingen.add({ id: 'p1', sessieId: 's', leeritemId: 'w1-en-nl', bronversie: 1, antwoord: 'angst', oordeel: 'goed', hulp: 'vrij opgehaald', antwoordZelfToegevoegd: false, tijdstip: '2026-10-02T10:00:00Z', regelversie: 1 })
}

describe('bronnen delen', () => {
  it('deelt alleen bevestigde leerstof, nooit pogingen', async () => {
    const db = nieuweDb()
    await metBron(db)
    const deel = await maakDeelbestand(db, 'b1', '2026-10-31T10:00:00Z')
    expect(deel.woordparen.map((w) => w.woord)).toEqual(['fear', 'job'])
    expect(JSON.stringify(deel)).not.toContain('vrij opgehaald')
    expect(deel.bron.regels).toEqual(['can-have-to'])
  })

  it('versleutelt met de groepscode; zonder de goede code is het onleesbaar', async () => {
    const geheim = await versleutel('{"a":1}', 'Groep-7')
    expect(await ontsleutel(geheim, 'groep-7')).toBe('{"a":1}')
    await expect(ontsleutel(geheim, 'andere-code')).rejects.toThrow()
    expect(await groepsmap('groep-7')).not.toContain('groep')
  })

  it('zet een gedeelde bron klaar om te oefenen, en werkt alleen bij met een nieuwere versie', async () => {
    const ouder = nieuweDb()
    await metBron(ouder)
    const deel: Deelbestand = await maakDeelbestand(ouder, 'b1', '2026-10-31T10:00:00Z')
    const kind = nieuweDb('test')
    expect(await importeerDeelbestand(kind, deel)).toBe('nieuw')
    expect((await kind.woordparen.toArray()).every((w) => w.bevestigd)).toBe(true)
    expect(await importeerDeelbestand(kind, deel)).toBe('al aanwezig')
    await kind.bronnen.update('b1', { afgerond: true })
    const nieuwer = { ...deel, gedeeldOp: '2026-11-01T10:00:00Z', woordparen: deel.woordparen.slice(0, 1) }
    expect(await importeerDeelbestand(kind, nieuwer)).toBe('bijgewerkt')
    expect((await kind.woordparen.toArray()).map((w) => w.woord)).toEqual(['fear'])
    expect((await kind.bronnen.get('b1'))?.afgerond).toBe(true)
  })

  it('laat een eigen bron met hetzelfde id met rust', async () => {
    const db = nieuweDb()
    await metBron(db)
    const deel = await maakDeelbestand(db, 'b1', '2026-10-31T10:00:00Z')
    expect(await importeerDeelbestand(db, deel)).toBe('al aanwezig')
  })

  it('onthoudt een verwijderde gedeelde bron, zodat die niet terugkomt', async () => {
    const ouder = nieuweDb()
    await metBron(ouder)
    const kind = nieuweDb('test')
    await importeerDeelbestand(kind, await maakDeelbestand(ouder, 'b1', '2026-10-31T10:00:00Z'))
    await verwijderBron(kind, 'b1')
    expect(await kind.leesMeta<string[]>('gedeeldVerwijderd', [])).toEqual(['b1'])
  })
})

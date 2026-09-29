import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { leesBackup, maakBackup, OngeldigeBackup, zetBackupTerug } from './backup'
import { Database } from './database'

const open: Database[] = []
const maak = () => {
  const db = new Database('test')
  open.push(db)
  return db
}
afterEach(async () => {
  for (const db of open.splice(0)) await db.delete()
})

async function vul(db: Database) {
  await db.bronnen.add({ id: 'b1', naam: 'Engels H3', taal: 'en', toetsdag: null, oefenrichtingen: [{ van: 'en', naar: 'nl' }], afgerond: false, aangemaakt: 't' })
  await db.bronpaginas.add({ id: 'p1', bronId: 'b1', volgorde: 1, origineelNummer: null, status: 'verwerkt', foto: new Blob(['x']), losseRegels: [], melding: null })
  await db.woordparen.add({ id: 'w1', bronId: 'b1', bronpaginaId: 'p1', woord: 'bridge', betekenis: 'brug', bronversie: 1, bevestigd: true, twijfelWoord: 'geen', twijfelBetekenis: 'geen', bekeken: false, volgorde: 1 })
  await db.slaPogingOp({ id: 'po1', sessieId: 's', leeritemId: 'w1-en-nl', bronversie: 1, antwoord: 'brug', oordeel: 'goed', hulp: 'vrij opgehaald', antwoordZelfToegevoegd: false, tijdstip: 't', regelversie: 1 })
  await db.leerlingen.add({ id: 'l1', bijnaam: 'Sam', leeftijdsgroep: '8-11', onderwijsniveau: 'Basisschool', leerjaar: 'groep 7', stand: 'zelfstandig', aangemaakt: 't' })
  await db.schrijfMeta('extraAntwoorden', { 'w1-en-nl': ['de brug'] })
  await db.schrijfMeta('laatsteBackup', 'eerder')
}

describe('back-up', () => {
  it('geeft na exporteren, wissen en terugzetten dezelfde gegevens terug', async () => {
    const db = maak()
    await vul(db)
    const backup = leesBackup(JSON.stringify(await maakBackup(db, '2026-10-01T16:00:00.000Z')))
    await db.wisAlles()
    expect(await db.woordparen.count()).toBe(0)

    await zetBackupTerug(db, backup)
    expect(await db.bronnen.get('b1')).toMatchObject({ naam: 'Engels H3' })
    expect(await db.woordparen.get('w1')).toMatchObject({ woord: 'bridge', betekenis: 'brug' })
    expect(await db.pogingen.count()).toBe(1)
    expect(await db.leerlingen.get('l1')).toMatchObject({ bijnaam: 'Sam' })
    expect(await db.leesMeta('extraAntwoorden', {})).toEqual({ 'w1-en-nl': ['de brug'] })
  })

  it('neemt geen foto’s en geen datum van de laatste back-up mee', async () => {
    const db = maak()
    await vul(db)
    const backup = await maakBackup(db, 't')
    expect(backup.tabellen.bronpaginas[0]).not.toHaveProperty('foto')
    expect(backup.tabellen.meta).not.toContainEqual(expect.objectContaining({ sleutel: 'laatsteBackup' }))
  })

  it('weigert een bestand dat geen back-up is, of van een nieuwere versie', () => {
    expect(() => leesBackup('geen json')).toThrow(OngeldigeBackup)
    expect(() => leesBackup('{"app":"iets anders","tabellen":{}}')).toThrow(OngeldigeBackup)
    expect(() => leesBackup('{"app":"woordexpeditie","formaat":99,"tabellen":{}}')).toThrow(/nieuwere versie/)
  })
})

import { describe, expect, it } from 'vitest'
import { STANDAARD_INSTELLINGEN, stelSessieSamen, type BronInfo, type Leeritem, type Poging, type Tempo } from './index'

const item = (id: string, bronId = 'b1'): Leeritem => ({
  id,
  soort: 'woordpaar',
  bronId,
  woordpaarId: `wp-${id}`,
  bronversie: 1,
  oefenrichting: { van: 'en', naar: 'nl' },
  vraag: id,
  toegestaneAntwoorden: [id],
})

/** Eén vrij opgehaalde goede poging op de gegeven dag in oktober: aan de beurt vanaf de dag erna. */
const geoefend = (id: string, dag = 1): Poging => ({
  id: `p-${id}-${dag}`,
  sessieId: 's',
  leeritemId: id,
  bronversie: 1,
  antwoord: id,
  oordeel: 'goed',
  hulp: 'vrij opgehaald',
  antwoordZelfToegevoegd: false,
  tijdstip: new Date(Date.UTC(2026, 9, dag, 14)).toISOString(),
  regelversie: 1,
})

// Vast tempo, zodat de tests niet van metingen afhangen: 12 minuten = 36 herhalingen of 8 nieuwe.
const tempo: Tempo = { herhalingSec: 20, nieuwSec: 90 }
const bron = (extra: Partial<BronInfo> = {}): BronInfo => ({ bronId: 'b1', toetsdag: null, afgerond: false, ...extra })
const ids = (items: Leeritem[]) => items.map((i) => i.id)
const reeks = (n: number, voorvoegsel = 'n', bronId = 'b1') => Array.from({ length: n }, (_, i) => item(`${voorvoegsel}${i}`, bronId))
const samen = (items: Leeritem[], pogingen: Poging[], bronnen: BronInfo[], vandaag: string) =>
  stelSessieSamen(items, pogingen, bronnen, vandaag, STANDAARD_INSTELLINGEN, tempo)

describe('sessiesamenstelling binnen een tijdsbudget', () => {
  it('vult een lege dag met zoveel nieuwe leeritems als in 12 minuten passen', () => {
    const s = samen(reeks(20), [], [bron()], '2026-10-01')
    expect(s.herhalingen).toEqual([])
    expect(s.nieuw).toHaveLength(8)
    expect(s).toMatchObject({ minuten: 12, langer: false })
  })

  it('zet herhalingen voor, de langst wachtende eerst, en vult de rest met nieuwe', () => {
    const herhaal = reeks(3, 'h')
    const pogingen = herhaal.map((it, i) => geoefend(it.id, 3 - i)) // h2 het langst geleden
    const s = samen([...herhaal, ...reeks(20)], pogingen, [bron()], '2026-10-10')
    expect(ids(s.herhalingen)).toEqual(['h2', 'h1', 'h0'])
    expect(s.nieuw).toHaveLength(7) // 720 s - 3 × 20 s = 660 s, dus 7 × 90 s
  })

  it('geeft toetsstof voorrang bij herhalingen', () => {
    const extra = { ...item('extra'), toetsstof: false }
    const toets = { ...item('toets'), toetsstof: true }
    const pogingen = [geoefend('extra', 1), geoefend('toets', 3)] // extra wacht langer
    expect(ids(samen([extra, toets], pogingen, [bron()], '2026-10-10').herhalingen)).toEqual(['toets', 'extra'])
  })

  it('neemt niet meer herhalingen dan in het budget passen; de rest blijft aan de beurt', () => {
    const herhaal = reeks(50, 'h')
    const s = samen(herhaal, herhaal.map((it) => geoefend(it.id)), [bron()], '2026-10-10')
    expect(s.herhalingen).toHaveLength(36)
    expect(s.nieuw).toEqual([])
  })

  it('houdt ook een eerder ingestelde langere duur binnen 15 minuten', () => {
    const s = stelSessieSamen(reeks(40), [], [bron()], '2026-10-01', { ...STANDAARD_INSTELLINGEN, sessieMinuten: 20 }, tempo)
    expect(s.nieuw).toHaveLength(10)
  })

  it('neemt geen leeritems op die nog niet aan de beurt zijn', () => {
    const s = samen([item('h')], [geoefend('h')], [bron()], '2026-10-01')
    expect(s.herhalingen).toEqual([])
    expect(s.nieuw).toEqual([])
  })

  it('plant niets in van een afgeronde bron', () => {
    const s = samen([item('h'), item('n')], [geoefend('h')], [bron({ afgerond: true })], '2026-10-05')
    expect(s.herhalingen).toEqual([])
    expect(s.nieuw).toEqual([])
  })

  it('neemt hetzelfde woord uit twee bronnen maar één keer op', () => {
    const a = { ...item('a', 'b1'), vraag: 'colour', toegestaneAntwoorden: ['kleur'] }
    const b = { ...item('b', 'b2'), vraag: 'Colour', toegestaneAntwoorden: ['kleur'] }
    const s = samen([a, b], [], [bron(), { bronId: 'b2', toetsdag: null, afgerond: false }], '2026-10-01')
    expect(ids(s.nieuw)).toEqual(['a'])
  })

  it('houdt beide richtingen van hetzelfde woord als aparte leeritems', () => {
    const heen = { ...item('heen'), vraag: 'colour', toegestaneAntwoorden: ['kleur'] }
    const terug = { ...item('terug'), vraag: 'kleur', toegestaneAntwoorden: ['colour'], oefenrichting: { van: 'nl' as const, naar: 'en' as const } }
    expect(ids(samen([heen, terug], [], [bron()], '2026-10-01').nieuw)).toEqual(['heen', 'terug'])
  })
})

describe('planning voor een toets', () => {
  it('verdeelt de nieuwe leeritems over de dagen tot 3 dagen vóór de toets, en laat de sessie zo nodig uitlopen', () => {
    // 40 leeritems, toets over 7 dagen: 4 dagen om alles te leren, dus 10 per dag (15 minuten).
    const s = samen(reeks(40), [], [bron({ toetsdag: '2026-10-08' })], '2026-10-01')
    expect(s.nieuw).toHaveLength(10)
    expect(s).toMatchObject({ minuten: 15, langer: true, tekort: false })
  })

  it('duurt nooit langer dan 15 minuten; wat niet past schuift door en de app meldt een tekort', () => {
    // 52 leeritems over 4 dagen zou 13 per dag vragen (20 minuten); er passen er 10.
    const s = samen(reeks(52), [], [bron({ toetsdag: '2026-10-08' })], '2026-10-01')
    expect(s.nieuw).toHaveLength(10)
    expect(s).toMatchObject({ minuten: 15, tekort: true })
    expect(samen(reeks(50), [], [bron({ toetsdag: '2026-10-03' })], '2026-10-01').nieuw).toHaveLength(10)
  })

  it('gebruikt gewoon het budget als de toets ver weg is of voorbij', () => {
    expect(samen(reeks(20), [], [bron({ toetsdag: '2026-11-30' })], '2026-10-01').nieuw).toHaveLength(8)
    expect(samen(reeks(20), [], [bron({ toetsdag: '2026-09-20' })], '2026-10-01').nieuw).toHaveLength(8)
  })

  it('laat in de laatste 2 dagen alle geleerde leeritems één keer langskomen, verdeeld over die dagen', () => {
    // Toets op 10 oktober. Tien woorden op 3 oktober geleerd en op 5 oktober herhaald (volgende keer 8 oktober).
    const woorden = reeks(10, 'w')
    const pogingen = woorden.flatMap((w) => [geoefend(w.id, 3), geoefend(w.id, 5)])
    const toets = [bron({ toetsdag: '2026-10-10' })]

    const dag8 = samen(woorden, pogingen, toets, '2026-10-08')
    expect(dag8.repetitie).toHaveLength(5) // helft van de 10
    // Ze waren op 8 oktober ook aan de beurt, maar komen niet dubbel.
    expect(new Set([...ids(dag8.repetitie), ...ids(dag8.herhalingen)]).size).toBe(10)

    // Op 9 oktober komt de rest, ook als die nog niet aan de beurt is.
    const na8 = [...pogingen, ...dag8.repetitie.map((w) => geoefend(w.id, 8))]
    const dag9 = samen(woorden, na8, toets, '2026-10-09')
    expect(ids(dag9.repetitie).sort()).toEqual(woorden.map((w) => w.id).filter((id) => !ids(dag8.repetitie).includes(id)).sort())
  })

  it('doet geen generale repetitie op de toetsdag zelf of eerder dan 2 dagen van tevoren', () => {
    const woorden = reeks(4, 'w')
    const pogingen = woorden.map((w) => geoefend(w.id, 3))
    const toets = [bron({ toetsdag: '2026-10-10' })]
    expect(samen(woorden, pogingen, toets, '2026-10-10').repetitie).toEqual([])
    expect(samen(woorden, pogingen, toets, '2026-10-07').repetitie).toEqual([])
  })
})

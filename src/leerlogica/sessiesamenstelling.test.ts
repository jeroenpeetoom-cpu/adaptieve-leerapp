import { describe, expect, it } from 'vitest'
import { haalbaarheid, repetitieVenster, STANDAARD_INSTELLINGEN, stelExtraSamen, stelSessieSamen, type BronInfo, type Leeritem, type Poging, type Tempo } from './index'

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
  it('verdeelt de nieuwe leeritems over de dagen tot 4 dagen vóór de toets, en laat de sessie zo nodig uitlopen', () => {
    // 40 leeritems, toets over 8 dagen: 4 dagen om alles te leren (daarna de laatste ronde), dus 10 per dag (15 minuten).
    const s = samen(reeks(40), [], [bron({ toetsdag: '2026-10-09' })], '2026-10-01')
    expect(s.nieuw).toHaveLength(10)
    expect(s).toMatchObject({ minuten: 15, langer: true, tekort: false })
  })

  it('duurt nooit langer dan 15 minuten; wat niet past schuift door en de app meldt een tekort', () => {
    // 52 leeritems over 4 dagen zou 13 per dag vragen (20 minuten); er passen er 10.
    const s = samen(reeks(52), [], [bron({ toetsdag: '2026-10-08' })], '2026-10-01')
    expect(s.nieuw).toHaveLength(10)
    expect(s).toMatchObject({ minuten: 15, tekort: true, tekortReden: 'tijd' })
    expect(samen(reeks(50), [], [bron({ toetsdag: '2026-10-03' })], '2026-10-01').nieuw).toHaveLength(10)
  })

  it('gebruikt gewoon het budget als de toets ver weg is of voorbij', () => {
    expect(samen(reeks(20), [], [bron({ toetsdag: '2026-11-30' })], '2026-10-01').nieuw).toHaveLength(8)
    expect(samen(reeks(20), [], [bron({ toetsdag: '2026-09-20' })], '2026-10-01').nieuw).toHaveLength(8)
  })

  it('laat in de laatste 3 dagen alle geleerde leeritems één keer langskomen; de laatste dag is buffer', () => {
    // Toets op 10 oktober. Tien woorden op 3 oktober geleerd en op 5 oktober herhaald (volgende keer 8 oktober).
    const woorden = reeks(10, 'w')
    const pogingen = woorden.flatMap((w) => [geoefend(w.id, 3), geoefend(w.id, 5)])
    const toets = [bron({ toetsdag: '2026-10-10' })]

    // 7 oktober: de helft, verdeeld over de dagen vóór de laatste.
    const dag7 = samen(woorden, pogingen, toets, '2026-10-07')
    expect(dag7.repetitie).toHaveLength(5)

    // 8 oktober: de rest, ook als die nog niet aan de beurt is, en niets dubbel.
    const na7 = [...pogingen, ...dag7.repetitie.map((w) => geoefend(w.id, 7))]
    const dag8 = samen(woorden, na7, toets, '2026-10-08')
    expect(ids(dag8.repetitie).sort()).toEqual(woorden.map((w) => w.id).filter((id) => !ids(dag7.repetitie).includes(id)).sort())

    // 9 oktober: buffer; alles is al geweest.
    const na8 = [...na7, ...dag8.repetitie.map((w) => geoefend(w.id, 8))]
    expect(samen(woorden, na8, toets, '2026-10-09').repetitie).toEqual([])
  })

  it('doet geen generale repetitie op de toetsdag zelf of eerder dan 3 dagen van tevoren', () => {
    const woorden = reeks(4, 'w')
    const pogingen = woorden.map((w) => geoefend(w.id, 3))
    const toets = [bron({ toetsdag: '2026-10-10' })]
    expect(samen(woorden, pogingen, toets, '2026-10-10').repetitie).toEqual([])
    expect(samen(woorden, pogingen, toets, '2026-10-06').repetitie).toEqual([])
  })

  it('maakt de laatste ronde langer bij een grote lijst, en schat haalbaarheid', () => {
    const groot = reeks(160)
    expect(repetitieVenster(groot, STANDAARD_INSTELLINGEN)).toBeGreaterThan(3)
    expect(repetitieVenster(reeks(30), STANDAARD_INSTELLINGEN)).toBe(3)
    const h = haalbaarheid(groot, [], '2026-10-15', '2026-10-01', STANDAARD_INSTELLINGEN)
    expect(h.past).toBe(false)
    expect(h.beginUiterlijk < '2026-10-01').toBe(true)
    expect(haalbaarheid(reeks(20), [], '2026-10-15', '2026-10-01', STANDAARD_INSTELLINGEN).past).toBe(true)
  })
})

describe('extra oefenen', () => {
  it('neemt eerst wat nog niet goed zit, dan wat het langst geleden is, en nooit iets ongeoefends', () => {
    const fout = (id: string, dag: number): Poging => ({ ...geoefend(id, dag), id: `f-${id}`, oordeel: 'fout' })
    const pogingen = [geoefend('goed-oud', 1), geoefend('goed-recent', 5), fout('lastig', 4)]
    const items = [item('goed-oud'), item('goed-recent'), item('lastig'), item('nieuw')]
    expect(ids(stelExtraSamen(items, pogingen, [bron()], STANDAARD_INSTELLINGEN, tempo))).toEqual(['lastig', 'goed-oud', 'goed-recent'])
  })

  it('blijft binnen de tijd en slaat afgeronde bronnen over', () => {
    const veel = reeks(60, 'h')
    const pogingen = veel.map((i) => geoefend(i.id))
    expect(stelExtraSamen(veel, pogingen, [bron()], STANDAARD_INSTELLINGEN, tempo)).toHaveLength(36)
    expect(stelExtraSamen(veel, pogingen, [bron({ afgerond: true })], STANDAARD_INSTELLINGEN, tempo)).toEqual([])
  })
})

describe('eerst de makkelijke richting, dan de moeilijke', () => {
  const heen = (id: string): Leeritem => ({ ...item(`${id}-en`), woordpaarId: `wp-${id}` })
  const terug = (id: string): Leeritem => ({ ...item(`${id}-nl`), woordpaarId: `wp-${id}`, oefenrichting: { van: 'nl', naar: 'en' } })
  const plek = (id: string, richting: 'aanwijzen' | 'benoemen'): Leeritem => ({
    ...item(`${id}-${richting}`),
    soort: 'plek',
    woordpaarId: `pl-${id}`,
    plek: { kaartId: 'k', x: 0.5, y: 0.5, soort: 'stad', richting },
  })

  it('laat de moeilijke richting wachten tot de makkelijke zelf is teruggehaald', () => {
    const s = samen([heen('a'), terug('a')], [], [bron()], '2026-10-01')
    expect(ids(s.nieuw)).toEqual(['a-en'])
  })

  it('neemt de moeilijke richting op zodra de makkelijke goed en zonder hulp is opgehaald', () => {
    const s = samen([heen('a'), terug('a')], [geoefend('a-en', 1)], [bron()], '2026-10-01')
    expect(ids(s.nieuw)).toEqual(['a-nl'])
  })

  it('telt een goede poging met hulp nog niet', () => {
    const metHulp: Poging = { ...geoefend('a-en', 1), hulp: 'herkend' }
    expect(ids(samen([heen('a'), terug('a')], [metHulp], [bron()], '2026-10-01').nieuw)).toEqual([])
  })

  it('doet hetzelfde bij plekken: eerst aanwijzen, dan benoemen', () => {
    const s = samen([plek('x', 'aanwijzen'), plek('x', 'benoemen')], [], [bron()], '2026-10-01')
    expect(ids(s.nieuw)).toEqual(['x-aanwijzen'])
  })

  it('laat een moeilijke richting zonder makkelijke tegenhanger gewoon toe', () => {
    expect(ids(samen([terug('a')], [], [bron()], '2026-10-01').nieuw)).toEqual(['a-nl'])
  })

  it('laat beide richtingen tegelijk toe als de toets te dichtbij is', () => {
    const s = samen([heen('a'), terug('a')], [], [bron({ toetsdag: '2026-10-04' })], '2026-10-01')
    expect(ids(s.nieuw).sort()).toEqual(['a-en', 'a-nl'])
  })

  it('wacht wel bij een toets die nog ver weg is', () => {
    const s = samen([heen('a'), terug('a')], [], [bron({ toetsdag: '2026-10-20' })], '2026-10-01')
    expect(ids(s.nieuw)).toEqual(['a-en'])
  })
})

describe('toetsvorm in de samenstelling', () => {
  it('zet de hele generale repetitie in toetsvorm', () => {
    const s = samen([item('a')], [geoefend('a', 1)], [bron({ toetsdag: '2026-10-11' })], '2026-10-10')
    expect(s.repetitie.map((i) => i.id)).toEqual(['a'])
    expect(s.toetsvorm).toEqual(['a'])
  })

  it('wisselt af bij herhalingen die al later nog geweten zijn', () => {
    // Drie keer vrij goed op verschillende dagen: later nog geweten.
    const pogingen = [geoefend('a', 1), geoefend('a', 4), geoefend('a', 12)]
    expect(samen([item('a')], pogingen, [bron()], '2027-06-01').toetsvorm).toEqual(['a'])
    const metToets = [...pogingen, { ...geoefend('a', 25), toetsvorm: true }]
    expect(samen([item('a')], metToets, [bron()], '2027-06-01').toetsvorm).toEqual([])
  })

  it('stelt een herhaling die nog geleerd wordt niet in toetsvorm', () => {
    expect(samen([item('a')], [geoefend('a', 1)], [bron()], '2026-10-10').toetsvorm).toEqual([])
  })
})

describe('na de toets', () => {
  it('laat een bron die op de reflectie wacht niet meedoen', () => {
    const s = samen([item('a'), item('n')], [geoefend('a', 1)], [bron({ wachtOpReflectie: true })], '2026-10-10')
    expect(s.herhalingen).toEqual([])
    expect(s.nieuw).toEqual([])
  })

  it('neemt uit een bron in onderhoud alleen een paar herhalingen, na de rest, en niets nieuws', () => {
    const onderhoud = reeks(6, 'o', 'b2')
    const gewoon = reeks(2, 'g')
    const pogingen = [...onderhoud, ...gewoon].map((i) => geoefend(i.id, 1))
    const s = samen(
      [...onderhoud, ...gewoon, item('nieuw-o', 'b2')],
      pogingen,
      [bron(), { bronId: 'b2', toetsdag: '2026-10-05', afgerond: false, onderhoud: true }],
      '2026-10-10',
    )
    expect(ids(s.herhalingen).slice(0, 2).sort()).toEqual(['g0', 'g1'])
    expect(s.herhalingen.filter((i) => i.bronId === 'b2')).toHaveLength(3)
    expect(ids(s.nieuw)).not.toContain('nieuw-o')
  })
})

describe('vangnet vóór de toets', () => {
  it('neemt vlak voor de toets een woord dat nog nooit geoefend is mee als nieuw, met voorrang', () => {
    const s = samen([item('a'), item('nooit')], [geoefend('a', 1)], [bron({ toetsdag: '2026-10-11' })], '2026-10-10')
    expect(ids(s.repetitie)).toEqual(['a'])
    expect(ids(s.nieuw)).toEqual(['nooit'])
    expect(s.voorrang).toEqual(['nooit'])
  })

  it('geeft nieuwe woorden voor een toets voorrang op gewone herhalingen', () => {
    // Veel herhalingen die het hele budget zouden vullen, plus nieuwe woorden voor een toets.
    const oud = reeks(60, 'h')
    const pogingen = oud.map((i) => geoefend(i.id, 1))
    const s = samen([...oud, ...reeks(10, 'n')], pogingen, [bron({ toetsdag: '2026-10-20' })], '2026-10-10')
    expect(s.nieuw.length).toBeGreaterThan(0)
    expect(s.voorrang.length).toBe(s.nieuw.length)
  })
})

describe('melding bij een tekort', () => {
  it('zegt dat het maximum aantal nieuwe is bereikt, niet dat de tijd op is', () => {
    const snel: Tempo = { herhalingSec: 5, nieuwSec: 5 }
    const s = stelSessieSamen(reeks(80), [], [bron({ toetsdag: '2026-10-03' })], '2026-10-01', STANDAARD_INSTELLINGEN, snel)
    expect(s.nieuw).toHaveLength(STANDAARD_INSTELLINGEN.maxNieuwPerSessie)
    expect(s).toMatchObject({ tekort: true, tekortReden: 'aantal' })
  })
})

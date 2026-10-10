import { describe, expect, it } from 'vitest'
import { berekenTempo, duurHerhaling, duurNieuw, STANDAARD_INSTELLINGEN, type Poging } from './index'

let n = 0
/** Een poging op een tijdstip in seconden na het begin, op een leeritem. */
const poging = (sec: number, leeritemId: string, sessieId = 's1'): Poging => ({
  id: `p${++n}`,
  sessieId,
  leeritemId,
  bronversie: 1,
  antwoord: 'x',
  oordeel: 'goed',
  hulp: 'vrij opgehaald',
  antwoordZelfToegevoegd: false,
  tijdstip: new Date(Date.UTC(2026, 9, 1, 14) + sec * 1000).toISOString(),
  regelversie: 1,
})
const tempo = (pogingen: Poging[]) => berekenTempo(pogingen, STANDAARD_INSTELLINGEN)

describe('tempo', () => {
  it('gebruikt de schatting zolang er te weinig metingen zijn', () => {
    expect(tempo([])).toEqual({ herhalingSec: 20, nieuwSec: 90, terugkans: 0.7 })
    expect(tempo([poging(0, 'a'), poging(10, 'b')])).toEqual({ herhalingSec: 20, nieuwSec: 90, terugkans: 0.7 })
  })

  it('meet de tijd tussen pogingen: herhalingen apart van nieuwe leeritems', () => {
    // Eerst 6 nieuwe leeritems met 60 s ertussen, daarna 6 herhalingen van dezelfde met 12 s ertussen.
    const nieuw = Array.from({ length: 6 }, (_, i) => poging(i * 60, `i${i}`))
    const herhaal = Array.from({ length: 7 }, (_, i) => poging(360 + i * 12, `i${i % 6}`))
    expect(tempo([...nieuw, ...herhaal])).toEqual({ herhalingSec: 12, nieuwSec: 60, terugkans: 0 })
  })

  it('rekent met het gemiddelde, zodat lange leermomenten meetellen', () => {
    // Vijf snelle nieuwe leeritems van 20 s en één van 170 s (met leermoment): gemiddeld 45 s.
    const tijden = [0, 20, 40, 60, 80, 100, 270]
    const pogingen = tijden.map((t, i) => poging(t, `n${i}`))
    expect(tempo(pogingen).nieuwSec).toBe(45)
  })

  it('meet hoe vaak een nieuw leeritem niet goed ging', () => {
    const pogingen = Array.from({ length: 10 }, (_, i) => ({ ...poging(i * 30, `m${i}`), oordeel: i < 6 ? ('niet geweten' as const) : ('goed' as const) }))
    expect(tempo(pogingen).terugkans).toBe(0.6)
  })

  it('telt pauzes en de tijd tussen twee sessies niet mee', () => {
    const pogingen = [
      ...Array.from({ length: 6 }, (_, i) => poging(i * 15, `a${i}`)), // 5 metingen van 15 s (nieuw)
      poging(10_000, 'x'), // lange pauze
      poging(20_000, 'y', 's2'), // andere sessie
    ]
    expect(tempo(pogingen).nieuwSec).toBe(15)
  })
})

describe('duur per leeritem', () => {
  const tempo = { herhalingSec: 20, nieuwSec: 60, terugkans: 0.5 }

  it('rekent bij een nieuw leeritem het terugkomen in de sessie mee', () => {
    expect(duurNieuw(tempo, 'brug')).toBe(70)
  })

  it('geeft lange antwoorden naar verhouding meer tijd, tot een grens', () => {
    expect(duurHerhaling(tempo, 'brug')).toBe(20)
    expect(duurHerhaling(tempo, 'Het is leuk om jong te zijn')).toBeCloseTo(20 * (27 / 12))
    expect(duurHerhaling(tempo, 'x'.repeat(200))).toBe(80)
  })
})

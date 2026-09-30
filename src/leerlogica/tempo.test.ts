import { describe, expect, it } from 'vitest'
import { berekenTempo, STANDAARD_INSTELLINGEN, type Poging } from './index'

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
    expect(tempo([])).toEqual({ herhalingSec: 20, nieuwSec: 90 })
    expect(tempo([poging(0, 'a'), poging(10, 'b')])).toEqual({ herhalingSec: 20, nieuwSec: 90 })
  })

  it('meet de tijd tussen pogingen: herhalingen apart van nieuwe leeritems', () => {
    // Eerst 6 nieuwe leeritems met 60 s ertussen, daarna 6 herhalingen van dezelfde met 12 s ertussen.
    const nieuw = Array.from({ length: 6 }, (_, i) => poging(i * 60, `i${i}`))
    const herhaal = Array.from({ length: 7 }, (_, i) => poging(360 + i * 12, `i${i % 6}`))
    expect(tempo([...nieuw, ...herhaal])).toEqual({ herhalingSec: 12, nieuwSec: 60 })
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

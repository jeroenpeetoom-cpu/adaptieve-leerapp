import { describe, expect, it } from 'vitest'
import {
  berekenPlanning,
  isAanDeBeurt,
  STANDAARD_INSTELLINGEN,
  type Hulp,
  type Oordeel,
  type Poging,
} from './index'

// Instelbare klok: elke poging krijgt een dagnummer vanaf 1 oktober 2026, 16:00 in Nederland.
let teller = 0
function poging(dag: number, oordeel: Oordeel, hulp: Hulp = 'vrij opgehaald', extra: Partial<Poging> = {}): Poging {
  const tijdstip = new Date(Date.UTC(2026, 9, dag, 14, 0) + teller++ * 60_000).toISOString()
  return {
    id: `p${teller}`,
    sessieId: 's',
    leeritemId: 'i',
    bronversie: 1,
    antwoord: 'x',
    oordeel,
    hulp,
    antwoordZelfToegevoegd: false,
    tijdstip,
    regelversie: 1,
    ...extra,
  }
}
const plan = (pogingen: Poging[]) => berekenPlanning('i', pogingen, STANDAARD_INSTELLINGEN)
const dag = (d: number) => `2026-10-${String(d).padStart(2, '0')}`

describe('herhaalplanning', () => {
  it('is nog niet ingepland zonder pogingen', () => {
    expect(plan([])).toMatchObject({ fase: 0, volgendeDag: null })
  })

  it('groeit met 1, 3, 7 en 14 dagen bij vrij opgehaalde goede antwoorden', () => {
    const pogingen = [poging(1, 'goed')]
    expect(plan(pogingen).volgendeDag).toBe(dag(2))
    pogingen.push(poging(2, 'goed'))
    expect(plan(pogingen).volgendeDag).toBe(dag(5))
    pogingen.push(poging(5, 'goed'))
    expect(plan(pogingen).volgendeDag).toBe(dag(12))
    pogingen.push(poging(12, 'goed'))
    expect(plan(pogingen).volgendeDag).toBe(dag(26))
    pogingen.push(poging(26, 'goed'))
    expect(plan(pogingen)).toMatchObject({ fase: 5, volgendeDag: '2026-11-25' }) // 30 dagen
  })

  it('verdubbelt na de laatste vaste stap, zonder maximum', () => {
    const pogingen = Array.from({ length: 9 }, (_, i) => poging(1 + i * 200, 'goed'))
    const planning = plan(pogingen)
    expect(planning.fase).toBe(9)
    // fase 8 = 240 dagen, fase 9 = 480 dagen
    expect(planning.volgendeDag).toBe(new Date(Date.UTC(2026, 9, 1 + 8 * 200 + 480)).toISOString().slice(0, 10))
  })

  it('gaat na een fout of niet geweten terug naar 1 dag', () => {
    const pogingen = [poging(1, 'goed'), poging(2, 'goed'), poging(5, 'fout')]
    expect(plan(pogingen)).toMatchObject({ fase: 1, volgendeDag: dag(6) })
    expect(plan([poging(1, 'goed'), poging(2, 'niet geweten')])).toMatchObject({ fase: 1, volgendeDag: dag(3) })
  })

  it('schuift een goed antwoord met hulp niet door naar een langer interval', () => {
    const basis = [poging(1, 'goed'), poging(2, 'goed')] // fase 2, volgende op dag 5
    for (const hulp of ['met hint', 'herkend', 'na voorbeeld'] as const) {
      expect(plan([...basis, poging(5, 'goed', hulp)])).toMatchObject({ fase: 2, volgendeDag: dag(6) })
    }
    expect(plan([...basis, poging(5, 'bijna')])).toMatchObject({ fase: 2, volgendeDag: dag(6) })
    expect(plan([...basis, poging(5, 'goed', 'vrij opgehaald', { antwoordZelfToegevoegd: true })])).toMatchObject({
      fase: 2,
      volgendeDag: dag(6),
    })
  })

  it('telt alleen de eerste poging per dag', () => {
    const planning = plan([poging(1, 'fout'), poging(1, 'goed'), poging(1, 'goed')])
    expect(planning).toMatchObject({ fase: 1, volgendeDag: dag(2), laatstVrijOpgehaald: null })
  })

  it('rekent vanaf de meest recente vrij opgehaalde goede poging', () => {
    const pogingen = [poging(1, 'goed'), poging(2, 'goed')]
    expect(plan(pogingen).laatstVrijOpgehaald).toBe(pogingen[1].tijdstip)
  })

  it('laat een gemiste herhaling aan de beurt staan zonder straf', () => {
    const planning = plan([poging(1, 'goed'), poging(2, 'goed')]) // aan de beurt op dag 5
    expect(isAanDeBeurt(planning, dag(4))).toBe(false)
    expect(isAanDeBeurt(planning, dag(5))).toBe(true)
    expect(isAanDeBeurt(planning, dag(20))).toBe(true)
    expect(planning.fase).toBe(2)
  })

  it('gebruikt Nederlandse kalenderdagen, ook rond middernacht', () => {
    // 23:30 Nederlandse tijd op 1 oktober en 00:30 op 2 oktober zijn verschillende dagen.
    const laat = { ...poging(1, 'goed'), tijdstip: '2026-10-01T21:30:00.000Z' }
    const vroeg = { ...poging(1, 'goed'), tijdstip: '2026-10-01T22:30:00.000Z' }
    expect(plan([laat, vroeg]).fase).toBe(2)
  })

  it('legt de regelversie vast', () => {
    expect(plan([poging(1, 'goed')]).regelversie).toBe(1)
  })
})

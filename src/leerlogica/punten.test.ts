import { describe, expect, it } from 'vitest'
import { rangVan, STANDAARD_INSTELLINGEN, telPunten, type Hulp, type Oordeel, type Poging } from './index'

let n = 0
const poging = (item: string, dag: number, oordeel: Oordeel = 'goed', hulp: Hulp = 'vrij opgehaald'): Poging => ({
  id: `p${++n}`,
  sessieId: 's',
  leeritemId: item,
  bronversie: 1,
  antwoord: 'x',
  oordeel,
  hulp,
  antwoordZelfToegevoegd: false,
  tijdstip: new Date(Date.UTC(2026, 9, dag, 14)).toISOString(),
  regelversie: 1,
})
const tel = (pogingen: Poging[], missies = 0, stappen = 0) => telPunten(pogingen, missies, stappen, STANDAARD_INSTELLINGEN)

describe('punten', () => {
  it('geeft punten voor volhouden, codewoorden en strategiestappen', () => {
    const t = tel([], 3, 2)
    expect(t).toMatchObject({ missies: 30, strategie: 40, totaal: 70 })
  })

  it('geeft 1 punt per codewoord en 5 punten als een leeritem voor het eerst zelf teruggehaald is', () => {
    const t = tel([poging('a', 1), poging('a', 2), poging('b', 1, 'goed', 'met hint')])
    expect(t).toMatchObject({ codewoorden: 2, zelfTeruggehaald: 5, laterNogGeweten: 0 })
  })

  it('geeft 10 punten als een leeritem later nog geweten is, en neemt die niet terug na een fout', () => {
    const later = [poging('a', 1), poging('a', 8)]
    expect(tel(later).laterNogGeweten).toBe(10)
    expect(tel([...later, poging('a', 22, 'fout')])).toMatchObject({ zelfTeruggehaald: 5, laterNogGeweten: 10 })
  })

  it('geeft een rang met de voortgang naar de volgende', () => {
    expect(rangVan(0)).toMatchObject({ naam: 'Verkenner', volgende: { naam: 'Piloot', vanaf: 250 }, voortgang: 0 })
    expect(rangVan(500)).toMatchObject({ naam: 'Piloot', voortgang: 0.5 })
    expect(rangVan(5000)).toMatchObject({ naam: 'Admiraal', volgende: null, voortgang: 1 })
  })
})

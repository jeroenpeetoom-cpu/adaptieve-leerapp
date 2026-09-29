import { describe, expect, it } from 'vitest'
import { berekenVoortgang, STANDAARD_INSTELLINGEN, type Hulp, type Leeritem, type Oordeel, type Poging } from './index'

const item: Leeritem = {
  id: 'i',
  soort: 'woordpaar',
  bronId: 'b',
  woordpaarId: 'wp',
  bronversie: 1,
  oefenrichting: { van: 'en', naar: 'nl' },
  vraag: 'river',
  toegestaneAntwoorden: ['rivier'],
}

let teller = 0
function poging(dag: number, oordeel: Oordeel, hulp: Hulp = 'vrij opgehaald', extra: Partial<Poging> = {}): Poging {
  return {
    id: `p${++teller}`,
    sessieId: 's',
    leeritemId: 'i',
    bronversie: 1,
    antwoord: 'x',
    oordeel,
    hulp,
    antwoordZelfToegevoegd: false,
    tijdstip: new Date(Date.UTC(2026, 9, dag, 14, 0) + teller * 60_000).toISOString(),
    regelversie: 1,
    ...extra,
  }
}
const voortgang = (pogingen: Poging[], leeritem = item) => berekenVoortgang(leeritem, pogingen, STANDAARD_INSTELLINGEN)

describe('voortgangsstatus', () => {
  it('begint bij nog aan het leren', () => {
    expect(voortgang([])).toEqual({ status: 'nog aan het leren', hoogsteOoit: 'nog aan het leren' })
  })

  it('is zelf teruggehaald na één vrij opgehaald goed antwoord', () => {
    expect(voortgang([poging(1, 'goed')]).status).toBe('zelf teruggehaald')
  })

  it('telt goede antwoorden met hulp of een zelf toegevoegd antwoord niet als bewijs', () => {
    expect(voortgang([poging(1, 'goed', 'met hint')]).status).toBe('nog aan het leren')
    expect(voortgang([poging(1, 'goed', 'herkend')]).status).toBe('nog aan het leren')
    expect(voortgang([poging(1, 'goed', 'vrij opgehaald', { antwoordZelfToegevoegd: true })]).status).toBe(
      'nog aan het leren',
    )
  })

  it('is later nog geweten na twee dagen zelfstandig goed, de laatste minstens 7 dagen na de eerste poging', () => {
    expect(voortgang([poging(1, 'goed'), poging(2, 'goed')]).status).toBe('zelf teruggehaald')
    expect(voortgang([poging(1, 'goed'), poging(8, 'goed')]).status).toBe('later nog geweten')
  })

  it('telt de allereerste poging mee, ook als die fout was', () => {
    // Eerste poging op dag 1 (fout), daarna goed op dag 3 en dag 8: 7 dagen na de eerste poging.
    expect(voortgang([poging(1, 'fout'), poging(3, 'goed'), poging(8, 'goed')]).status).toBe('later nog geweten')
  })

  it('vraagt twee verschillende dagen', () => {
    expect(voortgang([poging(8, 'goed'), poging(8, 'goed')], item).status).toBe('zelf teruggehaald')
  })

  it('gaat na een fout terug naar nog aan het leren, met de geschiedenis erbij', () => {
    const v = voortgang([poging(1, 'goed'), poging(8, 'goed'), poging(22, 'fout')])
    expect(v).toEqual({ status: 'nog aan het leren', hoogsteOoit: 'later nog geweten' })
  })

  it('laat bijna en hulp de status niet terugzetten', () => {
    expect(voortgang([poging(1, 'goed'), poging(2, 'bijna')]).status).toBe('zelf teruggehaald')
    expect(voortgang([poging(1, 'goed'), poging(2, 'goed', 'met hint')]).status).toBe('zelf teruggehaald')
  })

  it('telt alleen pogingen op de huidige bronversie', () => {
    const oud = [poging(1, 'goed'), poging(8, 'goed')]
    expect(voortgang(oud, { ...item, bronversie: 2 })).toEqual({
      status: 'nog aan het leren',
      hoogsteOoit: 'nog aan het leren',
    })
  })
})

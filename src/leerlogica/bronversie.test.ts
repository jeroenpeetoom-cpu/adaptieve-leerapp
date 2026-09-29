import { describe, expect, it } from 'vitest'
import { berekenPlanning, isInhoudelijkeWijziging, STANDAARD_INSTELLINGEN, type Poging } from './index'

describe('bronversie', () => {
  const oud = { woord: 'Key', betekenis: 'sleutel' }

  it('maakt geen nieuwe versie bij alleen hoofdletters, spaties of leestekens', () => {
    expect(isInhoudelijkeWijziging(oud, { woord: 'key', betekenis: 'sleutel' })).toBe(false)
    expect(isInhoudelijkeWijziging(oud, { woord: ' key.', betekenis: 'Sleutel ' })).toBe(false)
  })

  it('maakt wel een nieuwe versie bij een ander woord of een andere betekenis', () => {
    expect(isInhoudelijkeWijziging(oud, { woord: 'key', betekenis: 'toets' })).toBe(true)
    expect(isInhoudelijkeWijziging(oud, { woord: 'keys', betekenis: 'sleutel' })).toBe(true)
  })

  it('laat de herhaalplanning opnieuw beginnen op een nieuwe bronversie', () => {
    const poging: Poging = {
      id: 'p1',
      sessieId: 's',
      leeritemId: 'i',
      bronversie: 1,
      antwoord: 'sleutel',
      oordeel: 'goed',
      hulp: 'vrij opgehaald',
      antwoordZelfToegevoegd: false,
      tijdstip: '2026-10-01T14:00:00.000Z',
      regelversie: 1,
    }
    expect(berekenPlanning('i', [poging], STANDAARD_INSTELLINGEN, 1).fase).toBe(1)
    expect(berekenPlanning('i', [poging], STANDAARD_INSTELLINGEN, 2)).toMatchObject({ fase: 0, volgendeDag: null })
  })
})

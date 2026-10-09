import { describe, expect, it } from 'vitest'
import { beschrijfReflectie, gebruikteAanpakken, kiesVarianten, REFLECTIEVRAGEN, reflectieNodig, type Leeritem, type Poging } from './index'

const bron = (toetsdag: string | null, extra = {}) => ({ toetsdag, afgerond: false, ...extra })

describe('wanneer de reflectie na de toets nodig is', () => {
  it('vanaf de dag na de toets, niet op de toetsdag zelf', () => {
    expect(reflectieNodig(bron('2026-10-08'), '2026-10-08')).toBe(false)
    expect(reflectieNodig(bron('2026-10-08'), '2026-10-09')).toBe(true)
  })

  it('niet zonder toets, na afronden, of als hij al gedaan is', () => {
    expect(reflectieNodig(bron(null), '2026-10-09')).toBe(false)
    expect(reflectieNodig(bron('2026-10-08', { afgerond: true }), '2026-10-09')).toBe(false)
    expect(reflectieNodig(bron('2026-10-08', { toetsGereflecteerd: '2026-10-08' }), '2026-10-09')).toBe(false)
  })

  it('opnieuw na een volgende toets voor dezelfde bron', () => {
    expect(reflectieNodig(bron('2026-11-02', { toetsGereflecteerd: '2026-10-08' }), '2026-11-03')).toBe(true)
  })
})

describe('variatie in de vragen', () => {
  it('kiest per onderdeel nooit dezelfde variant als de vorige keer', () => {
    let vorige = kiesVarianten(null, 'start')
    for (let i = 0; i < 20; i++) {
      const nieuw = kiesVarianten(vorige, `zaad-${i}`)
      expect(nieuw.kennis).not.toBe(vorige.kennis)
      expect(nieuw.strategie).not.toBe(vorige.strategie)
      expect(nieuw.vooruit).not.toBe(vorige.vooruit)
      vorige = nieuw
    }
  })

  it('gebruikt alle varianten', () => {
    const gezien = new Set(Array.from({ length: 40 }, (_, i) => kiesVarianten(null, `z${i}`).kennis))
    expect(gezien.size).toBe(REFLECTIEVRAGEN.kennis.length)
  })

  it('vraagt nooit naar een cijfer', () => {
    const teksten = Object.values(REFLECTIEVRAGEN).flat().map((v) => v.vraag.toLowerCase())
    expect(teksten.some((t) => t.includes('cijfer'))).toBe(false)
  })
})

describe('strategievraag', () => {
  const item: Leeritem = { id: 'a', soort: 'woordpaar', bronId: 'b', woordpaarId: 'w', bronversie: 1, oefenrichting: { van: 'en', naar: 'nl' }, vraag: 'a', toegestaneAntwoorden: ['a'] }
  const p = (dag: number, extra: Partial<Poging> = {}): Poging => ({ id: `p${dag}`, sessieId: 's', leeritemId: 'a', bronversie: 1, antwoord: 'a', oordeel: 'goed', hulp: 'vrij opgehaald', antwoordZelfToegevoegd: false, tijdstip: new Date(Date.UTC(2026, 9, dag, 14)).toISOString(), regelversie: 1, ...extra })

  it('biedt alleen aanpakken aan die echt gebruikt zijn', () => {
    const ids = gebruikteAanpakken([item], [p(1, { strategie: 'beelden koppelen' }), p(2, { toetsvorm: true }), p(3)], 'Europe/Amsterdam').map((k) => k.id)
    expect(ids).toEqual(['ophalen', 'beelden', 'toetsronde', 'elke-dag', 'anders'])
    expect(gebruikteAanpakken([item], [p(1)], 'Europe/Amsterdam').map((k) => k.id)).toEqual(['ophalen', 'anders'])
  })

  it('beschrijft een reflectie leesbaar, met de vervolgvraag', () => {
    const regels = beschrijfReflectie({
      bronId: 'b',
      toetsdag: '2026-10-08',
      tijdstip: '',
      varianten: { kennis: 'best', strategie: 'hielp', vooruit: 'anders' },
      antwoorden: { kennis: 'grotendeels', ruimte: 'eerder', strategie: 'beelden', vooruit: 'toetsronde' },
      keuze: 'onthouden',
    })
    expect(regels.map((r) => r.antwoord)).toEqual(['👍 Grotendeels', '⏰ Eerder beginnen met leren', '🖼️ Mijn eigen beelden', '📝 Ja: vaker een toetsronde'])
  })
})

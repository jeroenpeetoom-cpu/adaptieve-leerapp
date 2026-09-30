import { describe, expect, it } from 'vitest'
import { beoordeelTik, omschrijfLigging, windrichting } from './index'

const vk = 1 // vierkante kaart, om het rekenen eenvoudig te houden

describe('tik op de kaart', () => {
  it('is goed binnen een kleine cirkel rond een stad, en bijna of fout daarbuiten', () => {
    const antwerpen = { x: 0.45, y: 0.47 }
    expect(beoordeelTik({ x: 0.46, y: 0.47 }, antwerpen, 'stad', vk).oordeel).toBe('goed')
    expect(beoordeelTik({ x: 0.5, y: 0.47 }, antwerpen, 'stad', vk)).toEqual({ oordeel: 'bijna', richting: 'westen' })
    expect(beoordeelTik({ x: 0.6, y: 0.47 }, antwerpen, 'stad', vk).oordeel).toBe('fout')
  })

  it('is ruimer bij water, gebieden en landen', () => {
    const wallonie = { x: 0.6, y: 0.65 }
    expect(beoordeelTik({ x: 0.66, y: 0.7 }, wallonie, 'gebied', vk).oordeel).toBe('goed')
    expect(beoordeelTik({ x: 0.66, y: 0.7 }, wallonie, 'stad', vk).oordeel).not.toBe('goed')
  })

  it('rekent met de verhouding van de kaart: een lange kaart is in de hoogte groter', () => {
    // Op een kaart die twee keer zo hoog als breed is, is 0,02 omlaag eigenlijk 0,04 kaartbreedte.
    expect(beoordeelTik({ x: 0.5, y: 0.52 }, { x: 0.5, y: 0.5 }, 'stad', 1).oordeel).toBe('goed')
    expect(beoordeelTik({ x: 0.5, y: 0.52 }, { x: 0.5, y: 0.5 }, 'stad', 2).oordeel).toBe('bijna')
  })

  it('geeft de windrichting van de tik naar de plek, met het noorden boven', () => {
    const midden = { x: 0.5, y: 0.5 }
    expect(windrichting(midden, { x: 0.5, y: 0.2 }, vk)).toBe('noorden')
    expect(windrichting(midden, { x: 0.8, y: 0.8 }, vk)).toBe('zuidoosten')
    expect(windrichting(midden, { x: 0.2, y: 0.5 }, vk)).toBe('westen')
  })

  it('omschrijft de ligging op de kaart', () => {
    expect(omschrijfLigging({ x: 0.5, y: 0.5 })).toBe('in het midden van de kaart')
    expect(omschrijfLigging({ x: 0.8, y: 0.8 })).toBe('in het zuidoosten van de kaart')
    expect(omschrijfLigging({ x: 0.5, y: 0.1 })).toBe('in het noorden van de kaart')
    expect(omschrijfLigging({ x: 0.1, y: 0.5 })).toBe('in het westen van de kaart')
  })
})

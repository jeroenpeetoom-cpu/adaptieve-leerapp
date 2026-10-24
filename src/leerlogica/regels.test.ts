import { describe, expect, it } from 'vitest'
import { maakRegelvraag, regelfeedback, regelMetId, stelRegelsVoor, werkwoordenUitLijst } from './index'

const regel = regelMetId('can-have-to')!

// Woordparen zoals op het echte blad van de leerling.
const lijst = [
  { woord: 'stay up late', betekenis: 'laat opblijven' },
  { woord: 'drive a car', betekenis: 'autorijden' },
  { woord: 'live on my own', betekenis: 'Op mezelf wonen' },
  { woord: 'listen to your parents', betekenis: 'naar je ouders luisteren' },
  { woord: 'time to play', betekenis: 'tijd om te spelen' },
  { woord: 'fear', betekenis: 'angst' },
  { woord: 'fizzy drink', betekenis: 'frisdrank' },
  { woord: 'I have to do my homework', betekenis: 'Ik moet mijn huiswerk doen.' },
  { woord: "You can't eat what you like.", betekenis: 'Je mag niet eten wat je lekker vindt.' },
]

describe('regels', () => {
  it('stelt de regel voor als er minstens twee zinnen met can of have to zijn', () => {
    expect(stelRegelsVoor(lijst.map((p) => p.woord)).map((r) => r.id)).toEqual(['can-have-to'])
    expect(stelRegelsVoor(['stay up late', 'fear'])).toEqual([])
  })

  it('haalt alleen bruikbare werkwoordsgroepen uit de lijst', () => {
    expect(werkwoordenUitLijst(lijst).map((w) => w.en)).toEqual(['stay up late', 'drive a car', 'live on my own', 'listen to your parents'])
  })

  it('maakt bij toepassen een situatie en een zin met een gat, met alle vormen als opties', () => {
    const v = maakRegelvraag(regel, 'dont-have-to', 'toepassen', werkwoordenUitLijst(lijst), 'zaad-1')
    expect(v.zin).toContain('___')
    expect(v.situatie).toContain('Het hoeft niet')
    expect(v.opties.map((o) => o.tekst)).toEqual(['can', "can't", 'have to', "don't have to"])
    expect(v.goed).toBe('dont-have-to')
    expect(v.heleZin).toContain("don't have to")
  })

  it('kiest het onderwerp dat bij my of your past', () => {
    for (let i = 0; i < 40; i++) {
      const v = maakRegelvraag(regel, 'can', 'begrijpen', [{ en: 'live on my own', nl: 'op mezelf wonen' }], `z${i}`)
      if (v.zin.includes('my own')) expect(v.zin.startsWith('I ')).toBe(true)
    }
  })

  it('maakt elke keer een andere zin, maar dezelfde bij hetzelfde zaad', () => {
    const ww = werkwoordenUitLijst(lijst)
    const zinnen = new Set(Array.from({ length: 20 }, (_, i) => maakRegelvraag(regel, 'can', 'begrijpen', ww, `z${i}`).zin))
    expect(zinnen.size).toBeGreaterThan(3)
    expect(maakRegelvraag(regel, 'can', 'begrijpen', ww, 'x').zin).toBe(maakRegelvraag(regel, 'can', 'begrijpen', ww, 'x').zin)
  })

  it('legt bij een fout uit welke beslisvraag misging, met de valkuil bij hoeft niet', () => {
    expect(regelfeedback(regel, 'dont-have-to', 'cant')).toContain('mogen of om moeten')
    expect(regelfeedback(regel, 'dont-have-to', 'cant')).toContain('hoeft niet')
    expect(regelfeedback(regel, 'have-to', 'dont-have-to')).toContain('wel of niet')
  })
})

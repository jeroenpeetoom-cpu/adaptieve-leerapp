import { describe, expect, it } from 'vitest'
import {
  kiesRonde,
  ontleed,
  rondebewijs,
  som,
  sommenVanTafel,
  tafelstand,
  trucVoor,
  trucopties,
  lastigsteSom,
  uitkomstTafelvoornemen,
  tafelplanVraag,
  volgendeLimiet,
  type Tafelpoging,
  type Tafeluitkomst,
} from './tafels'

const TZ = 'Europe/Amsterdam'

function vast(start = 1): () => number {
  let s = start
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

let teller = 0
function poging(somId: string, uitkomst: Tafeluitkomst, tijdMs: number, dag = 1, extra: Partial<Tafelpoging> = {}): Tafelpoging {
  teller++
  const minuut = String(teller % 60).padStart(2, '0')
  const uur = String(8 + Math.floor(teller / 60) % 12).padStart(2, '0')
  return {
    id: `p${teller}`,
    som: somId,
    antwoord: '',
    uitkomst,
    tijdMs,
    limietSec: 10,
    tijdstip: `2026-11-${String(dag).padStart(2, '0')}T${uur}:${minuut}:00.000Z`,
    rondeId: `r${dag}`,
    ...extra,
  }
}

/** Een instapronde waarin de gegeven tafels vlot gaan en de rest langzaam. */
function instap(snel: number[]): Tafelpoging[] {
  return [1, 2, 5, 10, 3, 4, 9, 6, 7, 8].flatMap((b) =>
    [3, 7].map((a) => poging(`${a}x${b}`, 'goed', snel.includes(b) ? 2000 : 7000, 1, { instap: true, rondeId: 'instap' })),
  )
}

describe('de tijd per som', () => {
  it('volgt de echte snelheid: snel goed gaat meteen naar 3 seconden', () => {
    expect(volgendeLimiet(10, 'goed', 1800)).toBe(3)
  })
  it('wordt bij goed altijd minstens 1 seconde korter', () => {
    expect(volgendeLimiet(8, 'goed', 7500)).toBe(7)
  })
  it('wordt niet korter dan 3 seconden', () => {
    expect(volgendeLimiet(3, 'goed', 1000)).toBe(3)
  })
  it('krijgt 2 seconden extra na te laat of fout, tot 10', () => {
    expect(volgendeLimiet(4, 'te laat', 4000)).toBe(6)
    expect(volgendeLimiet(9, 'fout', 2000)).toBe(10)
  })
})

describe('de opbouw', () => {
  it('begint met de instapronde: van elke tafel 2 sommen', () => {
    const { sommen, instap: isInstap } = kiesRonde(tafelstand([], TZ), '2026-11-01T10:00:00Z', TZ, vast())
    expect(isInstap).toBe(true)
    expect(sommen).toHaveLength(20)
    for (const b of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) expect(sommen.filter((s) => s.b === b)).toHaveLength(2)
  })

  it('start na de instap met 1, 2, 5 en 10', () => {
    expect(tafelstand(instap([]), TZ).actief).toEqual([1, 2, 5, 10])
  })

  it('zet tafels die in de instap vlot gingen meteen aan, met een kortere begintijd', () => {
    const stand = tafelstand(instap([1, 2, 5, 10, 3]), TZ)
    expect(stand.actief).toContain(3)
    expect(stand.sommen.get('5x3')!.limietSec).toBe(5)
    expect(stand.sommen.get('5x4')!.limietSec).toBe(10)
  })

  it('zet de volgende tafel erbij zodra bij elke actieve tafel 8 van de 10 sommen vlot zijn', () => {
    const vlot = (bs: number[], n: number) => bs.flatMap((b) => sommenVanTafel(b).slice(0, n).map((s) => poging(s.id, 'goed', 2500, 2)))
    expect(tafelstand([...instap([]), ...vlot([1, 2, 5, 10], 7)], TZ).actief).toEqual([1, 2, 5, 10])
    expect(tafelstand([...instap([]), ...vlot([1, 2, 5, 10], 8)], TZ).actief).toEqual([1, 2, 5, 10, 3])
  })

  it('laat een tafel die erbij kwam aan, ook als het daarna minder gaat', () => {
    const pogingen = [
      ...instap([]),
      ...[1, 2, 5, 10].flatMap((b) => sommenVanTafel(b).map((s) => poging(s.id, 'goed', 2500, 2))),
      ...sommenVanTafel(2).map((s) => poging(s.id, 'fout', 2500, 3)),
    ]
    expect(tafelstand(pogingen, TZ).actief).toContain(3)
  })

  it('noemt een som pas beheerst na twee dagen binnen 3 seconden goed', () => {
    const een = tafelstand([...instap([]), poging('6x2', 'goed', 2000, 2), poging('6x2', 'goed', 2000, 2)], TZ)
    expect(een.sommen.get('6x2')!.beheerst).toBe(false)
    const twee = tafelstand([...instap([]), poging('6x2', 'goed', 2000, 2), poging('6x2', 'goed', 2000, 3)], TZ)
    expect(twee.sommen.get('6x2')!.beheerst).toBe(true)
  })

  it('kiest in een gewone ronde alleen sommen uit actieve tafels, vaker wat nog niet vlot gaat', () => {
    const pogingen = [...instap([]), ...sommenVanTafel(1).map((s) => poging(s.id, 'goed', 1500, 2)), ...sommenVanTafel(1).map((s) => poging(s.id, 'goed', 1500, 3))]
    const stand = tafelstand(pogingen, TZ)
    let vanEen = 0
    let totaal = 0
    for (let seed = 1; seed < 30; seed++) {
      const { sommen, instap: isInstap } = kiesRonde(stand, '2026-11-04T10:00:00Z', TZ, vast(seed))
      expect(isInstap).toBe(false)
      expect(sommen).toHaveLength(20)
      expect(new Set(sommen.map((s) => s.id)).size).toBe(20)
      for (const s of sommen) expect([1, 2, 5, 10]).toContain(s.b)
      vanEen += sommen.filter((s) => s.b === 1).length
      totaal += sommen.length
    }
    // Tafel 1 is beheerst: die komt veel minder vaak dan een kwart.
    expect(vanEen / totaal).toBeLessThan(0.1)
  })

  it('zet dezelfde tafel niet twee keer achter elkaar als het anders kan', () => {
    const { sommen } = kiesRonde(tafelstand(instap([]), TZ), '2026-11-02T10:00:00Z', TZ, vast(7))
    const dubbel = sommen.filter((s, i) => i > 0 && s.b === sommen[i - 1].b).length
    expect(dubbel).toBeLessThanOrEqual(2)
  })
})

describe('trucs', () => {
  it('geeft een truc die past bij de som', () => {
    expect(trucVoor(som(7, 9)).soort).toBe('tien-min')
    expect(trucVoor(som(7, 9)).uitleg).toContain('70 − 7 = 63')
    expect(trucVoor(som(6, 4)).soort).toBe('dubbel-dubbel')
    expect(trucVoor(som(7, 8)).soort).toBe('drie-keer-dubbel')
    expect(trucVoor(som(7, 6)).soort).toBe('vijf-plus')
    expect(trucVoor(som(6, 7)).soort).toBe('vijf-plus')
    expect(trucVoor(som(7, 7)).uitleg).toContain('35 + 14 = 49')
    expect(trucVoor(som(3, 10)).soort).toBe('nul-erachter')
  })
  it('stelt omdraaien voor als de omgekeerde som al vlot gaat', () => {
    const stand = tafelstand([...instap([]), poging('8x7', 'goed', 2000, 2)], TZ)
    expect(trucVoor(som(7, 8), stand).soort).toBe('omdraaien')
  })
})

describe('bewijs na de ronde', () => {
  it('telt sommen die sneller gingen dan de vorige keer', () => {
    const eerder = [...instap([]), poging('4x2', 'goed', 5000, 2), poging('6x2', 'goed', 2000, 2)]
    const ronde = [poging('4x2', 'goed', 2500, 3, { rondeId: 'nu' }), poging('6x2', 'goed', 2600, 3, { rondeId: 'nu' })]
    const b = rondebewijs([...eerder, ...ronde], 'nu', TZ)
    expect(b.sneller).toBe(1)
    expect(b.opDoel).toBe(2)
    expect(b.goed).toBe(2)
  })
  it('ontleedt een som', () => {
    expect(ontleed('7x8')).toEqual({ id: '7x8', a: 7, b: 8, uitkomst: 56 })
  })
})

describe('zelf een truc kiezen en een plan maken', () => {
  it('geeft drie trucs, waarvan er minstens één past en de andere bij een andere tafel horen', () => {
    for (const [a, b] of [[7, 9], [6, 8], [3, 4], [7, 7], [2, 10]]) {
      const opties = trucopties(som(a, b), undefined, vast(a * b))
      expect(opties).toHaveLength(3)
      expect(opties.some((o) => o.past)).toBe(true)
      for (const o of opties.filter((o) => !o.past)) expect([a, b]).not.toContain(o.hoortBij)
      expect(new Set(opties.map((o) => o.truc.soort)).size).toBe(3)
    }
  })
  it('laat 7 × 9 met keer 10 min één keer en met keer 5 plus keer 2 uitrekenen', () => {
    const passend = trucopties(som(7, 9), undefined, vast(3)).filter((o) => o.past).map((o) => o.truc.soort)
    expect(passend.sort()).toEqual(['tien-min', 'vijf-twee'])
  })
  it('kiest de lastigste som van de ronde en kijkt later of het plan werkte', () => {
    const alle = [...instap([]), poging('7x8', 'te laat', 10000, 2, { rondeId: 'r' }), poging('6x2', 'fout', 3000, 2, { rondeId: 'r' })]
    expect(lastigsteSom(alle, 'r')?.id).toBe('7x8')
    const voornemen = { som: '7x8', plan: 'truc', tijdstip: '2026-11-02T20:00:00.000Z' }
    expect(uitkomstTafelvoornemen(voornemen, alle)).toBeNull()
    const later = [...alle, poging('7x8', 'goed', 4000, 3)]
    expect(uitkomstTafelvoornemen(voornemen, later)?.uitkomst).toBe('gelukt')
  })
  it('wisselt de vraag na de ronde', () => {
    expect(tafelplanVraag(0, som(7, 8))).not.toBe(tafelplanVraag(1, som(7, 8)))
  })
})

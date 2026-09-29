import { describe, expect, it } from 'vitest'
import { berekenStrategiestap, type GeleerdMet, type Strategiekeuze } from './index'

const keuze = (bronId: string, tijdstip: string, strategie: Strategiekeuze['strategie'] = 'geheugenroute'): Strategiekeuze => ({
  bronId,
  strategie,
  tijdstip,
})
const geleerd = (bronId: string, statussen: GeleerdMet['status'][], metHulp = false): GeleerdMet[] =>
  statussen.map((status) => ({ bronId, strategie: 'geheugenroute', status, metHulp }))
const stap = (keuzes: Strategiekeuze[], g: GeleerdMet[]) => berekenStrategiestap('geheugenroute', keuzes, g, 3)

describe('strategiestap', () => {
  it('is er nog niet als de strategie nooit gebruikt is', () => {
    expect(stap([keuze('b1', '1', 'beelden koppelen')], [])).toBeNull()
  })

  it('is voorgedaan zodra de strategie gekozen is', () => {
    expect(stap([keuze('b1', '1')], [])).toBe('voorgedaan')
  })

  it('is met hulp gemaakt na een beeld met steuntje', () => {
    expect(stap([keuze('b1', '1')], geleerd('b1', ['nog aan het leren'], true))).toBe('met hulp gemaakt')
  })

  it('is zelf gemaakt na drie beelden zonder steuntje', () => {
    const twee = geleerd('b1', ['nog aan het leren', 'nog aan het leren'])
    expect(stap([keuze('b1', '1')], [...twee, ...geleerd('b1', ['nog aan het leren'], true)])).toBe('met hulp gemaakt')
    expect(stap([keuze('b1', '1')], [...twee, ...geleerd('b1', ['nog aan het leren'])])).toBe('zelf gemaakt')
  })

  it('is zelf gekozen als de leerling hem bij een latere bron opnieuw kiest', () => {
    expect(stap([keuze('b1', '1'), keuze('b2', '2')], [])).toBe('zelf gekozen')
  })

  it('is zelfstandig toegepast als meer dan de helft van die woorden later nog geweten is', () => {
    const keuzes = [keuze('b1', '1'), keuze('b2', '2')]
    expect(stap(keuzes, geleerd('b2', ['later nog geweten', 'nog aan het leren']))).toBe('zelf gekozen')
    expect(stap(keuzes, geleerd('b2', ['later nog geweten', 'later nog geweten', 'zelf teruggehaald']))).toBe(
      'zelfstandig toegepast',
    )
  })

  it('telt het succes bij de eerste bron niet mee, want daar werd de strategie voorgedaan', () => {
    const keuzes = [keuze('b1', '1'), keuze('b2', '2')]
    expect(stap(keuzes, geleerd('b1', ['later nog geweten']))).toBe('zelf gekozen')
  })

  it('telt dezelfde bron twee keer kiezen niet als een nieuwe bron', () => {
    expect(stap([keuze('b1', '1'), keuze('b1', '2')], [])).toBe('voorgedaan')
  })
})

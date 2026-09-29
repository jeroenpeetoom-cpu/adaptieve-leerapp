import { describe, expect, it } from 'vitest'
import { berekenStrategiestap, type GeleerdMet, type Strategiekeuze } from './index'

const keuze = (bronId: string, tijdstip: string, strategie: Strategiekeuze['strategie'] = 'geheugenroute'): Strategiekeuze => ({
  bronId,
  strategie,
  tijdstip,
})
const geleerd = (bronId: string, statussen: GeleerdMet['status'][]): GeleerdMet[] =>
  statussen.map((status) => ({ bronId, strategie: 'geheugenroute', status }))

describe('strategiestap', () => {
  it('is er nog niet als de strategie nooit gekozen is', () => {
    expect(berekenStrategiestap('geheugenroute', [keuze('b1', '1', 'beelden koppelen')], [])).toBeNull()
  })

  it('is voorgedaan bij de eerste bron', () => {
    expect(berekenStrategiestap('geheugenroute', [keuze('b1', '1')], geleerd('b1', ['later nog geweten']))).toBe('voorgedaan')
  })

  it('is zelf gekozen als de leerling hem bij een latere bron opnieuw kiest', () => {
    expect(berekenStrategiestap('geheugenroute', [keuze('b1', '1'), keuze('b2', '2')], [])).toBe('zelf gekozen')
  })

  it('is zelfstandig toegepast als meer dan de helft van die woorden later nog geweten is', () => {
    const keuzes = [keuze('b1', '1'), keuze('b2', '2')]
    const helft = geleerd('b2', ['later nog geweten', 'nog aan het leren'])
    const meer = geleerd('b2', ['later nog geweten', 'later nog geweten', 'zelf teruggehaald'])
    expect(berekenStrategiestap('geheugenroute', keuzes, helft)).toBe('zelf gekozen')
    expect(berekenStrategiestap('geheugenroute', keuzes, meer)).toBe('zelfstandig toegepast')
  })

  it('telt het succes bij de eerste bron niet mee, want daar werd de strategie voorgedaan', () => {
    const keuzes = [keuze('b1', '1'), keuze('b2', '2')]
    expect(berekenStrategiestap('geheugenroute', keuzes, geleerd('b1', ['later nog geweten']))).toBe('zelf gekozen')
  })

  it('telt dezelfde bron twee keer kiezen niet als een nieuwe bron', () => {
    expect(berekenStrategiestap('geheugenroute', [keuze('b1', '1'), keuze('b1', '2')], [])).toBe('voorgedaan')
  })
})

// Overeenkomsten en verschillen (spec leren-leren, S5): een paar leeritems dat de leerling door elkaar
// haalde, of dat sterk op elkaar lijkt, komt samen terug zodat hij het verschil leert zien.
import { beoordeel, bewerkingsafstand, normaliseer } from './antwoordcontrole'
import { afstand, STRAAL } from './kaarttik'
import type { Leeritem, Poging, Tijdstip } from './types'

export interface Vergelijking {
  a: string
  b: string
  reden: 'verward' | 'lijkt'
}

/** Na zoveel dagen mag een paar dat op elkaar lijkt (zonder verwarring) opnieuw gekozen worden. */
export const VERGELIJK_OPNIEUW_NA_DAGEN = 7

const isVrijGoed = (p: Poging) => p.oordeel === 'goed' && p.hulp === 'vrij opgehaald' && !p.antwoordZelfToegevoegd

/** Zelfde soort vraag: zelfde bron en richting, of bij plekken zelfde kaart en richting. */
function zelfdeSoortVraag(x: Leeritem, y: Leeritem): boolean {
  if (x.id === y.id || x.bronId !== y.bronId || x.woordpaarId === y.woordpaarId) return false
  if (x.plek || y.plek) return !!x.plek && !!y.plek && x.plek.kaartId === y.plek.kaartId && x.plek.richting === y.plek.richting
  return x.oefenrichting.van === y.oefenrichting.van && x.oefenrichting.naar === y.oefenrichting.naar
}

/** Bij welk ander leeritem hoort dit foute antwoord? Dan haalde de leerling die twee door elkaar. */
function verwardMet(poging: Poging, item: Leeritem, items: Leeritem[], verhouding: (kaartId: string) => number): Leeritem | undefined {
  if (poging.oordeel === 'goed' || poging.antwoord === null) return undefined
  const kandidaten = items.filter((y) => zelfdeSoortVraag(item, y))
  if (item.plek?.richting === 'aanwijzen') {
    const [x, yy] = poging.antwoord.split(',').map(Number)
    if (Number.isNaN(x) || Number.isNaN(yy)) return undefined
    return kandidaten.find((y) => afstand({ x, y: yy }, y.plek!, verhouding(y.plek!.kaartId)) <= STRAAL[y.plek!.soort])
  }
  return kandidaten.find((y) => beoordeel(poging.antwoord, y.toegestaneAntwoorden, !!y.plek) === 'goed')
}

/** Lijken twee leeritems sterk op elkaar: bijna dezelfde spelling, of plekken vlak bij elkaar? */
export function lijkenOpElkaar(x: Leeritem, y: Leeritem, verhouding = 1): boolean {
  if (!zelfdeSoortVraag(x, y)) return false
  if (x.plek && y.plek) return x.plek.soort === y.plek.soort && afstand(x.plek, y.plek, verhouding) <= STRAAL[x.plek.soort] * 2.5
  const a = normaliseer(x.vraag)
  const b = normaliseer(y.vraag)
  if (a.length < 4 || b.length < 4) return false
  return bewerkingsafstand(a, b) <= Math.max(1, Math.floor(Math.min(a.length, b.length) / 4))
}

/**
 * Kiest hooguit één paar voor deze sessie. Eerst een verwarring die nog niet is opgelost (daarna niet
 * allebei zonder hulp goed), de meest recente eerst; anders een paar dat op elkaar lijkt, waarvan beide
 * al eens geoefend zijn en dat de laatste dagen niet vergeleken is.
 */
export function kiesVergelijking(
  items: Leeritem[],
  pogingen: Poging[],
  eerder: { a: string; b: string; tijdstip: Tijdstip }[],
  nu: Tijdstip,
  verhouding: (kaartId: string) => number = () => 1,
): Vergelijking | null {
  const perId = new Map(items.map((i) => [i.id, i]))
  const opVolgorde = pogingen.filter((p) => perId.has(p.leeritemId)).sort((p, q) => q.tijdstip.localeCompare(p.tijdstip))
  for (const p of opVolgorde) {
    const item = perId.get(p.leeritemId)!
    if (p.bronversie !== item.bronversie) continue
    const ander = verwardMet(p, item, items, verhouding)
    if (!ander) continue
    const opgelost = [item.id, ander.id].every((id) => pogingen.some((q) => q.leeritemId === id && q.tijdstip > p.tijdstip && isVrijGoed(q)))
    if (!opgelost) return { a: item.id, b: ander.id, reden: 'verward' }
  }
  const geoefend = items.filter((i) => pogingen.some((p) => p.leeritemId === i.id))
  const grens = new Date(new Date(nu).getTime() - VERGELIJK_OPNIEUW_NA_DAGEN * 86_400_000).toISOString()
  const recent = (x: string, y: string) => eerder.some((e) => e.tijdstip > grens && ((e.a === x && e.b === y) || (e.a === y && e.b === x)))
  for (let i = 0; i < geoefend.length; i++)
    for (let j = i + 1; j < geoefend.length; j++) {
      const [x, y] = [geoefend[i], geoefend[j]]
      if (lijkenOpElkaar(x, y, x.plek ? verhouding(x.plek.kaartId) : 1) && !recent(x.id, y.id)) return { a: x.id, b: y.id, reden: 'lijkt' }
    }
  return null
}

import type { BronInfo, Leeritem } from '../leerlogica'
import type { Bron, Woordpaar } from './model'

/** Leeritems van een bron: één per bevestigd woordpaar en oefenrichting. */
export function leeritemsVan(bron: Bron, woordparen: Woordpaar[]): Leeritem[] {
  return woordparen
    .filter((wp) => wp.bronId === bron.id && wp.bevestigd)
    .sort((a, b) => a.volgorde - b.volgorde)
    .flatMap((wp) =>
      bron.oefenrichtingen.map((richting) => ({
        id: `${wp.id}-${richting.van}-${richting.naar}`,
        soort: 'woordpaar' as const,
        bronId: bron.id,
        woordpaarId: wp.id,
        bronversie: wp.bronversie,
        oefenrichting: richting,
        vraag: richting.van === 'nl' ? wp.betekenis : wp.woord,
        toegestaneAntwoorden: [richting.naar === 'nl' ? wp.betekenis : wp.woord],
      })),
    )
}

export function bronInfo(bron: Bron): BronInfo {
  return { bronId: bron.id, toetsdag: bron.toetsdag, afgerond: bron.afgerond }
}

/** Moet de leerling nog iets bekijken voordat hij kan bevestigen? */
export function nogTeBekijken(woordparen: Woordpaar[]): Woordpaar[] {
  return woordparen.filter(
    (wp) => !wp.bevestigd && !wp.bekeken && (wp.twijfelWoord !== 'geen' || wp.twijfelBetekenis !== 'geen'),
  )
}

/** Kan de bron bevestigd worden? */
export function kanBevestigen(woordparen: Woordpaar[]): boolean {
  const open = woordparen.filter((wp) => !wp.bevestigd)
  return (
    open.length > 0 &&
    nogTeBekijken(open).length === 0 &&
    open.every((wp) => wp.woord.trim() !== '' && wp.betekenis.trim() !== '')
  )
}

import { reflectieNodig, regelMetId, type BronInfo, type Leeritem } from '../leerlogica'
import type { Bron, Plek, Woordpaar } from './model'

/** Leeritems van een bron: één per bevestigd woordpaar en oefenrichting. */
export function leeritemsVan(bron: Bron, woordparen: Woordpaar[]): Leeritem[] {
  return woordparen
    .filter((wp) => wp.bronId === bron.id && wp.bevestigd && !wp.regelvoorbeeld)
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

/**
 * Leeritems van de regels van een bron: per begrip twee, eerst begrijpen (Engelse zin, kies de betekenis),
 * dan toepassen (situatie, kies de vorm). Beide horen bij hetzelfde begrip, zodat toepassen pas komt als
 * begrijpen een keer gelukt is.
 */
export function leeritemsVanRegels(bron: Bron): Leeritem[] {
  return (bron.regels ?? []).flatMap((regelId) => {
    const regel = regelMetId(regelId)
    if (!regel) return []
    return regel.begrippen.flatMap((b) =>
      (['begrijpen', 'toepassen'] as const).map((richting) => ({
        id: `regel:${bron.id}:${regelId}:${b.id}:${richting}`,
        soort: 'regel' as const,
        bronId: bron.id,
        woordpaarId: `regel:${bron.id}:${regelId}:${b.id}`,
        bronversie: 1,
        oefenrichting: richting === 'begrijpen' ? { van: 'en' as const, naar: 'nl' as const } : { van: 'nl' as const, naar: 'en' as const },
        vraag: richting === 'begrijpen' ? b.vorm : b.betekenis,
        toegestaneAntwoorden: [richting === 'begrijpen' ? b.betekenis : b.vorm],
        regel: { regelId, begrip: b.id, richting },
      })),
    )
  })
}

export function bronInfo(bron: Bron, vandaag: string): BronInfo {
  return {
    bronId: bron.id,
    toetsdag: bron.toetsdag,
    afgerond: bron.afgerond,
    // Een nieuwe toetsdatum in de toekomst haalt de bron weer uit onderhoud.
    onderhoud: bron.onderhoud === true && !(bron.toetsdag !== null && bron.toetsdag >= vandaag),
    wachtOpReflectie: reflectieNodig(bron, vandaag),
  }
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

/**
 * Leeritems van een topo-bron: per bevestigde plek één leeritem per oefenrichting, in de volgorde van
 * de plekken (toetsstof eerst, grote dingen eerst). Aanwijzen: "Waar ligt …?"; benoemen: "Wat ligt hier?".
 */
export function leeritemsVanPlekken(bron: Bron, plekken: Plek[]): Leeritem[] {
  const richtingen = bron.plekrichtingen ?? ['aanwijzen', 'benoemen']
  return plekken
    .filter((p) => p.bronId === bron.id && p.bevestigd && p.x !== null && p.y !== null && p.naam.trim() !== '')
    .sort((a, b) => a.volgorde - b.volgorde)
    .flatMap((p) =>
      richtingen.map((richting) => ({
        id: `${p.id}-${richting}`,
        soort: 'plek' as const,
        bronId: bron.id,
        woordpaarId: p.id,
        bronversie: p.bronversie,
        oefenrichting: { van: 'nl' as const, naar: 'nl' as const },
        vraag: p.naam,
        toegestaneAntwoorden: [p.naam],
        plek: { kaartId: p.kaartId, x: p.x!, y: p.y!, soort: p.soort, richting },
        toetsstof: p.toetsstof,
      })),
    )
}

/** Alle leeritems van een bron, van welke soort ook. */
export function leeritemsVanBron(bron: Bron, woordparen: Woordpaar[], plekken: Plek[]): Leeritem[] {
  return bron.soort === 'topo' ? leeritemsVanPlekken(bron, plekken) : [...leeritemsVan(bron, woordparen), ...leeritemsVanRegels(bron)]
}

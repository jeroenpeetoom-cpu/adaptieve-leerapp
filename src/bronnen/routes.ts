import type { Geheugenbeeld, Route } from './model'

export const MIN_PLEKKEN = 3
export const MAX_PLEKKEN = 5

export interface RouteStand {
  route: Route
  /** Geheugenbeelden op de route, op volgorde van plek. */
  bezet: Geheugenbeeld[]
  /** De eerstvolgende vrije plek (vanaf 0), of null als de route vol is. */
  vrijePlek: number | null
}

export function routeStand(route: Route, beelden: Geheugenbeeld[]): RouteStand {
  const bezet = beelden.filter((b) => b.routeId === route.id).sort((a, b) => (a.plek ?? 0) - (b.plek ?? 0))
  const vrij = route.plekken.findIndex((_, i) => !bezet.some((b) => b.plek === i))
  return { route, bezet, vrijePlek: vrij === -1 ? null : vrij }
}

/** De nieuwste route van een bron die nog een vrije plek heeft, of null. */
export function routeMetVrijePlek(bronId: string, routes: Route[], beelden: Geheugenbeeld[]): RouteStand | null {
  const eigen = routes.filter((r) => r.bronId === bronId).sort((a, b) => b.aangemaakt.localeCompare(a.aangemaakt))
  for (const r of eigen) {
    const stand = routeStand(r, beelden)
    if (stand.vrijePlek !== null) return stand
  }
  return null
}

/** Tekst van een geheugenbeeld voor de hint; bij een route met de plek erbij. */
export function beeldTekst(beeld: Geheugenbeeld, routes: Route[]): string {
  const basis = `${beeld.emoji ? `${beeld.emoji} ` : ''}${beeld.beschrijving}`
  const route = beeld.routeId ? routes.find((r) => r.id === beeld.routeId) : undefined
  const plek = route && beeld.plek !== null ? route.plekken[beeld.plek] : undefined
  return plek ? `${plek}: ${basis}` : basis
}

/** Een standaardnaam die routes van verschillende bronnen herkenbaar apart houdt. */
export function standaardRoutenaam(bronnaam: string, bestaand: Route[]): string {
  const nummer = bestaand.length + 1
  return nummer === 1 ? `Route ${bronnaam}` : `Route ${bronnaam} ${nummer}`
}

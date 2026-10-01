// De gebruikte aanpak zichtbaar maken, en wat hij de leerling opleverde (spec onderzoeksbrief, beslissing 5).
import type { Instellingen } from './instellingen'
import type { SessieToestand } from './sessie'
import { dagenTussen, kalenderdag } from './tijd'
import type { Leeritem, Poging } from './types'
import { DAGEN_LATER_NOG_GEWETEN } from './voortgang'

/** Pas vanaf zoveel getoetste leeritems per groep vergelijkt de app met en zonder beeld. */
export const MINIMUM_PER_GROEP = 5

const isVrijGoed = (p: Poging) => p.oordeel === 'goed' && p.hulp === 'vrij opgehaald' && !p.antwoordZelfToegevoegd

/** Eén zin over hoe de leerling in deze sessie oefende. */
export function beschrijfAanpak(sessie: SessieToestand): string {
  const eerstePoging = new Map<string, Poging>()
  for (const p of sessie.pogingen) if (!eerstePoging.has(p.leeritemId)) eerstePoging.set(p.leeritemId, p)
  const zelf = [...eerstePoging.values()].filter((p) => p.hulp === 'vrij opgehaald').length
  const metBeeld = new Set(sessie.pogingen.filter((p) => p.strategie).map((p) => p.leeritemId)).size
  const toets = sessie.pogingen.filter((p) => p.toetsvorm).length
  const geraden = Object.keys(sessie.geraden ?? {}).length

  const delen: string[] = []
  if (zelf > 0) delen.push(`Je haalde ${zelf === 1 ? '1 vraag' : `${zelf} vragen`} eerst zelf op uit je geheugen, voordat je het antwoord zag.`)
  if (geraden > 0) delen.push(`Bij ${geraden === 1 ? '1 nieuwe vraag' : `${geraden} nieuwe vragen`} raadde je eerst.`)
  if (metBeeld > 0) delen.push(`Bij ${metBeeld} hielp je eigen geheugenbeeld.`)
  if (toets > 0) delen.push(`${toets === 1 ? '1 vraag' : `${toets} vragen`} deed je in toetsvorm, zonder hulp.`)
  return delen.join(' ')
}

export interface Groep {
  /** Leeritems die minstens een week na de eerste kennismaking opnieuw gevraagd zijn. */
  getoetst: number
  /** Daarvan bij die eerste latere vraag goed en zonder hulp. */
  geweten: number
}

export interface Beeldvergelijking {
  met: Groep
  zonder: Groep
  /** Beide groepen zijn groot genoeg om iets te zeggen. */
  genoeg: boolean
}

/**
 * Vergelijkt hoe vaak leeritems met en zonder eigen geheugenbeeld na een week nog geweten werden: per
 * leeritem telt de eerste poging die minstens een week na de allereerste poging kwam (op de huidige
 * bronversie). Het is de eigen ervaring van de leerling, geen bewijs dat beelden altijd werken.
 */
export function vergelijkBeelden(
  leeritems: Leeritem[],
  pogingen: Poging[],
  metBeeld: Set<string>,
  instellingen: Instellingen,
): Beeldvergelijking {
  const met: Groep = { getoetst: 0, geweten: 0 }
  const zonder: Groep = { getoetst: 0, geweten: 0 }
  for (const item of leeritems) {
    const eigen = pogingen
      .filter((p) => p.leeritemId === item.id && p.bronversie === item.bronversie)
      .sort((a, b) => a.tijdstip.localeCompare(b.tijdstip))
    if (eigen.length === 0) continue
    const eersteDag = kalenderdag(eigen[0].tijdstip, instellingen.tijdzone)
    const later = eigen.find((p) => dagenTussen(eersteDag, kalenderdag(p.tijdstip, instellingen.tijdzone)) >= DAGEN_LATER_NOG_GEWETEN)
    if (!later) continue
    const groep = metBeeld.has(item.id) ? met : zonder
    groep.getoetst++
    if (isVrijGoed(later)) groep.geweten++
  }
  return { met, zonder, genoeg: met.getoetst >= MINIMUM_PER_GROEP && zonder.getoetst >= MINIMUM_PER_GROEP }
}

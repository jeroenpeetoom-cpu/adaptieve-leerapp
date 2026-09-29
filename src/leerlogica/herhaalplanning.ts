import { intervalVoorFase, type Instellingen } from './instellingen'
import { kalenderdag, telDagenOp } from './tijd'
import type { Herhaalplanning, Poging } from './types'
import { REGELVERSIE } from './versie'

/**
 * Leidt de herhaalplanning van één leeritem af uit zijn pogingen. Alleen de eerste poging per
 * kalenderdag telt; latere pogingen op dezelfde dag zijn oefening.
 */
export function berekenPlanning(
  leeritemId: string,
  pogingen: Poging[],
  instellingen: Instellingen,
): Herhaalplanning {
  const planning: Herhaalplanning = {
    leeritemId,
    fase: 0,
    volgendeDag: null,
    laatstVrijOpgehaald: null,
    regelversie: REGELVERSIE,
  }
  const gezien = new Set<string>()
  const opVolgorde = pogingen
    .filter((p) => p.leeritemId === leeritemId)
    .sort((a, b) => a.tijdstip.localeCompare(b.tijdstip))

  for (const poging of opVolgorde) {
    const dag = kalenderdag(poging.tijdstip, instellingen.tijdzone)
    if (gezien.has(dag)) continue
    gezien.add(dag)

    const vrijGoed =
      poging.oordeel === 'goed' && poging.hulp === 'vrij opgehaald' && !poging.antwoordZelfToegevoegd
    if (vrijGoed) {
      planning.fase += 1
      planning.laatstVrijOpgehaald = poging.tijdstip
    } else if (poging.oordeel === 'fout' || poging.oordeel === 'niet geweten') {
      planning.fase = 1
    } else {
      // Bijna, goed met hulp of met een zelf toegevoegd antwoord: de fase blijft gelijk.
      planning.fase = Math.max(planning.fase, 1)
    }
    const interval = vrijGoed ? intervalVoorFase(planning.fase, instellingen.intervallen) : 1
    planning.volgendeDag = telDagenOp(dag, interval)
  }
  return planning
}

export function isAanDeBeurt(planning: Herhaalplanning, vandaag: string): boolean {
  return planning.volgendeDag !== null && planning.volgendeDag <= vandaag
}

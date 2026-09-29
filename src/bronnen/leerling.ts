/** De persoon die oefent (CONTEXT.md). Alleen gegevens die nodig zijn voor het leren. */
export interface Leerling {
  id: string
  bijnaam: string
  leeftijdsgroep: '4-7' | '8-11' | '12-14' | '15-18' | '18+'
  onderwijsniveau: string
  leerjaar: string
  /** In de eerste versie altijd zelfstandig (ADR-0004). */
  stand: 'zelfstandig'
  aangemaakt: string
}

export const LEEFTIJDSGROEPEN: Leerling['leeftijdsgroep'][] = ['4-7', '8-11', '12-14', '15-18', '18+']
export const ONDERWIJSNIVEAUS = ['Basisschool', 'vmbo', 'havo', 'vwo', 'mbo', 'hbo of universiteit', 'Anders']

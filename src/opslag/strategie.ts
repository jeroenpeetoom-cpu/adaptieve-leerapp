import type { Strategie, Strategiekeuze } from '../leerlogica'
import type { Database } from './database'

/** Legt de strategie van een bron vast, en houdt bij wanneer welke strategie gekozen is (voor de strategiestap). */
export async function legStrategieVast(db: Database, bronId: string, strategie: Strategie | 'geen', tijdstip: string) {
  const perBron = await db.leesMeta<Record<string, Strategie | 'geen'>>('strategiePerBron', {})
  await db.schrijfMeta('strategiePerBron', { ...perBron, [bronId]: strategie })
  if (strategie === 'geen') return
  const keuzes = await db.leesMeta<Strategiekeuze[]>('strategieKeuzes', [])
  await db.schrijfMeta('strategieKeuzes', [...keuzes, { bronId, strategie, tijdstip }])
}

/** Keuzes van vóór het bijhouden van tijdstippen worden afgeleid uit de strategie per bron. */
export async function leesStrategieKeuzes(db: Database): Promise<Strategiekeuze[]> {
  const keuzes = await db.leesMeta<Strategiekeuze[]>('strategieKeuzes', [])
  const perBron = await db.leesMeta<Record<string, Strategie | 'geen'>>('strategiePerBron', {})
  const zonderTijd = Object.entries(perBron)
    .filter(([bronId, s]) => s !== 'geen' && !keuzes.some((k) => k.bronId === bronId))
    .map(([bronId, s]) => ({ bronId, strategie: s as Strategie, tijdstip: '' }))
  return [...zonderTijd, ...keuzes]
}

export interface Reflectie {
  tekst: string
  tijdstip: string
}

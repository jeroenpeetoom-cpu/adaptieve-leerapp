import type { Strategie } from '../leerlogica'
import type { Database } from './database'

/**
 * Verwijdert een bron met alles wat erbij hoort: bronpagina's, woordparen, kaart en plekken,
 * geheugenbeelden, routes, de voortgang (pogingen) en de instellingen per bron.
 */
export async function verwijderBron(db: Database, bronId: string): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    const inhoudIds = [
      ...(await db.woordparen.where('bronId').equals(bronId).primaryKeys()),
      ...(await db.plekken.where('bronId').equals(bronId).primaryKeys()),
    ]
    // Leeritems heten "<woordpaar of plek>-<richting>".
    const vanDezeBron = (leeritemId: string) => inhoudIds.some((id) => leeritemId.startsWith(`${id}-`))

    await db.pogingen.filter((p) => vanDezeBron(p.leeritemId)).delete()
    await db.geheugenbeelden.filter((b) => vanDezeBron(b.leeritemId)).delete()
    await db.routes.where('bronId').equals(bronId).delete()
    await db.woordparen.where('bronId').equals(bronId).delete()
    await db.bronpaginas.where('bronId').equals(bronId).delete()
    await db.plekken.where('bronId').equals(bronId).delete()
    await db.kaarten.where('bronId').equals(bronId).delete()
    await db.bronnen.delete(bronId)

    // Een gepauzeerde sessie met leeritems van deze bron is niet meer te hervatten.
    const sessies = await db.sessies.filter((s) => !s.klaar && s.toestand.leeritems.some((i) => i.bronId === bronId)).toArray()
    for (const s of sessies) await db.sessies.update(s.id, { klaar: true })

    const perBron = await db.leesMeta<Record<string, Strategie | 'geen'>>('strategiePerBron', {})
    delete perBron[bronId]
    await db.schrijfMeta('strategiePerBron', perBron)
    // Punten worden opnieuw geteld zonder deze bron.
    await db.meta.bulkDelete(['puntenOoit', 'hoogsteStrategiestap'])
    const extra = await db.leesMeta<Record<string, string[]>>('extraAntwoorden', {})
    await db.schrijfMeta('extraAntwoorden', Object.fromEntries(Object.entries(extra).filter(([id]) => !vanDezeBron(id))))
  })
}

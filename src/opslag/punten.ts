import {
  berekenStrategiestap,
  berekenVoortgang,
  isKlaar,
  STRATEGIESTAPPEN,
  telPunten,
  type GeleerdMet,
  type Instellingen,
  type Leeritem,
  type Puntentelling,
  type Strategie,
} from '../leerlogica'
import type { Database } from './database'
import { leesStrategieKeuzes } from './strategie'

const STRATEGIEEN: Strategie[] = ['beelden koppelen', 'geheugenroute']

/**
 * De punten van de leerling. Punten gaan nooit omlaag: de hoogste stand ooit wordt bewaard, ook als een
 * strategiestap terugvalt. Alleen een bron verwijderen telt opnieuw.
 */
export async function leesPunten(db: Database, instellingen: Instellingen): Promise<Puntentelling> {
  const pogingen = await db.pogingen.toArray()
  const missies = (await db.sessies.toArray()).filter((s) => s.klaar && isKlaar(s.toestand) && s.toestand.pogingen.length > 0).length

  // Strategiestappen, zoals in Inzichten, met de hoogste stap ooit per strategie.
  const inhoud = [
    ...(await db.woordparen.toArray()).map((w) => ({ id: w.id, bronId: w.bronId, bronversie: w.bronversie })),
    ...(await db.plekken.toArray()).map((p) => ({ id: p.id, bronId: p.bronId, bronversie: p.bronversie })),
  ]
  const geleerd: GeleerdMet[] = (await db.geheugenbeelden.toArray()).flatMap((b) => {
    const bij = inhoud.find((i) => b.leeritemId.startsWith(`${i.id}-`))
    if (!bij) return []
    const { status } = berekenVoortgang({ id: b.leeritemId, bronversie: bij.bronversie } as Leeritem, pogingen, instellingen)
    return [{ bronId: bij.bronId, strategie: b.routeId ? 'geheugenroute' : 'beelden koppelen', status, metHulp: b.metHulp ?? false }]
  })
  const keuzes = await leesStrategieKeuzes(db)
  const hoogste = await db.leesMeta<Partial<Record<Strategie, number>>>('hoogsteStrategiestap', {})
  for (const s of STRATEGIEEN) {
    const stap = berekenStrategiestap(s, keuzes, geleerd, instellingen.drempelZelfGemaakt)
    const nummer = stap ? STRATEGIESTAPPEN.indexOf(stap) + 1 : 0
    hoogste[s] = Math.max(hoogste[s] ?? 0, nummer)
  }
  await db.schrijfMeta('hoogsteStrategiestap', hoogste)
  const stappen = STRATEGIEEN.reduce((som, s) => som + (hoogste[s] ?? 0), 0)

  const telling = telPunten(pogingen, missies, stappen, instellingen)
  const ooit = await db.leesMeta('puntenOoit', 0)
  if (telling.totaal > ooit) await db.schrijfMeta('puntenOoit', telling.totaal)
  return { ...telling, totaal: Math.max(telling.totaal, ooit) }
}

/** Het verschil tussen twee tellingen, voor "+37 punten" in de terugblik. */
export function puntenErbij(voor: Puntentelling, na: Puntentelling): Puntentelling {
  return {
    missies: na.missies - voor.missies,
    codewoorden: na.codewoorden - voor.codewoorden,
    zelfTeruggehaald: na.zelfTeruggehaald - voor.zelfTeruggehaald,
    laterNogGeweten: na.laterNogGeweten - voor.laterNogGeweten,
    strategie: na.strategie - voor.strategie,
    totaal: Math.max(0, na.totaal - voor.totaal),
  }
}

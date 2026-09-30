import { useCallback, useEffect, useState } from 'react'
import { leeritemsVanBron } from '../bronnen/leeritems'
import type { Bron, Bronpagina, Geheugenbeeld, Plek, Woordpaar } from '../bronnen/model'
import {
  berekenPlanning,
  berekenStrategiestap,
  berekenVoortgang,
  dagenTussen,
  kalenderdag,
  STANDAARD_INSTELLINGEN,
  type GeleerdMet,
  type Poging,
  type Strategie,
  type Strategiekeuze,
  type Strategiestap,
  type Voortgangsstatus,
} from '../leerlogica'
import { echteDb } from '../opslag/database'
import { leesStrategieKeuzes } from '../opslag/strategie'
import { StatusLabel } from './Terugblik'

const instellingen = STANDAARD_INSTELLINGEN
const STATUSSEN: Voortgangsstatus[] = ['nog aan het leren', 'zelf teruggehaald', 'later nog geweten']
const STRATEGIEEN: { strategie: Strategie; naam: string }[] = [
  { strategie: 'beelden koppelen', naam: '🖼️ Beelden koppelen' },
  { strategie: 'geheugenroute', naam: '🗺️ Geheugenroute' },
]
const STAPUITLEG: Record<Strategiestap, string> = {
  voorgedaan: 'Voorgedaan: je hebt het een keer met uitleg gedaan.',
  'met hulp gemaakt': 'Met hulp gemaakt: je maakte beelden met het steuntje van de app.',
  'zelf gemaakt': 'Zelf gemaakt: je bedenkt je beelden nu zonder steuntje.',
  'zelf gekozen': 'Zelf gekozen: je koos het zelf bij een nieuwe lijst.',
  'zelfstandig toegepast': 'Zelfstandig toegepast: je koos het zelf, en het werkte: je weet de meeste woorden later nog.',
}

export function Inzichten({ onTerug }: { onTerug: () => void }) {
  const [gegevens, setGegevens] = useState<{
    bronnen: Bron[]
    paren: Woordpaar[]
    paginas: Bronpagina[]
    pogingen: Poging[]
    beelden: Geheugenbeeld[]
    keuzes: Strategiekeuze[]
    plekken: Plek[]
  } | null>(null)

  const laad = useCallback(async () => {
    setGegevens({
      bronnen: (await echteDb.bronnen.toArray()).sort((a, b) => b.aangemaakt.localeCompare(a.aangemaakt)),
      paren: await echteDb.woordparen.toArray(),
      paginas: await echteDb.bronpaginas.toArray(),
      pogingen: await echteDb.pogingen.toArray(),
      beelden: await echteDb.geheugenbeelden.toArray(),
      keuzes: await leesStrategieKeuzes(echteDb),
      plekken: await echteDb.plekken.toArray(),
    })
  }, [])

  useEffect(() => {
    void laad()
  }, [laad])

  if (!gegevens) return null
  const { bronnen, paren, paginas, pogingen, beelden, keuzes, plekken } = gegevens
  const vandaag = kalenderdag(new Date().toISOString(), instellingen.tijdzone)
  const items = bronnen.flatMap((b) => leeritemsVanBron(b, paren, plekken))
  const statusVan = new Map(items.map((i) => [i.id, berekenVoortgang(i, pogingen, instellingen).status]))

  const geleerd: GeleerdMet[] = beelden.flatMap((b) => {
    const item = items.find((i) => i.id === b.leeritemId)
    const status = statusVan.get(b.leeritemId)
    if (!item || !status) return []
    return [{ bronId: item.bronId, strategie: b.routeId ? 'geheugenroute' : 'beelden koppelen', status, metHulp: b.metHulp ?? false }]
  })

  // Komende herhalingen per dag; te late herhalingen tellen als vandaag.
  const perDag = new Map<number, number>()
  for (const b of bronnen.filter((b) => !b.afgerond)) {
    for (const item of leeritemsVanBron(b, paren, plekken)) {
      const dag = berekenPlanning(item.id, pogingen, instellingen, item.bronversie).volgendeDag
      if (dag === null) continue
      const over = Math.max(0, dagenTussen(vandaag, dag))
      if (over <= 6) perDag.set(over, (perDag.get(over) ?? 0) + 1)
    }
  }
  const dagnaam = (n: number) =>
    n === 0 ? 'Vandaag' : n === 1 ? 'Morgen' : new Date(Date.now() + n * 86_400_000).toLocaleDateString('nl-NL', { weekday: 'long' })

  return (
    <>
      <section className="kaart">
        <h2>Per bron</h2>
        {bronnen.length === 0 && <p className="gedempt">Nog geen bronnen.</p>}
        {bronnen.map((b) => {
          const eigen = leeritemsVanBron(b, paren, plekken)
          const mislukt = paginas.filter((p) => p.bronId === b.id && p.status === 'mislukt').length
          const open = paren.filter((wp) => wp.bronId === b.id && !wp.bevestigd).length
          return (
            <div key={b.id} className="inzicht-bron">
              <h3>
                {b.naam}
                {b.afgerond && <span className="gedempt"> · afgerond</span>}
              </h3>
              <ul className="inzicht-statussen">
                {STATUSSEN.map((s) => (
                  <li key={s}>
                    <StatusLabel status={s} /> {eigen.filter((i) => statusVan.get(i.id) === s).length}
                  </li>
                ))}
              </ul>
              {(mislukt > 0 || open > 0) && (
                <p className="gedempt">
                  {mislukt > 0 && `⚠ ${mislukt} ${mislukt === 1 ? 'pagina is' : "pagina's zijn"} niet gelukt, die woorden ontbreken nog. `}
                  {open > 0 && `${open} ${open === 1 ? 'woordpaar moet' : 'woordparen moeten'} nog bevestigd worden.`}
                </p>
              )}
            </div>
          )
        })}
      </section>

      <section className="kaart">
        <h2>Hoe je leert</h2>
        <ul className="inzicht-strategieen">
          {STRATEGIEEN.map(({ strategie, naam }) => {
            const stap = berekenStrategiestap(strategie, keuzes, geleerd, instellingen.drempelZelfGemaakt)
            return (
              <li key={strategie}>
                <strong>{naam}</strong>
                <p className="gedempt">{stap ? STAPUITLEG[stap] : 'Nog niet gebruikt.'}</p>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="kaart">
        <h2>Komende herhalingen</h2>
        {perDag.size === 0 ? (
          <p className="gedempt">Deze week staan er geen herhalingen gepland.</p>
        ) : (
          <ul className="woordenlijst">
            {[...perDag.entries()]
              .sort((a, b) => a[0] - b[0])
              .map(([n, aantal]) => (
                <li key={n}>
                  {dagnaam(n)}: {aantal} {aantal === 1 ? 'woord' : 'woorden'}
                </li>
              ))}
          </ul>
        )}
      </section>

      <button className="link" onClick={onTerug}>
        ← Terug
      </button>
    </>
  )
}

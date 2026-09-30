import { useCallback, useEffect, useState } from 'react'
import type { Leerling } from '../bronnen/leerling'
import { bronInfo, leeritemsVanBron } from '../bronnen/leeritems'
import type { Bron, Plek, Woordpaar } from '../bronnen/model'
import { STANDAARD_INSTELLINGEN } from '../leerlogica'
import { echteDb } from '../opslag/database'
import { Oefenroute } from './Oefenroute'

const nu = () => new Date().toISOString()

/** Herinner aan een back-up als de laatste langer dan dit aantal dagen geleden is. */
const BACKUP_HERINNERING_DAGEN = 7

interface Props {
  leerling: Leerling
  onInstellingen: () => void
  onInzichten: () => void
  onNieuweBron: () => void
  onOpenBron: (bronId: string, topo: boolean) => void
  onTestfunctie: () => void
}

export function Start({ leerling, onInstellingen, onInzichten, onNieuweBron, onOpenBron, onTestfunctie }: Props) {
  const [bronnen, setBronnen] = useState<Bron[] | null>(null)
  const [paren, setParen] = useState<Woordpaar[]>([])
  const [plekken, setPlekken] = useState<Plek[]>([])
  const [bezig, setBezig] = useState(false)
  const [laatsteBackup, setLaatsteBackup] = useState<string | null>(null)
  const [sessieMinuten, setSessieMinuten] = useState(STANDAARD_INSTELLINGEN.sessieMinuten)

  const laad = useCallback(async () => {
    setBronnen((await echteDb.bronnen.toArray()).sort((a, b) => b.aangemaakt.localeCompare(a.aangemaakt)))
    setParen(await echteDb.woordparen.toArray())
    setPlekken(await echteDb.plekken.toArray())
    setLaatsteBackup(await echteDb.leesMeta<string | null>('laatsteBackup', null))
    setSessieMinuten(await echteDb.leesMeta('sessieMinuten', STANDAARD_INSTELLINGEN.sessieMinuten))
  }, [])

  useEffect(() => {
    void laad()
  }, [laad])

  if (bronnen === null) return null
  const leeritems = bronnen.flatMap((b) => leeritemsVanBron(b, paren, plekken))
  const plekkenVan = (bronId: string) => plekken.filter((p) => p.bronId === bronId)
  const backupNodig =
    leeritems.length > 0 &&
    (laatsteBackup === null || Date.now() - new Date(laatsteBackup).getTime() > BACKUP_HERINNERING_DAGEN * 86_400_000)

  return (
    <>
      {!bezig && <p className="groet">Hoi {leerling.bijnaam}!</p>}
      <Oefenroute
        db={echteDb}
        bronnamen={Object.fromEntries(bronnen.map((b) => [b.id, b.naam]))}
        leeritems={leeritems}
        bronnen={bronnen.map(bronInfo)}
        nu={nu}
        instellingen={{ ...STANDAARD_INSTELLINGEN, sessieMinuten }}
        onBezig={setBezig}
        leeg={<p>Nog niets om te oefenen. Maak een foto van je woordenlijst of topokaart om te beginnen.</p>}
        onder={() => (
          <section className="kaart">
            <h2>Je bronnen</h2>
            {bronnen.length === 0 ? (
              <p className="gedempt">Nog geen bronnen.</p>
            ) : (
              <ul className="bronnen">
                {bronnen.map((b) => {
                  const eigen = paren.filter((wp) => wp.bronId === b.id)
                  const klaar = eigen.filter((wp) => wp.bevestigd).length
                  const open = eigen.length - klaar
                  return (
                    <li key={b.id}>
                      <button className="bron-knop" onClick={() => onOpenBron(b.id, b.soort === 'topo')}>
                        <strong>
                          {b.soort === 'topo' ? '🗺️ ' : '📝 '}
                          {b.naam}
                        </strong>
                        <span className="gedempt">
                          {b.soort === 'topo' ? (
                            `${plekkenVan(b.id).length} ${plekkenVan(b.id).length === 1 ? 'plek' : 'plekken'}${
                              plekkenVan(b.id).length > 0 && !plekkenVan(b.id).every((p) => p.bevestigd) ? ' · nog controleren' : ''
                            }`
                          ) : (
                            <>
                              {klaar} {klaar === 1 ? 'woord' : 'woorden'}
                              {open > 0 && ` · ${open} nog controleren`}
                            </>
                          )}
                          {b.afgerond && ' · afgerond'}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
            <button className="knop" onClick={onNieuweBron}>
              + Nieuwe bron (woordenlijst of kaart)
            </button>
          </section>
        )}
      />
      {!bezig && (
        <>
          {backupNodig && (
            <p className="feedback" role="note">
              {laatsteBackup ? 'Je laatste back-up is meer dan een week oud.' : 'Je hebt nog geen back-up gemaakt.'}{' '}
              <button className="link" onClick={onInstellingen}>
                Maak een back-up
              </button>
            </p>
          )}
          <div className="knoppen">
            <button className="link" onClick={onInzichten}>
              📊 Inzichten
            </button>
            <button className="link" onClick={onInstellingen}>
              ⚙️ Profiel en back-up
            </button>
          </div>
          <p className="melding" role="note">
            <span aria-hidden="true">🔒 </span>
            Alles wat je hier doet, blijft alleen op dit apparaat staan.
          </p>
          <button className="link" onClick={onTestfunctie}>
            Testfunctie voor de begeleider
          </button>
        </>
      )}
    </>
  )
}

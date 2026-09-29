import { useCallback, useEffect, useState } from 'react'
import { bronInfo, leeritemsVan } from '../bronnen/leeritems'
import type { Bron, Woordpaar } from '../bronnen/model'
import { STANDAARD_INSTELLINGEN } from '../leerlogica'
import { echteDb } from '../opslag/database'
import { Oefenroute } from './Oefenroute'

const nu = () => new Date().toISOString()

interface Props {
  onNieuweBron: () => void
  onOpenBron: (bronId: string) => void
  onTestfunctie: () => void
}

export function Start({ onNieuweBron, onOpenBron, onTestfunctie }: Props) {
  const [bronnen, setBronnen] = useState<Bron[] | null>(null)
  const [paren, setParen] = useState<Woordpaar[]>([])
  const [bezig, setBezig] = useState(false)

  const laad = useCallback(async () => {
    setBronnen((await echteDb.bronnen.toArray()).sort((a, b) => b.aangemaakt.localeCompare(a.aangemaakt)))
    setParen(await echteDb.woordparen.toArray())
  }, [])

  useEffect(() => {
    void laad()
  }, [laad])

  if (bronnen === null) return null
  const leeritems = bronnen.flatMap((b) => leeritemsVan(b, paren))

  return (
    <>
      <Oefenroute
        db={echteDb}
        leeritems={leeritems}
        bronnen={bronnen.map(bronInfo)}
        nu={nu}
        instellingen={STANDAARD_INSTELLINGEN}
        onBezig={setBezig}
        leeg={<p>Nog geen woorden. Maak een foto van je woordenlijst om te beginnen.</p>}
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
                      <button className="bron-knop" onClick={() => onOpenBron(b.id)}>
                        <strong>{b.naam}</strong>
                        <span className="gedempt">
                          {klaar} {klaar === 1 ? 'woord' : 'woorden'}
                          {open > 0 && ` · ${open} nog controleren`}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
            <button className="knop" onClick={onNieuweBron}>
              + Nieuwe bron (foto)
            </button>
          </section>
        )}
      />
      {!bezig && (
        <>
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

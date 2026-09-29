import { useCallback, useEffect, useState } from 'react'
import type { Leerling } from './bronnen/leerling'
import { vraagBlijvendeOpslag } from './opslag/blijvend'
import { echteDb } from './opslag/database'
import { BronScherm } from './schermen/BronScherm'
import { Instellingen } from './schermen/Instellingen'
import { NieuweBron } from './schermen/NieuweBron'
import { Welkom } from './schermen/Profiel'
import { Start } from './schermen/Start'
import { Testfunctie } from './schermen/Testfunctie'

type Scherm =
  | { soort: 'start' }
  | { soort: 'test' }
  | { soort: 'nieuweBron' }
  | { soort: 'bron'; bronId: string }
  | { soort: 'instellingen' }

export default function App() {
  const [scherm, setScherm] = useState<Scherm>({ soort: 'start' })
  const [leerling, setLeerling] = useState<Leerling | null | undefined>(undefined)
  const naarStart = () => setScherm({ soort: 'start' })

  const laad = useCallback(async () => {
    setLeerling((await echteDb.leerlingen.toArray())[0] ?? null)
  }, [])

  useEffect(() => {
    void laad()
    void vraagBlijvendeOpslag()
  }, [laad])

  async function welkomKlaar(l: Leerling) {
    await echteDb.leerlingen.put(l)
    setLeerling(l)
  }

  return (
    <main className="start">
      <h1>Woordexpeditie</h1>
      {leerling === null && scherm.soort !== 'test' && <Welkom onKlaar={(l) => void welkomKlaar(l)} />}
      {leerling && scherm.soort === 'start' && (
        <Start
          leerling={leerling}
          onNieuweBron={() => setScherm({ soort: 'nieuweBron' })}
          onOpenBron={(bronId) => setScherm({ soort: 'bron', bronId })}
          onInstellingen={() => setScherm({ soort: 'instellingen' })}
          onTestfunctie={() => setScherm({ soort: 'test' })}
        />
      )}
      {leerling && scherm.soort === 'nieuweBron' && (
        <NieuweBron onKlaar={(bronId) => setScherm({ soort: 'bron', bronId })} onAnnuleer={naarStart} />
      )}
      {leerling && scherm.soort === 'bron' && <BronScherm bronId={scherm.bronId} onTerug={naarStart} />}
      {leerling && scherm.soort === 'instellingen' && (
        <Instellingen onTerug={() => void laad().then(naarStart)} onGewist={() => void laad().then(naarStart)} />
      )}
      {scherm.soort === 'test' && <Testfunctie onTerug={naarStart} />}
      <p className="versie">Versie {__APP_VERSIE__}</p>
    </main>
  )
}

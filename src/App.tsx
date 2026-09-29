import { useState } from 'react'
import { BronScherm } from './schermen/BronScherm'
import { NieuweBron } from './schermen/NieuweBron'
import { Start } from './schermen/Start'
import { Testfunctie } from './schermen/Testfunctie'

type Scherm = { soort: 'start' } | { soort: 'test' } | { soort: 'nieuweBron' } | { soort: 'bron'; bronId: string }

export default function App() {
  const [scherm, setScherm] = useState<Scherm>({ soort: 'start' })
  const naarStart = () => setScherm({ soort: 'start' })

  return (
    <main className="start">
      <h1>Woordexpeditie</h1>
      {scherm.soort === 'start' && (
        <Start
          onNieuweBron={() => setScherm({ soort: 'nieuweBron' })}
          onOpenBron={(bronId) => setScherm({ soort: 'bron', bronId })}
          onTestfunctie={() => setScherm({ soort: 'test' })}
        />
      )}
      {scherm.soort === 'nieuweBron' && (
        <NieuweBron onKlaar={(bronId) => setScherm({ soort: 'bron', bronId })} onAnnuleer={naarStart} />
      )}
      {scherm.soort === 'bron' && <BronScherm bronId={scherm.bronId} onTerug={naarStart} />}
      {scherm.soort === 'test' && <Testfunctie onTerug={naarStart} />}
    </main>
  )
}

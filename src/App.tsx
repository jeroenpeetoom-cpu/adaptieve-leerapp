import { useState } from 'react'
import { Testfunctie } from './schermen/Testfunctie'

type Scherm = 'start' | 'test'

export default function App() {
  const [scherm, setScherm] = useState<Scherm>('start')

  return (
    <main className="start">
      <h1>Woordexpeditie</h1>
      {scherm === 'start' && (
        <>
          <p>Hier komt straks je ruimte-expeditie: woorden uit je eigen huiswerk oefenen.</p>
          <p className="melding" role="note">
            <span aria-hidden="true">🔒 </span>
            Alles wat je hier doet, blijft alleen op dit apparaat staan.
          </p>
          <button className="link" onClick={() => setScherm('test')}>
            Testfunctie voor de begeleider
          </button>
        </>
      )}
      {scherm === 'test' && <Testfunctie onTerug={() => setScherm('start')} />}
    </main>
  )
}

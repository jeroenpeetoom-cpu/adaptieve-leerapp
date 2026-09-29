import { useState } from 'react'
import { Database } from '../opslag/database'
import { testLeeritems } from '../testfunctie/testbron'
import { OefenSessie } from './OefenSessie'

const testDb = new Database('test')

export function Testfunctie({ onTerug }: { onTerug: () => void }) {
  const [sessie, setSessie] = useState(0)
  const [bezig, setBezig] = useState(false)

  async function wisTestgegevens() {
    await testDb.pogingen.clear()
    setSessie((n) => n + 1)
  }

  return (
    <>
      <p className="testbanner" role="note">
        <strong>TESTFUNCTIE</strong> · voorbeeldwoorden, los van de echte voortgang
      </p>
      {bezig ? (
        <OefenSessie
          key={sessie}
          db={testDb}
          leeritems={testLeeritems}
          onKlaar={() => {
            setBezig(false)
            setSessie((n) => n + 1)
          }}
        />
      ) : (
        <section className="kaart">
          <h2>Testbron: Engels, 4 woorden</h2>
          <p>bridge, cloud, key en river. Oefenrichting: Engels → Nederlands.</p>
          <div className="knoppen">
            <button className="knop" onClick={() => setBezig(true)}>
              Start testsessie
            </button>
            <button className="knop knop-rustig" onClick={() => void wisTestgegevens()}>
              Wis testgegevens
            </button>
          </div>
        </section>
      )}
      <button className="link" onClick={onTerug}>
        ← Terug
      </button>
    </>
  )
}

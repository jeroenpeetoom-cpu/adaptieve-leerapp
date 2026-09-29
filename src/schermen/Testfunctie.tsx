import { useCallback, useEffect, useState } from 'react'
import { berekenPlanning, berekenVoortgang, dagenTussen, STANDAARD_INSTELLINGEN } from '../leerlogica'
import { Database } from '../opslag/database'
import { testTijd } from '../testfunctie/klok'
import { TESTBRON_ID, testLeeritems } from '../testfunctie/testbron'
import { Oefenroute } from './Oefenroute'
import { StatusLabel } from './Terugblik'

const testDb = new Database('test')
const instellingen = STANDAARD_INSTELLINGEN

function relatieveDag(vandaag: string, dag: string | null): string {
  if (dag === null) return 'nog nieuw'
  const verschil = dagenTussen(vandaag, dag)
  if (verschil < 0) return `aan de beurt (${-verschil} ${-verschil === 1 ? 'dag' : 'dagen'} te laat)`
  if (verschil === 0) return 'vandaag'
  if (verschil === 1) return 'morgen'
  return `over ${verschil} dagen`
}

function datumTekst(dag: string): string {
  return new Intl.DateTimeFormat('nl-NL', { weekday: 'short', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(
    new Date(`${dag}T12:00:00Z`),
  )
}

export function Testfunctie({ onTerug }: { onTerug: () => void }) {
  const [klokDagen, setKlokDagen] = useState(0)
  const [toetsdag, setToetsdag] = useState<string | null>(null)
  const [versie, setVersie] = useState(0)
  const [bezig, setBezig] = useState(false)

  const laad = useCallback(async () => {
    setKlokDagen(await testDb.leesMeta('klokDagen', 0))
    setToetsdag(await testDb.leesMeta<string | null>('toetsdag', null))
  }, [])

  useEffect(() => {
    void laad()
  }, [laad])

  const nu = useCallback(() => testTijd(klokDagen), [klokDagen])

  async function zetKlok(dagen: number) {
    await testDb.schrijfMeta('klokDagen', dagen)
    setKlokDagen(dagen)
  }

  async function zetToets(dag: string) {
    const waarde = dag === '' ? null : dag
    setToetsdag(waarde)
    await testDb.schrijfMeta('toetsdag', waarde)
  }

  async function wis() {
    await testDb.wisAlles()
    await laad()
    setVersie((v) => v + 1)
  }

  const klok = (vandaag: string) => (
    <section className="kaart">
      <h2>Klok</h2>
      <p>
        Testdatum: <strong>{datumTekst(vandaag)}</strong>
        {klokDagen > 0 && ` (${klokDagen} ${klokDagen === 1 ? 'dag' : 'dagen'} vooruit)`}
      </p>
      <div className="knoppen">
        <button className="knop knop-rustig" onClick={() => void zetKlok(klokDagen + 1)}>
          +1 dag
        </button>
        <button className="knop knop-rustig" onClick={() => void zetKlok(klokDagen + 7)}>
          +7 dagen
        </button>
        <button className="knop knop-rustig" onClick={() => void zetKlok(0)} disabled={klokDagen === 0}>
          Terug naar vandaag
        </button>
      </div>
      <label className="label" htmlFor="toets" style={{ marginTop: '1rem' }}>
        Toetsdatum van de testbron (optioneel)
      </label>
      <input id="toets" className="invoer" type="date" value={toetsdag ?? ''} onChange={(e) => void zetToets(e.target.value)} />
    </section>
  )

  return (
    <>
      <p className="testbanner" role="note">
        <strong>TESTFUNCTIE</strong> · voorbeeldwoorden en een instelbare klok, los van de echte voortgang
      </p>
      <Oefenroute
        key={`${versie}-${klokDagen}`}
        db={testDb}
        bronnamen={{ [TESTBRON_ID]: 'test' }}
        leeritems={testLeeritems}
        bronnen={[{ bronId: TESTBRON_ID, toetsdag, afgerond: false }]}
        nu={nu}
        instellingen={instellingen}
        leeg={<p>Geen testwoorden.</p>}
        onBezig={setBezig}
        onder={({ pogingen, leeritems, vandaag }) => (
          <>
            {klok(vandaag)}
            <section className="kaart">
              <h2>Voortgang en herhaalplanning</h2>
              <table className="tabel">
                <thead>
                  <tr>
                    <th>Woord</th>
                    <th>Status</th>
                    <th>Volgende keer</th>
                  </tr>
                </thead>
                <tbody>
                  {leeritems.map((item) => (
                    <tr key={item.id}>
                      <td lang="en">{item.vraag}</td>
                      <td>
                        <StatusLabel status={berekenVoortgang(item, pogingen, instellingen).status} />
                      </td>
                      <td>{relatieveDag(vandaag, berekenPlanning(item.id, pogingen, instellingen, item.bronversie).volgendeDag)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="gedempt">{pogingen.length} pogingen opgeslagen.</p>
              <button className="knop knop-rustig" onClick={() => void wis()}>
                Wis testgegevens en zet de klok terug
              </button>
            </section>
          </>
        )}
      />
      {!bezig && (
        <button className="link" onClick={onTerug}>
          ← Terug
        </button>
      )}
    </>
  )
}

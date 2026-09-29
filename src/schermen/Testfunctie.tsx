import { useCallback, useEffect, useState } from 'react'
import {
  berekenPlanning,
  dagenTussen,
  kalenderdag,
  startSessie,
  STANDAARD_INSTELLINGEN,
  stelSessieSamen,
  type Poging,
  type SessieToestand,
} from '../leerlogica'
import { Database } from '../opslag/database'
import { testTijd } from '../testfunctie/klok'
import { TESTBRON_ID, testLeeritems } from '../testfunctie/testbron'
import { OefenSessie } from './OefenSessie'

const testDb = new Database('test')
const instellingen = STANDAARD_INSTELLINGEN

type Weergave =
  | { soort: 'overzicht' }
  | { soort: 'sessie'; toestand: SessieToestand }
  | { soort: 'klaar'; toestand: SessieToestand }

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
  const [pogingen, setPogingen] = useState<Poging[]>([])
  const [openSessie, setOpenSessie] = useState<SessieToestand | null>(null)
  const [weergave, setWeergave] = useState<Weergave>({ soort: 'overzicht' })
  const [melding, setMelding] = useState<string | null>(null)

  const nu = useCallback(() => testTijd(klokDagen), [klokDagen])
  const vandaag = kalenderdag(nu(), instellingen.tijdzone)

  const laad = useCallback(async () => {
    setKlokDagen(await testDb.leesMeta('klokDagen', 0))
    setToetsdag(await testDb.leesMeta<string | null>('toetsdag', null))
    setPogingen(await testDb.pogingen.toArray())
    setOpenSessie((await testDb.openSessie())?.toestand ?? null)
  }, [])

  useEffect(() => {
    void laad()
  }, [laad])

  const samenstelling = stelSessieSamen(
    testLeeritems,
    pogingen,
    [{ bronId: TESTBRON_ID, toetsdag, afgerond: false }],
    vandaag,
    instellingen,
  )
  const aantal = samenstelling.herhalingen.length + samenstelling.nieuw.length

  function startNieuweSessie(): boolean {
    if (aantal === 0) return false
    const items = [...samenstelling.herhalingen, ...samenstelling.nieuw]
    setMelding(null)
    setWeergave({ soort: 'sessie', toestand: startSessie(crypto.randomUUID(), items) })
    return true
  }

  async function zetKlok(dagen: number) {
    await testDb.schrijfMeta('klokDagen', dagen)
    setKlokDagen(dagen)
  }

  async function zetToets(dag: string) {
    const waarde = dag === '' ? null : dag
    await testDb.schrijfMeta('toetsdag', waarde)
    setToetsdag(waarde)
  }

  async function wis() {
    await testDb.wisAlles()
    setMelding(null)
    await laad()
  }

  async function sessieKlaar(toestand: SessieToestand) {
    await laad()
    setWeergave({ soort: 'klaar', toestand })
  }

  const banner = (
    <p className="testbanner" role="note">
      <strong>TESTFUNCTIE</strong> · voorbeeldwoorden en een instelbare klok, los van de echte voortgang
    </p>
  )

  if (weergave.soort === 'sessie') {
    return (
      <>
        {banner}
        <OefenSessie key={weergave.toestand.sessieId} db={testDb} begintoestand={weergave.toestand} nu={nu} onKlaar={(t) => void sessieKlaar(t)} />
        <button className="link" onClick={() => void laad().then(() => setWeergave({ soort: 'overzicht' }))}>
          ← Pauzeren
        </button>
      </>
    )
  }

  if (weergave.soort === 'klaar') {
    const vrij = weergave.toestand.pogingen.filter((p) => p.oordeel === 'goed' && p.hulp === 'vrij opgehaald')
    const geoefend = new Set(weergave.toestand.pogingen.map((p) => p.leeritemId)).size
    return (
      <>
        {banner}
        <section className="kaart">
          <h2>Klaar!</h2>
          <p>
            Je hebt {geoefend} {geoefend === 1 ? 'woord' : 'woorden'} geoefend. {vrij.length}{' '}
            {vrij.length === 1 ? 'keer' : 'keer'} wist je het zelf.
          </p>
          {melding && <p className="feedback">{melding}</p>}
          <div className="knoppen">
            <button
              className="knop"
              onClick={() => {
                if (!startNieuweSessie()) setMelding('Alles voor vandaag is klaar. Morgen komen er weer woorden terug.')
              }}
            >
              Nog een rondje
            </button>
            <button className="knop knop-rustig" onClick={() => setWeergave({ soort: 'overzicht' })}>
              Naar het overzicht
            </button>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      {banner}

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

      <section className="kaart">
        <h2>Vandaag</h2>
        {openSessie ? (
          <>
            <p>Er is een sessie gepauzeerd.</p>
            <button className="knop" onClick={() => setWeergave({ soort: 'sessie', toestand: openSessie })}>
              Ga verder
            </button>
          </>
        ) : aantal > 0 ? (
          <>
            <p>
              {samenstelling.herhalingen.length} {samenstelling.herhalingen.length === 1 ? 'herhaling' : 'herhalingen'} en{' '}
              {samenstelling.nieuw.length} {samenstelling.nieuw.length === 1 ? 'nieuw woord' : 'nieuwe woorden'}.
            </p>
            <button className="knop" onClick={() => startNieuweSessie()}>
              Start sessie ({aantal} {aantal === 1 ? 'woord' : 'woorden'})
            </button>
          </>
        ) : (
          <p>Niets te doen vandaag. Zet de klok vooruit om een volgende dag te testen.</p>
        )}
      </section>

      <section className="kaart">
        <h2>Herhaalplanning</h2>
        <table className="tabel">
          <thead>
            <tr>
              <th>Woord</th>
              <th>Fase</th>
              <th>Volgende keer</th>
            </tr>
          </thead>
          <tbody>
            {testLeeritems.map((item) => {
              const planning = berekenPlanning(item.id, pogingen, instellingen)
              return (
                <tr key={item.id}>
                  <td lang="en">{item.vraag}</td>
                  <td>{planning.fase}</td>
                  <td>{relatieveDag(vandaag, planning.volgendeDag)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className="gedempt">{pogingen.length} pogingen opgeslagen.</p>
        <button className="knop knop-rustig" onClick={() => void wis()}>
          Wis testgegevens en zet de klok terug
        </button>
      </section>

      <button className="link" onClick={onTerug}>
        ← Terug
      </button>
    </>
  )
}

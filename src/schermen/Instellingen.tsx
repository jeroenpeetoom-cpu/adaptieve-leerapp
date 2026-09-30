import { useCallback, useEffect, useRef, useState } from 'react'
import type { Leerling } from '../bronnen/leerling'
import { leesBackup, maakBackup, OngeldigeBackup, zetBackupTerug } from '../opslag/backup'
import { isBlijvend, vraagBlijvendeOpslag } from '../opslag/blijvend'
import { STANDAARD_INSTELLINGEN } from '../leerlogica'
import { echteDb } from '../opslag/database'
import { isGeluidUit, zetGeluidUit } from '../weergave/voorlezen'
import { ProfielFormulier } from './Profiel'

const WISWOORD = 'WISSEN'

function datum(tijdstip: string) {
  return new Date(tijdstip).toLocaleString('nl-NL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
}

export function Instellingen({ onTerug, onGewist }: { onTerug: () => void; onGewist: () => void }) {
  const [leerling, setLeerling] = useState<Leerling | null>(null)
  const [blijvend, setBlijvend] = useState<boolean | null>(null)
  const [laatsteBackup, setLaatsteBackup] = useState<string | null>(null)
  const [melding, setMelding] = useState<{ tekst: string; fout?: boolean } | null>(null)
  const [wissen, setWissen] = useState(false)
  const [wisTekst, setWisTekst] = useState('')
  const [geluidUit, setGeluidUit] = useState(isGeluidUit)
  const [sessieMinuten, setSessieMinuten] = useState(STANDAARD_INSTELLINGEN.sessieMinuten)
  const importRef = useRef<HTMLInputElement>(null)

  const laad = useCallback(async () => {
    setLeerling((await echteDb.leerlingen.toArray())[0] ?? null)
    setBlijvend(await isBlijvend())
    setLaatsteBackup(await echteDb.leesMeta<string | null>('laatsteBackup', null))
    setSessieMinuten(await echteDb.leesMeta('sessieMinuten', STANDAARD_INSTELLINGEN.sessieMinuten))
  }, [])

  useEffect(() => {
    void laad()
  }, [laad])

  async function exporteer() {
    const nu = new Date().toISOString()
    const backup = await maakBackup(echteDb, nu)
    const naam = `woordexpeditie-backup-${nu.slice(0, 10)}.json`
    const bestand = new File([JSON.stringify(backup)], naam, { type: 'application/json' })
    // Delen maakt het makkelijk om de back-up in Google Drive of een berichtje te bewaren.
    if (navigator.canShare?.({ files: [bestand] })) {
      try {
        await navigator.share({ files: [bestand], title: 'Back-up Woordexpeditie' })
      } catch (fout) {
        if ((fout as Error).name === 'AbortError') return
        throw fout
      }
    } else {
      const url = URL.createObjectURL(bestand)
      const a = document.createElement('a')
      a.href = url
      a.download = naam
      a.click()
      URL.revokeObjectURL(url)
    }
    await echteDb.schrijfMeta('laatsteBackup', nu)
    setLaatsteBackup(nu)
    setMelding({ tekst: 'Back-up gemaakt. Bewaar het bestand op een veilige plek, bijvoorbeeld in Google Drive.' })
  }

  async function importeer(bestanden: FileList | null) {
    const bestand = bestanden?.[0]
    if (importRef.current) importRef.current.value = ''
    if (!bestand) return
    try {
      const backup = leesBackup(await bestand.text())
      const ok = window.confirm(
        `Deze back-up is gemaakt op ${datum(backup.gemaakt)}. Alles wat nu in de app staat, wordt vervangen. Doorgaan?`,
      )
      if (!ok) return
      await zetBackupTerug(echteDb, backup)
      setMelding({ tekst: 'De back-up is teruggezet.' })
      await laad()
    } catch (fout) {
      setMelding({ tekst: fout instanceof OngeldigeBackup ? fout.message : 'Terugzetten lukte niet.', fout: true })
    }
  }

  async function wisAlles() {
    if (wisTekst.trim().toUpperCase() !== WISWOORD) return
    await echteDb.wisAlles()
    onGewist()
  }

  return (
    <>
      {leerling && (
        <section className="kaart">
          <h2>Profiel</h2>
          <ProfielFormulier
            begin={leerling}
            knoptekst="Opslaan"
            onBewaar={(l) =>
              void echteDb.leerlingen.put(l).then(() => {
                setLeerling(l)
                setMelding({ tekst: 'Profiel opgeslagen.' })
              })
            }
          />
        </section>
      )}

      <section className="kaart">
        <h2>Oefentijd per dag</h2>
        <label className="label" htmlFor="sessieduur">
          Hoe lang duurt een sessie ongeveer?
        </label>
        <select
          id="sessieduur"
          className="invoer"
          value={sessieMinuten}
          onChange={(e) => {
            const minuten = Number(e.target.value)
            setSessieMinuten(minuten)
            void echteDb.schrijfMeta('sessieMinuten', minuten)
          }}
        >
          {[8, 10, 12, 15].map((m) => (
            <option key={m} value={m}>
              {m} minuten
            </option>
          ))}
        </select>
        <p className="gedempt">
          De app vult die tijd eerst met herhalingen en daarna met nieuwe woorden, en past zich aan je eigen tempo aan. Voor
          een toets kan het wat langer duren, maar nooit meer dan 15 minuten.
        </p>
      </section>

      <section className="kaart">
        <h2>Geluid</h2>
        <label className="keuze">
          <input
            type="checkbox"
            checked={!geluidUit}
            onChange={(e) => {
              zetGeluidUit(!e.target.checked)
              setGeluidUit(!e.target.checked)
            }}
          />
          Voorlezen met 🔊 aan
        </label>
        <p className="gedempt">De app leest nooit vanzelf voor, alleen als je op 🔊 tikt.</p>
      </section>

      <section className="kaart">
        <h2>Back-up</h2>
        <p>
          Alles staat alleen op deze telefoon. Maak af en toe een back-up, zodat je voortgang niet verloren gaat als de
          telefoon kapot gaat of de gegevens gewist worden.
        </p>
        <p className="gedempt">
          Laatste back-up: {laatsteBackup ? datum(laatsteBackup) : 'nog nooit'}
          <br />
          Opslag:{' '}
          {blijvend === true
            ? '✓ blijvend (de browser wist de gegevens niet zomaar)'
            : blijvend === false
              ? '⚠ niet blijvend: de browser kan de gegevens wissen, dus een back-up is extra belangrijk'
              : 'onbekend'}
        </p>
        {blijvend === false && (
          <button className="link" onClick={() => void vraagBlijvendeOpslag().then(setBlijvend)}>
            Vraag opnieuw om blijvende opslag
          </button>
        )}
        {melding && (
          <p className={`feedback ${melding.fout ? 'feedback-storing' : 'feedback-goed'}`} role="status">
            {melding.tekst}
          </p>
        )}
        <div className="knoppen">
          <button className="knop" onClick={() => void exporteer()}>
            Back-up maken
          </button>
          <label className="knop knop-rustig">
            Back-up terugzetten
            <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={(e) => void importeer(e.target.files)} />
          </label>
        </div>
      </section>

      <section className="kaart">
        <h2>Alles verwijderen</h2>
        <p className="gedempt">Verwijdert alle bronnen, woorden en voortgang van deze telefoon. Dit kan niet ongedaan worden gemaakt.</p>
        {!wissen ? (
          <button className="knop knop-rustig" onClick={() => setWissen(true)}>
            Alles verwijderen…
          </button>
        ) : (
          <>
            <label className="label" htmlFor="wis">
              Weet je het zeker? Typ <strong>{WISWOORD}</strong> om te bevestigen.
            </label>
            <input id="wis" className="invoer" value={wisTekst} onChange={(e) => setWisTekst(e.target.value)} autoComplete="off" />
            <div className="knoppen">
              <button className="knop knop-gevaar" disabled={wisTekst.trim().toUpperCase() !== WISWOORD} onClick={() => void wisAlles()}>
                Definitief verwijderen
              </button>
              <button className="knop knop-rustig" onClick={() => (setWissen(false), setWisTekst(''))}>
                Annuleren
              </button>
            </div>
          </>
        )}
      </section>

      <button className="link" onClick={onTerug}>
        ← Terug
      </button>
    </>
  )
}

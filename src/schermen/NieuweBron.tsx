import { useEffect, useState, type FormEvent } from 'react'
import type { Bron } from '../bronnen/model'
import { VOORNEMEN, type Oefenrichting, type ToetsReflectie } from '../leerlogica'
import { echteDb } from '../opslag/database'
import { PLEKRICHTINGEN } from './TopoBronScherm'

export const RICHTINGEN: { label: string; waarde: Oefenrichting[] }[] = [
  { label: 'Engels → Nederlands', waarde: [{ van: 'en', naar: 'nl' }] },
  { label: 'Nederlands → Engels', waarde: [{ van: 'nl', naar: 'en' }] },
  { label: 'Allebei', waarde: [{ van: 'en', naar: 'nl' }, { van: 'nl', naar: 'en' }] },
]

export function NieuweBron({ onKlaar, onAnnuleer }: { onKlaar: (bronId: string, topo: boolean) => void; onAnnuleer: () => void }) {
  const [naam, setNaam] = useState('')
  const [toetsdag, setToetsdag] = useState('')
  const [richting, setRichting] = useState(0)
  const [soort, setSoort] = useState<'woordenlijst' | 'topo'>('woordenlijst')
  const [plekrichting, setPlekrichting] = useState(0)
  const [voornemen, setVoornemen] = useState<string | null>(null)

  useEffect(() => {
    void echteDb.leesMeta<ToetsReflectie[]>('toetsreflecties', []).then((r) => {
      const laatste = r.at(-1)?.antwoorden.vooruit
      setVoornemen(laatste ? (VOORNEMEN[laatste] ?? null) : null)
    })
  }, [])

  async function bewaar(e: FormEvent) {
    e.preventDefault()
    const bron: Bron = {
      id: crypto.randomUUID(),
      naam: naam.trim(),
      soort,
      taal: 'en',
      toetsdag: toetsdag || null,
      oefenrichtingen: soort === 'topo' ? [] : RICHTINGEN[richting].waarde,
      plekrichtingen: soort === 'topo' ? PLEKRICHTINGEN[plekrichting].waarde : undefined,
      afgerond: false,
      aangemaakt: new Date().toISOString(),
    }
    await echteDb.bronnen.add(bron)
    onKlaar(bron.id, soort === 'topo')
  }

  return (
    <form className="kaart" onSubmit={(e) => void bewaar(e)}>
      <h2>Nieuwe bron</h2>
      <p className="gedempt">Eén bron is de leerstof voor één toets of hoofdstuk. Je kunt er later pagina's bij doen.</p>
      {voornemen && (
        <p className="feedback" role="note">
          📌 Na je vorige toets nam je je voor: <strong>{voornemen}</strong>. Denk daar nu aan!
        </p>
      )}

      <fieldset className="keuzes">
        <legend className="label">Wat voor huiswerk is het?</legend>
        <label className="keuze">
          <input type="radio" name="soort" checked={soort === 'woordenlijst'} onChange={() => setSoort('woordenlijst')} />
          📝 Woordenlijst
        </label>
        <label className="keuze">
          <input type="radio" name="soort" checked={soort === 'topo'} onChange={() => setSoort('topo')} />
          🗺️ Topografie (een kaart)
        </label>
      </fieldset>

      <label className="label" htmlFor="naam">
        Naam
      </label>
      <input
        id="naam"
        className="invoer"
        value={naam}
        onChange={(e) => setNaam(e.target.value)}
        placeholder={soort === 'topo' ? 'Bijvoorbeeld: Topo H2 België en Luxemburg' : 'Bijvoorbeeld: Engels H3'}
        required
        autoFocus
      />

      {soort === 'woordenlijst' ? (
        <>
          <p className="label" style={{ marginTop: '1rem' }}>
            Vak: Engels <span className="gedempt">(andere talen volgen later)</span>
          </p>

          <fieldset className="keuzes">
            <legend className="label">Wat moet je op de toets kunnen?</legend>
            {RICHTINGEN.map((r, i) => (
              <label key={r.label} className="keuze">
                <input type="radio" name="richting" checked={richting === i} onChange={() => setRichting(i)} />
                {r.label}
              </label>
            ))}
          </fieldset>
        </>
      ) : (
        <fieldset className="keuzes">
          <legend className="label">Wat wil je oefenen?</legend>
          {PLEKRICHTINGEN.map((r, i) => (
            <label key={r.label} className="keuze">
              <input type="radio" name="plekrichting" checked={plekrichting === i} onChange={() => setPlekrichting(i)} />
              {r.label}
            </label>
          ))}
        </fieldset>
      )}

      <label className="label" htmlFor="toetsdag">
        Toetsdatum <span className="gedempt">(als je die weet)</span>
      </label>
      <input id="toetsdag" className="invoer" type="date" value={toetsdag} onChange={(e) => setToetsdag(e.target.value)} />

      <div className="knoppen">
        <button className="knop" type="submit" disabled={naam.trim() === ''}>
          Verder: foto's maken
        </button>
        <button className="knop knop-rustig" type="button" onClick={onAnnuleer}>
          Annuleren
        </button>
      </div>
    </form>
  )
}

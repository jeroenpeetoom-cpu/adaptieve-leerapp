import { useState, type FormEvent } from 'react'
import type { Bron } from '../bronnen/model'
import type { Oefenrichting } from '../leerlogica'
import { echteDb } from '../opslag/database'

export const RICHTINGEN: { label: string; waarde: Oefenrichting[] }[] = [
  { label: 'Engels → Nederlands', waarde: [{ van: 'en', naar: 'nl' }] },
  { label: 'Nederlands → Engels', waarde: [{ van: 'nl', naar: 'en' }] },
  { label: 'Allebei', waarde: [{ van: 'en', naar: 'nl' }, { van: 'nl', naar: 'en' }] },
]

export function NieuweBron({ onKlaar, onAnnuleer }: { onKlaar: (bronId: string) => void; onAnnuleer: () => void }) {
  const [naam, setNaam] = useState('')
  const [toetsdag, setToetsdag] = useState('')
  const [richting, setRichting] = useState(0)

  async function bewaar(e: FormEvent) {
    e.preventDefault()
    const bron: Bron = {
      id: crypto.randomUUID(),
      naam: naam.trim(),
      taal: 'en',
      toetsdag: toetsdag || null,
      oefenrichtingen: RICHTINGEN[richting].waarde,
      afgerond: false,
      aangemaakt: new Date().toISOString(),
    }
    await echteDb.bronnen.add(bron)
    onKlaar(bron.id)
  }

  return (
    <form className="kaart" onSubmit={(e) => void bewaar(e)}>
      <h2>Nieuwe bron</h2>
      <p className="gedempt">Eén bron is de leerstof voor één toets of hoofdstuk. Je kunt er later pagina's bij doen.</p>

      <label className="label" htmlFor="naam">
        Naam
      </label>
      <input
        id="naam"
        className="invoer"
        value={naam}
        onChange={(e) => setNaam(e.target.value)}
        placeholder="Bijvoorbeeld: Engels H3"
        required
        autoFocus
      />

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

      <label className="label" htmlFor="toetsdag">
        Toetsdatum <span className="gedempt">(als je die weet)</span>
      </label>
      <input id="toetsdag" className="invoer" type="date" value={toetsdag} onChange={(e) => setToetsdag(e.target.value)} />

      <div className="knoppen">
        <button className="knop" type="submit" disabled={naam.trim() === ''}>
          Verder: foto maken
        </button>
        <button className="knop knop-rustig" type="button" onClick={onAnnuleer}>
          Annuleren
        </button>
      </div>
    </form>
  )
}

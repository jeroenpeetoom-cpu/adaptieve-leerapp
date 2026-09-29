import { useState, type FormEvent } from 'react'
import { LEEFTIJDSGROEPEN, ONDERWIJSNIVEAUS, type Leerling } from '../bronnen/leerling'

interface Props {
  begin?: Leerling
  knoptekst: string
  onBewaar: (leerling: Leerling) => void
}

/** Alleen een bijnaam en onderwijsgegevens: geen echte naam, geboortedatum, school of foto. */
export function ProfielFormulier({ begin, knoptekst, onBewaar }: Props) {
  const [bijnaam, setBijnaam] = useState(begin?.bijnaam ?? '')
  const [leeftijdsgroep, setLeeftijdsgroep] = useState<Leerling['leeftijdsgroep']>(begin?.leeftijdsgroep ?? '8-11')
  const [onderwijsniveau, setOnderwijsniveau] = useState(begin?.onderwijsniveau ?? 'Basisschool')
  const [leerjaar, setLeerjaar] = useState(begin?.leerjaar ?? '')

  function bewaar(e: FormEvent) {
    e.preventDefault()
    onBewaar({
      id: begin?.id ?? crypto.randomUUID(),
      bijnaam: bijnaam.trim(),
      leeftijdsgroep,
      onderwijsniveau,
      leerjaar: leerjaar.trim(),
      stand: 'zelfstandig',
      aangemaakt: begin?.aangemaakt ?? new Date().toISOString(),
    })
  }

  return (
    <form onSubmit={bewaar}>
      <label className="label" htmlFor="bijnaam">
        Hoe wil je genoemd worden? <span className="gedempt">(een bijnaam is prima)</span>
      </label>
      <input id="bijnaam" className="invoer" value={bijnaam} onChange={(e) => setBijnaam(e.target.value)} required maxLength={30} />

      <label className="label" htmlFor="leeftijd" style={{ marginTop: '1rem' }}>
        Leeftijd
      </label>
      <select id="leeftijd" className="invoer" value={leeftijdsgroep} onChange={(e) => setLeeftijdsgroep(e.target.value as Leerling['leeftijdsgroep'])}>
        {LEEFTIJDSGROEPEN.map((g) => (
          <option key={g} value={g}>
            {g} jaar
          </option>
        ))}
      </select>

      <label className="label" htmlFor="niveau" style={{ marginTop: '1rem' }}>
        School
      </label>
      <select id="niveau" className="invoer" value={onderwijsniveau} onChange={(e) => setOnderwijsniveau(e.target.value)}>
        {ONDERWIJSNIVEAUS.map((n) => (
          <option key={n}>{n}</option>
        ))}
      </select>

      <label className="label" htmlFor="leerjaar" style={{ marginTop: '1rem' }}>
        Groep of klas <span className="gedempt">(bijvoorbeeld groep 7)</span>
      </label>
      <input id="leerjaar" className="invoer" value={leerjaar} onChange={(e) => setLeerjaar(e.target.value)} maxLength={20} />

      <div className="knoppen">
        <button className="knop" type="submit" disabled={bijnaam.trim() === ''}>
          {knoptekst}
        </button>
      </div>
    </form>
  )
}

export function Welkom({ onKlaar }: { onKlaar: (leerling: Leerling) => void }) {
  return (
    <section className="kaart">
      <h2>Welkom bij de Woordexpeditie 🚀</h2>
      <ul className="uitleg">
        <li>📷 Je maakt een foto van je woordenlijst. De app leest de woorden en jij controleert ze.</li>
        <li>✍️ Elke dag oefen je een paar woorden. Je typt ze zelf, en als het lastig is krijg je hulp.</li>
        <li>🔁 Woorden die je zelf weet, komen steeds later terug. Zo onthoud je ze voor lang.</li>
        <li>🔒 Alles blijft op deze telefoon. Er gaat niets naar internet.</li>
      </ul>
      <ProfielFormulier knoptekst="Beginnen" onBewaar={onKlaar} />
    </section>
  )
}

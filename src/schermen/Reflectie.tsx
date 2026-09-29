import { useState } from 'react'

export const REFLECTIE_KEUZES = ['Mijn eigen beelden', 'Mijn route', 'Gewoon vaak herhalen', 'De hints', 'Weet ik niet']

/** Eén korte vraag over wat hielp; altijd over te slaan en nooit een bewijs voor voortgang. */
export function ReflectieVraag({ onKies }: { onKies: (tekst: string) => void }) {
  const [gekozen, setGekozen] = useState<string | null>(null)
  const [overgeslagen, setOvergeslagen] = useState(false)
  if (overgeslagen) return null
  if (gekozen) return <p className="gedempt">Bewaard. Bij je volgende nieuwe woorden kun je hieraan terugdenken.</p>
  return (
    <div className="reflectie">
      <p>
        <strong>Wat hielp je vandaag het meest?</strong>
      </p>
      <div className="reflectie-keuzes">
        {REFLECTIE_KEUZES.map((k) => (
          <button
            key={k}
            className="knop knop-rustig"
            onClick={() => {
              setGekozen(k)
              onKies(k)
            }}
          >
            {k}
          </button>
        ))}
      </div>
      <button className="link" onClick={() => setOvergeslagen(true)}>
        Overslaan
      </button>
    </div>
  )
}

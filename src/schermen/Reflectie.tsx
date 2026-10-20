import { useState } from 'react'
import { VOLGENDE_STAPPEN, type Sessiereflectievraag } from '../leerlogica'

/**
 * Na de sessie één korte vraag met bewijs uit eigen werk (spec leren-leren, S4). Wisselt per keer; altijd
 * over te slaan en nooit een bewijs voor voortgang.
 */
export function ReflectieVraag({ vraag, onKies, onOverslaan }: { vraag: Sessiereflectievraag; onKies: (keuze: string) => void; onOverslaan?: () => void }) {
  const [gekozen, setGekozen] = useState<string | null>(null)
  const [overgeslagen, setOvergeslagen] = useState(false)
  if (overgeslagen) return null
  if (gekozen) {
    const stap = VOLGENDE_STAPPEN.find((k) => k.id === gekozen)
    return (
      <p className="gedempt">
        {vraag.variant === 'misging' && stap
          ? `Afgesproken. Als dit woord terugkomt, kijken we of het gelukt is.`
          : 'Bewaard. Bij je volgende nieuwe woorden kun je hieraan terugdenken.'}
      </p>
    )
  }
  return (
    <div className="reflectie">
      <p className="reflectie-vraag">{vraag.vraag}</p>
      <div className="opties-lijst">
        {vraag.keuzes.map((k) => (
          <button
            key={k.id}
            className="knop knop-rustig optie"
            onClick={() => {
              setGekozen(k.id)
              onKies(k.id)
            }}
          >
            {k.tekst}
          </button>
        ))}
      </div>
      <button
        className="link"
        onClick={() => {
          setOvergeslagen(true)
          onOverslaan?.()
        }}
      >
        Overslaan
      </button>
    </div>
  )
}

import { voorspelvraag } from '../leerlogica'

interface Props {
  van: number
  variant: number
  /** De vorige voorspelling met wat er echt uitkwam, om op terug te komen. */
  vorige: { voorspeld: number; uitkomst: number; van: number } | null
  bezig: boolean
  onKies: (aantal: number | null) => void
}

/** Kiesbare aantallen: allemaal als het er weinig zijn, anders in stappen tot en met het totaal. */
function aantallen(van: number): number[] {
  if (van <= 12) return Array.from({ length: van + 1 }, (_, i) => i)
  const stap = Math.ceil(van / 6)
  const lijst: number[] = []
  for (let i = 0; i < van; i += stap) lijst.push(i)
  return [...lijst, van]
}

/** Vooraf voorspellen hoeveel herhalingen de leerling zonder hulp weet (spec leren-leren, S1). */
export function Voorspellen({ van, variant, vorige, bezig, onKies }: Props) {
  return (
    <div className="voorspellen">
      <p className="vraaglabel">
        <span className="chip">🔮 eerst voorspellen</span>
      </p>
      {vorige && (
        <p className="gedempt voorspellen-vorige">
          Vorige keer dacht je {vorige.voorspeld} van de {vorige.van}, en het werden er {vorige.uitkomst}.
        </p>
      )}
      <p className="vraag voorspellen-vraag">{voorspelvraag(variant, van)}</p>
      <div className="getallen">
        {aantallen(van).map((n) => (
          <button key={n} className="knop knop-rustig getal" disabled={bezig} onClick={() => onKies(n)}>
            {n}
          </button>
        ))}
      </div>
      <p className="tekstlinks">
        <button className="link" disabled={bezig} onClick={() => onKies(null)}>
          Overslaan
        </button>
      </p>
    </div>
  )
}

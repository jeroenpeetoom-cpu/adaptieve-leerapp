import { useState, type ReactNode } from 'react'
import { Voorleesknop } from '../weergave/voorlezen'

export interface Minivraag {
  vraag: string
  opties: { tekst: string; goed: boolean }[]
  /** Wat er oplicht na een fout antwoord, zodat het kind het in de uitleg terugvindt. */
  hint: string
}

/** Zet **kern** in een tekst om in een markering: alleen wat ertoe doet valt op (signalering). */
function metKern(tekst: string): ReactNode[] {
  return tekst.split('**').map((deel, i) => (i % 2 === 1 ? <mark key={i} className="kern">{deel}</mark> : <span key={i}>{deel}</span>))
}

/**
 * Eén stap van een uitleg (spec layout, uitleg verwerken). Eén idee per scherm: het beeld groot, hooguit twee
 * korte zinnen met het kernwoord gemarkeerd, en een mini-vraag. "Verder" komt pas na een goed antwoord, zodat
 * het kind de uitleg leest en meteen gebruikt in plaats van door te tikken. Een fout is geen straf: de hint
 * licht op en het kind probeert opnieuw.
 */
export function Uitlegstap({
  stap,
  totaal,
  titel,
  beeld,
  tekst,
  vraag,
  opdracht,
  knop = 'Verder',
  onVerder,
}: {
  stap: number
  totaal: number
  titel: string
  beeld?: ReactNode
  tekst: string
  vraag?: Minivraag
  /** In plaats van een keuzevraag: iets doen in het beeld, zoals op het goede vakje tikken. */
  opdracht?: (klaar: () => void) => ReactNode
  knop?: string
  onVerder: () => void
}) {
  const [gekozen, setGekozen] = useState<number | null>(null)
  const [opdrachtKlaar, setOpdrachtKlaar] = useState(false)
  const goed = vraag ? gekozen !== null && vraag.opties[gekozen].goed : opdracht ? opdrachtKlaar : true
  const fout = vraag && gekozen !== null && !vraag.opties[gekozen].goed

  return (
    <div className="uitlegstap">
      <div className="stippen" aria-label={`Stap ${stap + 1} van ${totaal}`}>
        {Array.from({ length: totaal }, (_, i) => (
          <span key={i} className={i <= stap ? 'stip-aan' : ''} aria-hidden="true">
            ●
          </span>
        ))}
      </div>
      <h3>{titel}</h3>
      {beeld && <div className="uitleg-beeld">{beeld}</div>}
      <p className="uitleg-tekst">
        {metKern(tekst)} <Voorleesknop tekst={tekst.replaceAll('**', '')} taal="nl" />
      </p>
      {opdracht && opdracht(() => setOpdrachtKlaar(true))}
      {vraag && (
        <div className="minivraag">
          <p className="minivraag-vraag">🤔 {vraag.vraag}</p>
          <div className="opties-lijst">
            {vraag.opties.map((o, i) => (
              <button
                key={o.tekst}
                className={`knop knop-rustig optie ${gekozen === i ? (o.goed ? 'uitleg-goed' : 'uitleg-mis') : ''}`}
                disabled={goed}
                onClick={() => setGekozen(i)}
              >
                {o.tekst}
              </button>
            ))}
          </div>
          {fout && <p className="feedback feedback-bijna">💡 {vraag.hint} Probeer het nog eens.</p>}
        </div>
      )}
      {goed && (
        <button className="knop knop-breed" autoFocus onClick={onVerder}>
          {knop}
        </button>
      )}
    </div>
  )
}

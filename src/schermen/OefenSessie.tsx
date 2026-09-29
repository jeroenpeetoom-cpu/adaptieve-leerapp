import { useRef, useState, type FormEvent } from 'react'
import {
  beantwoord,
  huidigLeeritem,
  isKlaar,
  startSessie,
  volgende,
  wachtOpVolgende,
  type Leeritem,
  type Poging,
} from '../leerlogica'
import type { Database } from '../opslag/database'

const TAALNAAM = { en: 'Engels', nl: 'Nederlands' } as const

const FEEDBACK: Record<Poging['oordeel'], string> = {
  goed: 'Goed zo, dat wist je zelf!',
  bijna: 'Bijna! Kijk nog eens goed naar de letters.',
  fout: 'Dat is het niet.',
  'niet geweten': 'Geeft niet, dit woord komt terug.',
}

interface Props {
  db: Database
  leeritems: Leeritem[]
  onKlaar: () => void
}

export function OefenSessie({ db, leeritems, onKlaar }: Props) {
  const [toestand, setToestand] = useState(() => startSessie(crypto.randomUUID(), leeritems))
  const [antwoord, setAntwoord] = useState('')
  const [storing, setStoring] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)
  const invoerRef = useRef<HTMLInputElement>(null)

  // Vast id per volgende poging in deze sessie: dubbel tikken geeft hetzelfde id en telt dus niet dubbel.
  const pogingId = `${toestand.sessieId}-${toestand.pogingen.length + 1}`

  if (isKlaar(toestand)) {
    const goed = toestand.pogingen.filter((p) => p.oordeel === 'goed' && p.hulp === 'vrij opgehaald')
    return (
      <section className="kaart">
        <h2>Klaar!</h2>
        <p>
          Je hebt {toestand.leeritems.length} woorden geoefend. {goed.length} wist je meteen zelf.
        </p>
        <button className="knop" onClick={onKlaar}>
          Terug naar het begin
        </button>
      </section>
    )
  }

  const item = huidigLeeritem(toestand)!
  const afgesloten = wachtOpVolgende(toestand)
  const laatste = toestand.pogingen.at(-1)
  const laatsteHoortHierbij = laatste?.leeritemId === item.id

  async function verstuur(tekst: string | null) {
    if (bezig) return
    const uitkomst = beantwoord(toestand, {
      pogingId,
      antwoord: tekst,
      tijdstip: new Date().toISOString(),
    })
    if (!uitkomst.poging) return
    setBezig(true)
    try {
      await db.slaPogingOp(uitkomst.poging)
      setStoring(null)
      setToestand(uitkomst.toestand)
      setAntwoord('')
    } catch {
      // Een storing is nooit een poging: de toestand blijft zoals hij was en de leerling kan opnieuw.
      setStoring('Opslaan lukte even niet. Probeer het nog een keer.')
    } finally {
      setBezig(false)
      invoerRef.current?.focus()
    }
  }

  function controleer(e: FormEvent) {
    e.preventDefault()
    void verstuur(antwoord)
  }

  function naarVolgende() {
    setToestand(volgende(toestand))
    setTimeout(() => invoerRef.current?.focus())
  }

  return (
    <section className="kaart">
      <p className="voortgang">
        Woord {toestand.huidige + 1} van {toestand.leeritems.length}
      </p>
      <p className="richting">
        {TAALNAAM[item.oefenrichting.van]} → {TAALNAAM[item.oefenrichting.naar]}
      </p>
      <p className="vraag" lang={item.oefenrichting.van}>
        {item.vraag}
      </p>

      {laatsteHoortHierbij && (
        <p className={`feedback feedback-${laatste!.oordeel.replace(' ', '-')}`} role="status">
          {FEEDBACK[laatste!.oordeel]}
          {afgesloten && laatste!.oordeel !== 'goed' && (
            <>
              {' '}
              Het goede antwoord is <strong lang={item.oefenrichting.naar}>{item.toegestaneAntwoorden[0]}</strong>.
            </>
          )}
        </p>
      )}

      {storing && (
        <p className="feedback feedback-storing" role="alert">
          {storing}
        </p>
      )}

      {afgesloten ? (
        <button className="knop" onClick={naarVolgende} autoFocus>
          Volgende
        </button>
      ) : (
        <form onSubmit={controleer}>
          <label className="label" htmlFor="antwoord">
            Wat betekent dit in het {TAALNAAM[item.oefenrichting.naar]}?
          </label>
          <input
            id="antwoord"
            ref={invoerRef}
            className="invoer"
            value={antwoord}
            onChange={(e) => setAntwoord(e.target.value)}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            lang={item.oefenrichting.naar}
            autoFocus
          />
          <div className="knoppen">
            <button className="knop" type="submit" disabled={bezig || antwoord.trim() === ''}>
              Controleer
            </button>
            <button className="knop knop-rustig" type="button" disabled={bezig} onClick={() => void verstuur(null)}>
              Weet ik niet
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

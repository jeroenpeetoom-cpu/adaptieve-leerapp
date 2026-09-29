import { useRef, useState, type FormEvent } from 'react'
import {
  beantwoord,
  huidigLeeritem,
  isKlaar,
  nogTeGaan,
  volgende,
  wachtOpVolgende,
  type Poging,
  type SessieToestand,
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
  begintoestand: SessieToestand
  /** De huidige tijd; in de testfunctie komt die van de instelbare klok. */
  nu: () => string
  onKlaar: (toestand: SessieToestand) => void
}

export function OefenSessie({ db, begintoestand, nu, onKlaar }: Props) {
  const [toestand, setToestand] = useState(begintoestand)
  const [antwoord, setAntwoord] = useState('')
  const [storing, setStoring] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)
  const invoerRef = useRef<HTMLInputElement>(null)

  // Vast id per volgende poging in deze sessie: dubbel tikken geeft hetzelfde id en telt dus niet dubbel.
  const pogingId = `${toestand.sessieId}-${toestand.pogingen.length + 1}`

  const item = huidigLeeritem(toestand)!
  const afgesloten = wachtOpVolgende(toestand)
  const laatste = toestand.pogingen.at(-1)
  const laatsteHoortHierbij = laatste?.leeritemId === item.id

  async function verstuur(tekst: string | null) {
    if (bezig) return
    const tijdstip = nu()
    const uitkomst = beantwoord(toestand, { pogingId, antwoord: tekst, tijdstip })
    if (!uitkomst.poging) return
    setBezig(true)
    try {
      await db.slaPogingOp(uitkomst.poging)
      await db.slaSessieOp(uitkomst.toestand, false, tijdstip)
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

  async function naarVolgende() {
    const nieuw = volgende(toestand)
    const klaar = isKlaar(nieuw)
    try {
      await db.slaSessieOp(nieuw, klaar, nu())
    } catch {
      // De pogingen zelf zijn al opgeslagen; alleen de plek in de sessie kan verloren gaan.
    }
    if (klaar) return onKlaar(nieuw)
    setToestand(nieuw)
    setTimeout(() => invoerRef.current?.focus())
  }

  return (
    <section className="kaart">
      <p className="voortgang">
        {nogTeGaan(toestand) === 1 ? 'Laatste woord' : `Nog ${nogTeGaan(toestand)} woorden`}
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
        <button className="knop" onClick={() => void naarVolgende()} autoFocus>
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

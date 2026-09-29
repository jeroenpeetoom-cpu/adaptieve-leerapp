import { useRef, useState, type FormEvent } from 'react'
import {
  beantwoord,
  hintVoor,
  huidigLeeritem,
  isKlaar,
  isNieuwLeeritem,
  kanAntwoordToevoegen,
  koppelStrategie,
  laatstePogingHier,
  leermomentNodig,
  nogTeGaan,
  optiesVoor,
  voegAntwoordToe,
  volgende,
  vraagHulp,
  type Leeritem,
  type Poging,
  type SessieToestand,
  type Strategie,
} from '../leerlogica'
import type { Geheugenbeeld } from '../bronnen/model'
import type { RouteStand } from '../bronnen/routes'
import type { Database } from '../opslag/database'
import { Voorleesknop } from '../weergave/voorlezen'
import { Leermoment } from './Leermoment'

const TAALNAAM = { en: 'Engels', nl: 'Nederlands' } as const

interface Props {
  db: Database
  begintoestand: SessieToestand
  /** Alle leeritems van de bron, voor de opties bij meerkeuze. */
  bronItems: Leeritem[]
  /** De huidige tijd; in de testfunctie komt die van de instelbare klok. */
  nu: () => string
  onAntwoordToegevoegd: (leeritemId: string, antwoord: string) => Promise<void>
  onKlaar: (toestand: SessieToestand) => void
  /** Beschrijving van het eigen geheugenbeeld per leeritem, voor de hint. */
  geheugenbeelden: Record<string, string>
  strategiePerBron: Record<string, Strategie | 'geen'>
  voorgedaan: Strategie[]
  onKiesStrategie: (bronId: string, strategie: Strategie | 'geen') => Promise<void>
  onVoorgedaan: (strategie: Strategie) => Promise<void>
  onGeheugenbeeld: (beeld: Omit<Geheugenbeeld, 'id' | 'aangemaakt'>) => Promise<void>
  routeVoor: (bronId: string) => RouteStand | null
  routenaamVoor: (bronId: string) => string
  onMaakRoute: (bronId: string, naam: string, plekken: string[]) => Promise<void>
  /** Wat de leerling vorige keer zei dat hielp, om bij een nieuwe strategiekeuze terug te geven. */
  laatsteReflectie: string | null
}

/** Korte feedback (één of twee zinnen) en optioneel een langere uitleg. */
function feedbackVoor(poging: Poging, afgesloten: boolean, goedAntwoord: string, item: Leeritem, beeld?: string) {
  if (poging.oordeel === 'goed') {
    if (poging.antwoordZelfToegevoegd)
      return {
        kort: 'Toegevoegd! Dit antwoord telt voortaan als goed. Het woord komt snel terug, dan tel ik het mee.',
        uitleg: 'Een antwoord dat je zelf toevoegt, telt deze keer nog niet als zelf teruggehaald. Zo blijft je voortgang eerlijk.',
      }
    if (poging.hulp === 'vrij opgehaald') return { kort: 'Goed zo, dat wist je helemaal zelf!', uitleg: null }
    return {
      kort: 'Goed! Je had er wel hulp bij, dus het komt snel terug.',
      uitleg: 'Alleen als je een woord zonder hulp weet, komt het steeds later terug. Met hulp oefen je het nog even vaker.',
    }
  }
  if (!afgesloten) {
    return poging.oordeel === 'bijna'
      ? { kort: 'Bijna! Kijk nog eens goed naar de letters.', uitleg: null }
      : { kort: `Dat is het niet. Hint: ${hintVoor(item, beeld)}`, uitleg: 'Probeer het nog één keer. Lukt het niet, dan krijg je het antwoord te zien.' }
  }
  if (poging.oordeel === 'niet geweten')
    return { kort: `Geeft niet. Het antwoord is "${goedAntwoord}". Het komt straks terug.`, uitleg: null }
  return {
    kort: `Het goede antwoord is "${goedAntwoord}". Het komt straks terug.`,
    uitleg: 'Straks krijg je dit woord nog een keer, dan kies je uit een paar opties.',
  }
}

export function OefenSessie({
  db,
  begintoestand,
  bronItems,
  nu,
  onAntwoordToegevoegd,
  onKlaar,
  geheugenbeelden,
  strategiePerBron,
  voorgedaan,
  onKiesStrategie,
  onVoorgedaan,
  onGeheugenbeeld,
  routeVoor,
  routenaamVoor,
  onMaakRoute,
  laatsteReflectie,
}: Props) {
  const [toestand, setToestand] = useState(begintoestand)
  const [antwoord, setAntwoord] = useState('')
  const [storing, setStoring] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)
  const [hulpOpen, setHulpOpen] = useState(false)
  const invoerRef = useRef<HTMLInputElement>(null)

  // Vast id per volgende poging in deze sessie: dubbel tikken geeft hetzelfde id en telt dus niet dubbel.
  const pogingId = `${toestand.sessieId}-${toestand.pogingen.length + 1}`

  const item = huidigLeeritem(toestand)!
  const laatste = laatstePogingHier(toestand)
  const goedAntwoord = item.toegestaneAntwoorden[0]
  const taal = TAALNAAM[item.oefenrichting.naar]

  async function bewaar(nieuw: SessieToestand, poging: Poging | null, tijdstip: string) {
    setBezig(true)
    try {
      if (poging) await db.slaPogingOp(poging)
      await db.slaSessieOp(nieuw, isKlaar(nieuw), tijdstip)
      setStoring(null)
      return true
    } catch {
      // Een storing is nooit een poging: de toestand blijft zoals hij was en de leerling kan opnieuw.
      setStoring('Opslaan lukte even niet. Probeer het nog een keer.')
      return false
    } finally {
      setBezig(false)
    }
  }

  async function verstuur(tekst: string | null) {
    if (bezig) return
    const tijdstip = nu()
    const uitkomst = beantwoord(toestand, { pogingId, antwoord: tekst, tijdstip })
    if (!uitkomst.poging) return
    if (await bewaar(uitkomst.toestand, uitkomst.poging, tijdstip)) {
      setToestand(uitkomst.toestand)
      setAntwoord('')
      setHulpOpen(false)
    }
    invoerRef.current?.focus()
  }

  async function ookGoed() {
    const uitkomst = voegAntwoordToe(toestand)
    if (!uitkomst.poging) return
    const tijdstip = nu()
    if (await bewaar(uitkomst.toestand, uitkomst.poging, tijdstip)) {
      await onAntwoordToegevoegd(uitkomst.poging.leeritemId, uitkomst.poging.antwoord!)
      setToestand(uitkomst.toestand)
    }
  }

  function hulp(soort: 'met hint' | 'herkend' | 'na voorbeeld') {
    setToestand(vraagHulp(toestand, soort))
    setHulpOpen(false)
    setTimeout(() => invoerRef.current?.focus())
  }

  async function naarVolgende() {
    const nieuw = volgende(toestand)
    await bewaar(nieuw, null, nu())
    if (isKlaar(nieuw)) return onKlaar(nieuw)
    setToestand(nieuw)
    setTimeout(() => invoerRef.current?.focus())
  }

  function controleer(e: FormEvent) {
    e.preventDefault()
    void verstuur(antwoord)
  }

  const beeld = geheugenbeelden[item.id]
  const feedback = laatste ? feedbackVoor(laatste, toestand.afgesloten, goedAntwoord, item, beeld) : null
  const leermoment = leermomentNodig(toestand)

  async function leermomentKlaar(nieuwBeeld: Omit<Geheugenbeeld, 'id' | 'aangemaakt'> | null) {
    let volgendeToestand = toestand
    if (nieuwBeeld) {
      await onGeheugenbeeld(nieuwBeeld)
      volgendeToestand = koppelStrategie(toestand, item.id, nieuwBeeld.routeId ? 'geheugenroute' : 'beelden koppelen')
    }
    setToestand(volgendeToestand)
    const nieuw = volgende(volgendeToestand)
    await bewaar(nieuw, null, nu())
    if (isKlaar(nieuw)) return onKlaar(nieuw)
    setToestand(nieuw)
    setTimeout(() => invoerRef.current?.focus())
  }
  const hintZichtbaar = !toestand.afgesloten && toestand.hulp === 'met hint' && !laatste
  const voorbeeldZichtbaar = !toestand.afgesloten && toestand.hulp === 'na voorbeeld'

  return (
    <section className="kaart">
      <p className="voortgang">
        {nogTeGaan(toestand) === 1 ? 'Laatste woord' : `Nog ${nogTeGaan(toestand)} woorden`}
      </p>
      <p className="richting">
        {TAALNAAM[item.oefenrichting.van]} → {taal}
      </p>
      {isNieuwLeeritem(toestand, item.id) && !laatste && !toestand.pogingen.some((p) => p.leeritemId === item.id) && (
        <p className="nieuw-label">✨ Nieuw woord. Weet je het al? Anders tik je op "Weet ik niet".</p>
      )}
      <p className="vraag" lang={item.oefenrichting.van}>
        {item.vraag} <Voorleesknop tekst={item.vraag} taal={item.oefenrichting.van} />
      </p>

      {feedback && (
        <div className={`feedback feedback-${laatste!.oordeel.replace(' ', '-')}`} role="status">
          <p>
            {feedback.kort}
            {toestand.afgesloten && <Voorleesknop tekst={goedAntwoord} taal={item.oefenrichting.naar} />}
          </p>
          {feedback.uitleg && (
            <details>
              <summary>Waarom?</summary>
              <p>{feedback.uitleg}</p>
            </details>
          )}
        </div>
      )}

      {hintZichtbaar && (
        <p className="feedback" role="status">
          Hint: {hintVoor(item, beeld)}
        </p>
      )}
      {voorbeeldZichtbaar && (
        <p className="feedback" role="status">
          Het antwoord is <strong lang={item.oefenrichting.naar}>{goedAntwoord}</strong>. Typ het over, dan onthoud je het beter.
        </p>
      )}

      {storing && (
        <p className="feedback feedback-storing" role="alert">
          {storing}
        </p>
      )}

      {kanAntwoordToevoegen(toestand) && (
        <button className="link" disabled={bezig} onClick={() => void ookGoed()}>
          Mijn antwoord "{laatste!.antwoord}" was ook goed
        </button>
      )}

      {leermoment ? (
        <Leermoment
          key={item.id}
          item={item}
          strategie={strategiePerBron[item.bronId]}
          voorgedaan={voorgedaan}
          route={routeVoor(item.bronId)}
          routenaam={routenaamVoor(item.bronId)}
          itemTekst={(id) => {
            const i = bronItems.find((x) => x.id === id)
            return i ? `${i.vraag} = ${i.toegestaneAntwoorden[0]}` : ''
          }}
          onKiesStrategie={(s) => void onKiesStrategie(item.bronId, s)}
          onVoorgedaan={(s) => void onVoorgedaan(s)}
          onMaakRoute={(naam, plekken) => void onMaakRoute(item.bronId, naam, plekken)}
          laatsteReflectie={laatsteReflectie}
          onKlaar={(b) => void leermomentKlaar(b)}
        />
      ) : toestand.afgesloten ? (
        <button className="knop" onClick={() => void naarVolgende()} autoFocus>
          Volgende
        </button>
      ) : toestand.vorm === 'meerkeuze' ? (
        <>
          <p className="label">Welk {taal}e woord hoort erbij?</p>
          <div className="opties">
            {optiesVoor(item, bronItems, `${pogingId}-${item.id}`).map((optie) => (
              <button key={optie} className="knop knop-rustig optie" disabled={bezig} onClick={() => void verstuur(optie)} lang={item.oefenrichting.naar}>
                {optie}
              </button>
            ))}
          </div>
          <button className="link" disabled={bezig} onClick={() => void verstuur(null)}>
            Weet ik niet
          </button>
        </>
      ) : (
        <form onSubmit={controleer}>
          <label className="label" htmlFor="antwoord">
            Wat is het in het {taal}?
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
            <button
              className="knop knop-rustig"
              type="button"
              aria-expanded={hulpOpen}
              disabled={bezig || toestand.hulp === 'na voorbeeld'}
              onClick={() => setHulpOpen(!hulpOpen)}
            >
              Hulp
            </button>
          </div>
          {hulpOpen && (
            <div className="hulpmenu" role="group" aria-label="Kies hulp">
              <button type="button" className="knop knop-rustig" onClick={() => hulp('met hint')} disabled={toestand.hulp !== 'vrij opgehaald'}>
                Geef een hint
              </button>
              <button type="button" className="knop knop-rustig" onClick={() => hulp('herkend')}>
                Laat me kiezen uit opties
              </button>
              <button type="button" className="knop knop-rustig" onClick={() => hulp('na voorbeeld')}>
                Laat het antwoord zien
              </button>
            </div>
          )}
        </form>
      )}
    </section>
  )
}

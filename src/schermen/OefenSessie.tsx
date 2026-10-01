import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  SOORTEN,
  ankerhint,
  ankerzin,
  beantwoord,
  kiesAnkers,
  bepaalAntwoordwijze,
  berekenVoortgang,
  kalenderdag,
  beoordeel,
  beschrijfVerschil,
  dichtstbijzijnde,
  hintVoor,
  markeerVerschil,
  verschilfeedback,
  type Teken,
  huidigLeeritem,
  isKlaar,
  isNieuwLeeritem,
  kanAntwoordToevoegen,
  koppelStrategie,
  laatstePogingHier,
  leermomentNodig,
  nogTeGaan,
  optiesVoor,
  raad,
  raadvraagNodig,
  voegAntwoordToe,
  volgende,
  vraagHulp,
  type Leeritem,
  type Instellingen,
  type Poging,
  type SessieToestand,
  type Strategie,
} from '../leerlogica'
import type { Geheugenbeeld, Kaart } from '../bronnen/model'
import type { RouteStand } from '../bronnen/routes'
import type { Database } from '../opslag/database'
import { CodewoordMelding, MISSIE, Sterrenkaart } from '../weergave/ruimte'
import { Voorleesknop } from '../weergave/voorlezen'
import { Aanwijzen } from './Aanwijzen'
import { KaartUitsnede } from './KaartUitsnede'
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
  /** Aantal geheugenbeelden per strategie tot nu toe, voor het afbouwen van het steuntje. */
  aantalBeelden: Record<Strategie, number>
  beeldenMetSteuntje: number
  /** Alle pogingen van vóór deze sessie, om te bepalen of de leerling mag zeggen of moet typen. */
  eerderePogingen: Poging[]
  instellingen: Instellingen
  /** De kaarten van topo-bronnen, voor aanwijzen. */
  kaarten: Record<string, Kaart>
}

/** Na zoveel milliseconden stilte wordt een ingesproken antwoord vanzelf gecontroleerd. */
const WACHT_NA_INSPREKEN = 700

/**
 * Korte feedback (één of twee zinnen), optioneel een langere uitleg, en na de laatste poging het eigen
 * antwoord naast het goede met het verschil gemarkeerd. Bij een nieuw woord zegt de feedback wat klopt
 * en waar het misgaat; bij een bekend woord eerst alleen wat voor fout het is.
 */
function feedbackVoor(poging: Poging, afgesloten: boolean, goedAntwoord: string, item: Leeritem, bekend: boolean, beeld?: string) {
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
  if (poging.oordeel === 'niet geweten' || poging.antwoord === null)
    return { kort: `Geeft niet. Het antwoord is "${goedAntwoord}". Het komt straks terug.`, uitleg: null }

  const goed = dichtstbijzijnde(poging.antwoord, item.toegestaneAntwoorden)
  const verschil = verschilfeedback(beschrijfVerschil(poging.antwoord, goed), bekend)
  if (!afgesloten) {
    return poging.oordeel === 'bijna'
      ? { kort: `Bijna! ${verschil ?? 'Kijk nog eens goed naar de letters.'}`, uitleg: null }
      : {
          kort: `Dat is het niet. ${verschil ? `${verschil} ` : ''}Hint: ${hintVoor(item, beeld)}`,
          uitleg: 'Probeer het nog één keer. Lukt het niet, dan krijg je het antwoord te zien.',
        }
  }
  return {
    kort: `Het goede antwoord is "${goedAntwoord}". Het komt straks terug.`,
    uitleg: 'Straks krijg je dit woord nog een keer, dan kies je uit een paar opties.',
    vergelijk: markeerVerschil(poging.antwoord, goed),
  }
}

/** Een antwoord met de letters die niet kloppen gemarkeerd. */
function Gemarkeerd({ tekens, soort }: { tekens: Teken[]; soort: 'fout' | 'mist' }) {
  return (
    <span className="gemarkeerd">
      {tekens.map((t, i) =>
        t.klopt ? <span key={i}>{t.teken}</span> : <mark key={i} className={`letter-${soort}`}>{t.teken}</mark>,
      )}
    </span>
  )
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
  aantalBeelden,
  beeldenMetSteuntje,
  eerderePogingen,
  instellingen,
  kaarten,
}: Props) {
  const [toestand, setToestand] = useState(begintoestand)
  const [antwoord, setAntwoord] = useState('')
  const [storing, setStoring] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)
  const [hulpOpen, setHulpOpen] = useState(false)
  const invoerRef = useRef<HTMLInputElement>(null)
  const insprekenTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sessieRef = useRef<HTMLElement>(null)

  // Bij elk nieuw leeritem naar de bovenkant van de vraag, en pas daarna het invulveld selecteren zonder
  // te scrollen; anders schuift de browser de vraag weg zodra het toetsenbord opengaat.
  useEffect(() => {
    sessieRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' })
    const t = setTimeout(() => invoerRef.current?.focus({ preventScroll: true }), 150)
    return () => clearTimeout(t)
  }, [toestand.huidige])
  const ingesprokenRef = useRef(false)
  const [typMelding, setTypMelding] = useState(false)

  // Vast id per volgende poging in deze sessie: dubbel tikken geeft hetzelfde id en telt dus niet dubbel.
  const pogingId = `${toestand.sessieId}-${toestand.pogingen.length + 1}`

  const item = huidigLeeritem(toestand)!
  const benoemen = item.plek?.richting === 'benoemen'
  const benoemKaart = item.plek ? kaarten[item.plek.kaartId] : undefined
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

  async function verstuur(tekst: string | null, ingesproken = false, vooraf?: Poging['oordeel'], basis = toestand) {
    if (bezig) return
    if (insprekenTimer.current) clearTimeout(insprekenTimer.current)
    ingesprokenRef.current = false
    setTypMelding(false)
    const tijdstip = nu()
    const uitkomst = beantwoord(basis, { pogingId, antwoord: tekst, tijdstip, ingesproken, oordeel: vooraf })
    if (!uitkomst.poging) return
    if (await bewaar(uitkomst.toestand, uitkomst.poging, tijdstip)) {
      setToestand(uitkomst.toestand)
      setAntwoord('')
      setHulpOpen(false)
    }
    invoerRef.current?.focus({ preventScroll: true })
  }

  /** De gok op de raadvraag. Goed gegokt: nu zonder opties. Anders kende hij het nog niet: het leermoment volgt. */
  async function gok(optie: string | null) {
    const goedGegokt = optie !== null && beoordeel(optie, item.toegestaneAntwoorden, item.soort === 'plek') === 'goed'
    const na = raad(toestand, goedGegokt)
    if (goedGegokt) {
      setToestand(na)
      setTimeout(() => invoerRef.current?.focus({ preventScroll: true }))
    } else await verstuur(null, false, undefined, na)
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
    setTimeout(() => invoerRef.current?.focus({ preventScroll: true }))
  }

  async function naarVolgende() {
    const nieuw = volgende(toestand)
    await bewaar(nieuw, null, nu())
    if (isKlaar(nieuw)) return onKlaar(nieuw)
    setToestand(nieuw)
    setTimeout(() => invoerRef.current?.focus({ preventScroll: true }))
  }

  function controleer(e: FormEvent) {
    e.preventDefault()
    void verstuur(antwoord, ingesprokenRef.current)
  }

  // Zeggen of typen: opbouw per woord (spec inspreken, vraag 38).
  const eerderHier = toestand.pogingen.slice(0, toestand.pogingen.length - toestand.pogingenBijHuidige)
  const voorDezePositie = [...eerderePogingen.filter((p) => !toestand.pogingen.some((q) => q.id === p.id)), ...eerderHier]
  const vandaag = kalenderdag(nu(), instellingen.tijdzone)
  const eersteVanDeDag = !voorDezePositie.some(
    (p) => p.leeritemId === item.id && kalenderdag(p.tijdstip, instellingen.tijdzone) === vandaag,
  )
  const wijze = bepaalAntwoordwijze(item, berekenVoortgang(item, voorDezePositie, instellingen).status, eersteVanDeDag)

  // Ankers: steden op dezelfde kaart die de leerling al zelf heeft teruggehaald (spec topografie, vraag 47).
  const plekKaart = item.plek ? kaarten[item.plek.kaartId] : undefined
  const ankers = (() => {
    if (!item.plek || !plekKaart) return []
    const bekend = new Map<string, { naam: string; x: number; y: number }>()
    for (const i of bronItems) {
      if (!i.plek || i.plek.kaartId !== item.plek.kaartId || i.plek.soort !== 'stad' || i.woordpaarId === item.woordpaarId) continue
      if (berekenVoortgang(i, voorDezePositie, instellingen).status === 'nog aan het leren') continue
      bekend.set(i.woordpaarId, { naam: i.toegestaneAntwoorden[0], x: i.plek.x, y: i.plek.y })
    }
    return kiesAnkers({ naam: item.toegestaneAntwoorden[0], x: item.plek.x, y: item.plek.y }, [...bekend.values()], plekKaart.hoogte / plekKaart.breedte)
  })()
  const topoLeermoment = (onKlaarBeeld: (b: Omit<Geheugenbeeld, 'id' | 'aangemaakt'> | null) => void) =>
    item.plek && plekKaart ? (
      <Leermoment
        key={item.id}
        item={item}
        strategie={(() => {
          const s = strategiePerBron[item.bronId]
          return s === 'geheugenroute' ? 'beelden koppelen' : s
        })()}
        voorgedaan={voorgedaan}
        route={null}
        routenaam=""
        itemTekst={() => ''}
        onKiesStrategie={(s) => void onKiesStrategie(item.bronId, s)}
        onVoorgedaan={(s) => void onVoorgedaan(s)}
        onMaakRoute={() => {}}
        laatsteReflectie={laatsteReflectie}
        steuntjeOpen={aantalBeelden['beelden koppelen'] < beeldenMetSteuntje}
        topo={{ kaart: plekKaart, plek: item.plek, ankerzin: ankerzin(item.toegestaneAntwoorden[0], ankers), bestaandBeeld: geheugenbeelden[item.id] ?? null }}
        onKlaar={onKlaarBeeld}
      />
    ) : null

  /** Een woord dat in één keer binnenkomt (en niet letter voor letter) is ingesproken of geplakt. */
  function opInvoer(nieuw: string) {
    const ingesproken = nieuw.trim().length - antwoord.trim().length >= 2
    if (insprekenTimer.current) clearTimeout(insprekenTimer.current)
    if (ingesproken && wijze === 'typen') {
      setAntwoord('')
      setTypMelding(true)
      return
    }
    setAntwoord(nieuw)
    if (ingesproken) {
      ingesprokenRef.current = true
      setTypMelding(false)
      insprekenTimer.current = setTimeout(() => void verstuur(nieuw, true), WACHT_NA_INSPREKEN)
    }
  }

  const codewoorden = toestand.pogingen.filter(
    (p) => p.oordeel === 'goed' && p.hulp === 'vrij opgehaald' && !p.antwoordZelfToegevoegd,
  ).length
  const vondCodewoord =
    toestand.afgesloten && laatste?.oordeel === 'goed' && laatste.hulp === 'vrij opgehaald' && !laatste.antwoordZelfToegevoegd
  const beeld = geheugenbeelden[item.id]
  const bekend = eerderePogingen.some(
    (p) => p.leeritemId === item.id && p.oordeel === 'goed' && p.hulp === 'vrij opgehaald' && !p.antwoordZelfToegevoegd,
  )
  const foutGegokt = toestand.geraden?.[item.id] === false && laatste?.oordeel === 'niet geweten'
  const feedback = !laatste
    ? null
    : foutGegokt
      ? { kort: `Nu weet je het! Het is "${goedAntwoord}".`, uitleg: null }
      : feedbackVoor(laatste, toestand.afgesloten, goedAntwoord, item, bekend, beeld)
  const raadOpties = optiesVoor(item, bronItems, `raad-${item.id}`)
  const raden = raadvraagNodig(toestand) && raadOpties.length >= 2
  const goedGegokt = toestand.geraden?.[item.id] === true && !laatste && !toestand.afgesloten
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
    setTimeout(() => invoerRef.current?.focus({ preventScroll: true }))
  }
  const hintZichtbaar = !toestand.afgesloten && toestand.hulp === 'met hint' && !laatste
  const voorbeeldZichtbaar = !toestand.afgesloten && toestand.hulp === 'na voorbeeld'

  if (item.soort === 'plek' && item.plek && item.plek.richting === 'aanwijzen') {
    const kaart = kaarten[item.plek.kaartId]
    return (
      <section className="kaart sessie" ref={sessieRef}>
        <Sterrenkaart
          totaal={toestand.leeritems.length}
          gedaan={toestand.huidige + (toestand.afgesloten ? 1 : 0)}
          codewoorden={codewoorden}
          sprong={vondCodewoord}
        />
        <p className="voortgang">{nogTeGaan(toestand) === 1 ? 'Laatste plek' : `Nog ${nogTeGaan(toestand)} te gaan`}</p>
        {vondCodewoord && <CodewoordMelding />}
        {storing && (
          <p className="feedback feedback-storing" role="alert">
            {storing}
          </p>
        )}
        {leermoment && kaart ? (
          topoLeermoment((b) => void leermomentKlaar(b))
        ) : kaart ? (
          <Aanwijzen
            key={`${item.id}-${toestand.huidige}`}
            item={item}
            kaart={kaart}
            vorm={toestand.vorm}
            hulp={toestand.hulp}
            afgesloten={toestand.afgesloten}
            laatste={laatste}
            leermoment={leermoment}
            bezig={bezig}
            andereOpties={bronItems.filter((i) => i.id !== item.id && i.plek?.kaartId === item.plek!.kaartId && i.plek?.richting === 'aanwijzen' && i.plek?.soort === item.plek!.soort).concat(bronItems.filter((i) => i.id !== item.id && i.plek?.kaartId === item.plek!.kaartId && i.plek?.richting === 'aanwijzen' && i.plek?.soort !== item.plek!.soort))}
            zaad={pogingId}
            nieuw={isNieuwLeeritem(toestand, item.id) && !toestand.pogingen.some((p) => p.leeritemId === item.id)}
            hint={[ankerhint(ankers), geheugenbeelden[item.id] ? `Denk aan je beeld: "${geheugenbeelden[item.id]}".` : null].filter(Boolean).join(' ') || null}
            onAntwoord={(antwoord, oordeel) => void verstuur(antwoord, false, oordeel)}
            onHulp={hulp}
            onVolgende={() => void (leermoment ? leermomentKlaar(null) : naarVolgende())}
          />
        ) : (
          <>
            <p className="feedback feedback-storing">De kaart van deze plek ontbreekt. Laad de kaart opnieuw in bij de bron.</p>
            <button className="knop" onClick={() => void verstuur(null, false, 'niet geweten')}>
              Overslaan
            </button>
          </>
        )}
      </section>
    )
  }

  return (
    <section className="kaart sessie" ref={sessieRef}>
      <Sterrenkaart
        totaal={toestand.leeritems.length}
        gedaan={toestand.huidige + (toestand.afgesloten ? 1 : 0)}
        codewoorden={codewoorden}
        sprong={vondCodewoord}
      />
      {toestand.huidige === 0 && toestand.pogingen.length === 0 ? (
        <p className="voortgang">{MISSIE(nogTeGaan(toestand))}</p>
      ) : (
        <p className="voortgang">{nogTeGaan(toestand) === 1 ? 'Laatste woord' : `Nog ${nogTeGaan(toestand)} woorden`}</p>
      )}
      {benoemen && benoemKaart ? (
        <>
          <p className="vraag vraag-kaart">{leermoment ? 'Nieuwe plek' : 'Wat ligt hier?'}</p>
          <p className="richting">
            {SOORTEN[item.plek!.soort].emoji} {SOORTEN[item.plek!.soort].naam}
          </p>
          <KaartUitsnede kaart={benoemKaart} plek={item.plek!} naam={leermoment || toestand.afgesloten ? goedAntwoord : undefined} />
        </>
      ) : (
        <p className="richting">
          {TAALNAAM[item.oefenrichting.van]} → {taal}
        </p>
      )}
      {raden ? (
        <p className="nieuw-label">✨ {benoemen ? 'Nieuwe plek' : 'Nieuw woord'}. Raad maar! Fout gokken is niet erg.</p>
      ) : goedGegokt ? (
        <p className="nieuw-label">🎯 Goed gegokt! Weet je het ook zonder opties?</p>
      ) : (
        isNieuwLeeritem(toestand, item.id) &&
        !laatste &&
        !toestand.pogingen.some((p) => p.leeritemId === item.id) && (
          <p className="nieuw-label">✨ {benoemen ? 'Nieuwe plek' : 'Nieuw woord'}. Weet je het al? Anders tik je op "Weet ik niet".</p>
        )
      )}
      {!benoemen && (
        <p className="vraag" lang={item.oefenrichting.van}>
          {item.vraag} <Voorleesknop tekst={item.vraag} taal={item.oefenrichting.van} />
        </p>
      )}

      {vondCodewoord && <CodewoordMelding />}
      {feedback && (
        <div className={`feedback feedback-${laatste!.oordeel.replace(' ', '-')}`} role="status">
          <p>
            {feedback.kort}
            {toestand.afgesloten && <Voorleesknop tekst={goedAntwoord} taal={item.oefenrichting.naar} />}
          </p>
          {'vergelijk' in feedback && feedback.vergelijk && (
            <p className="vergelijk">
              Jij: <Gemarkeerd tekens={feedback.vergelijk.gegeven} soort="fout" />
              <br />
              Goed: <Gemarkeerd tekens={feedback.vergelijk.goed} soort="mist" />
            </p>
          )}
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

      {leermoment && benoemen ? (
        topoLeermoment((b) => void leermomentKlaar(b))
      ) : leermoment ? (
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
          steuntjeOpen={(() => {
            const s = strategiePerBron[item.bronId]
            return s === 'beelden koppelen' || s === 'geheugenroute' ? aantalBeelden[s] < beeldenMetSteuntje : true
          })()}
          onKlaar={(b) => void leermomentKlaar(b)}
        />
      ) : raden ? (
        <>
          <p className="label">{benoemen ? 'Welke plek denk je dat dit is?' : `Wat denk je dat het in het ${taal} is?`}</p>
          <div className="opties">
            {raadOpties.map((optie) => (
              <button key={optie} className="knop knop-rustig optie" disabled={bezig} onClick={() => void gok(optie)} lang={item.oefenrichting.naar}>
                {optie}
              </button>
            ))}
          </div>
          <button className="link" disabled={bezig} onClick={() => void gok(null)}>
            Geen idee
          </button>
        </>
      ) : toestand.afgesloten ? (
        <button className="knop" onClick={() => void naarVolgende()} autoFocus>
          Volgende
        </button>
      ) : toestand.vorm === 'meerkeuze' ? (
        <>
          <p className="label">{benoemen ? 'Welke plek is dit?' : `Welk ${taal}e woord hoort erbij?`}</p>
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
          <p className={`wijze wijze-${wijze}`}>
            {wijze === 'zeggen' ? (
              <>
                <strong>🎤 Zeg of typ het.</strong> Tik op de microfoon van je toetsenbord en zeg het woord.
              </>
            ) : (
              <>
                <strong>✍️ Typ het, letter voor letter.</strong> Zo oefen je ook de spelling.
              </>
            )}
          </p>
          {typMelding && (
            <p className="feedback" role="status">
              Deze keer typen, letter voor letter ✍️
            </p>
          )}
          <label className="label" htmlFor="antwoord">
            {benoemen ? 'Hoe heet deze plek?' : `Wat is het in het ${taal}?`}
          </label>
          <input
            id="antwoord"
            ref={invoerRef}
            className="invoer"
            value={antwoord}
            onChange={(e) => opInvoer(e.target.value)}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            lang={item.oefenrichting.naar}
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

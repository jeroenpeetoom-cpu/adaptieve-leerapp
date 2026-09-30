import { useState } from 'react'
import type { Leeritem, PlekGegevens, Strategie } from '../leerlogica'
import type { Geheugenbeeld, Kaart } from '../bronnen/model'
import { MAX_PLEKKEN, MIN_PLEKKEN, type RouteStand } from '../bronnen/routes'
import { Voorleesknop } from '../weergave/voorlezen'
import { KaartUitsnede } from './KaartUitsnede'
import { voorstelVoorPlek, voorstelVoorWoord, type Beeldvoorstel, type EmojiRegister } from '../beelden/voorstel'

const TAALNAAM = { en: 'Engels', nl: 'Nederlands' } as const
const PLAATJE_MAX = 512

/** Verkleint een plaatje uit de galerij tot een kleine JPEG, zodat het weinig ruimte kost. */
async function verklein(bestand: File): Promise<string> {
  const beeld = await createImageBitmap(bestand, { imageOrientation: 'from-image' })
  const schaal = Math.min(1, PLAATJE_MAX / Math.max(beeld.width, beeld.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(beeld.width * schaal)
  canvas.height = Math.round(beeld.height * schaal)
  canvas.getContext('2d')!.drawImage(beeld, 0, 0, canvas.width, canvas.height)
  beeld.close()
  return canvas.toDataURL('image/jpeg', 0.8)
}

function WoordEnBetekenis({ item }: { item: Leeritem }) {
  return (
    <div className="leerwoord">
      <p className="gedempt">
        {TAALNAAM[item.oefenrichting.van]} → {TAALNAAM[item.oefenrichting.naar]}
      </p>
      <p className="vraag">
        <span lang={item.oefenrichting.van}>{item.vraag}</span> <Voorleesknop tekst={item.vraag} taal={item.oefenrichting.van} /> ={' '}
        <span lang={item.oefenrichting.naar}>{item.toegestaneAntwoorden[0]}</span>{' '}
        <Voorleesknop tekst={item.toegestaneAntwoorden[0]} taal={item.oefenrichting.naar} />
      </p>
    </div>
  )
}

interface Props {
  item: Leeritem
  /** De gekozen strategie voor deze bron; undefined als er nog niet gekozen is. */
  strategie: Strategie | 'geen' | undefined
  /** Strategieën die al eens zijn voorgedaan. */
  voorgedaan: Strategie[]
  /** De route van deze bron met een vrije plek, of null als er een nieuwe route nodig is. */
  route: RouteStand | null
  /** Voorstel voor de naam van een nieuwe route. */
  routenaam: string
  /** "woord = betekenis" van een leeritem, om de route te laten doorlopen. */
  itemTekst: (leeritemId: string) => string
  onKiesStrategie: (strategie: Strategie | 'geen') => void
  onVoorgedaan: (strategie: Strategie) => void
  onMaakRoute: (naam: string, plekken: string[]) => void
  laatsteReflectie: string | null
  /** Staat het steuntje (invulzinnetje en tips) vanzelf open? Bij de eerste beelden per strategie wel. */
  steuntjeOpen: boolean
  /** Bij een plek op een kaart: de uitsnede, de ankerzin, en een beeld dat de leerling al maakte bij deze plek. */
  topo?: { kaart: Kaart; plek: PlekGegevens; ankerzin: string | null; bestaandBeeld: string | null }
  onKlaar: (beeld: Omit<Geheugenbeeld, 'id' | 'aangemaakt'> | null) => void
}

const VOORDOEN_TOPO: { titel: string; tekst: string }[] = [
  {
    titel: 'Zo werkt beelden koppelen bij topo',
    tekst: 'De plek zie je op de kaart. Voor de naam bedenk je een plaatje in je hoofd dat je aan de naam laat denken. Hoe gekker, hoe beter je het onthoudt.',
  },
  {
    titel: 'Een voorbeeld',
    tekst: 'Luik ligt aan de Maas. Stel je een luik in de grond voor, waar de Maas doorheen stroomt. Zie je de rivier? Dan denk je aan Luik.',
  },
  {
    titel: 'Nu jij',
    tekst: 'Bedenk je eigen plaatje bij de naam en beschrijf het in een paar woorden. Straks helpt het je om de naam weer te weten.',
  },
]

const VOORDOEN: Record<Strategie, { titel: string; tekst: string }[]> = {
  'beelden koppelen': [
    {
      titel: 'Zo werkt beelden koppelen',
      tekst: 'Je bedenkt bij een nieuw woord een plaatje in je hoofd dat je aan de betekenis laat denken. Hoe gekker, hoe beter je het onthoudt.',
    },
    {
      titel: 'Een voorbeeld',
      tekst: 'Bridge betekent brug. Stel je voor dat er een brug ligt tussen twee kussens op de bank, en dat je eroverheen loopt.',
    },
    {
      titel: 'Nu jij',
      tekst: 'Bedenk je eigen plaatje en beschrijf het in een paar woorden. Straks, als je het woord niet meer weet, helpt je eigen plaatje je op weg.',
    },
  ],
  geheugenroute: [
    {
      titel: 'Zo werkt een geheugenroute',
      tekst: 'Je kiest een paar plekken in je huis die je goed kent, in de volgorde waarin je erlangs loopt. Bijvoorbeeld: voordeur, kapstok, bank en tafel.',
    },
    {
      titel: 'Een voorbeeld',
      tekst: 'Op elke plek leg je in gedachten één woord, met een gek beeld. Bij de voordeur ligt een brug tussen twee kussens (bridge = brug). Aan de kapstok hangt een wolk als jas (cloud = wolk).',
    },
    {
      titel: 'Nu jij',
      tekst: 'Later loop je in gedachten je route langs, en kom je de woorden weer tegen. Kies eerst je plekken.',
    },
  ],
}

/** Een nieuw woord dat de leerling nog niet kende: laten zien en een eigen geheugenbeeld maken. */
export function Leermoment({
  item,
  strategie,
  voorgedaan,
  route,
  routenaam,
  itemTekst,
  onKiesStrategie,
  onVoorgedaan,
  onMaakRoute,
  laatsteReflectie,
  steuntjeOpen,
  topo,
  onKlaar,
}: Props) {
  const [stap, setStap] = useState(0)
  const [beschrijving, setBeschrijving] = useState('')
  const [emoji, setEmoji] = useState('')
  const [plaatje, setPlaatje] = useState<string | null>(null)
  const [plaatjeFout, setPlaatjeFout] = useState(false)
  const [naam, setNaam] = useState(routenaam)
  const [plekken, setPlekken] = useState<string[]>(Array(MAX_PLEKKEN).fill(''))
  const [doorlopen, setDoorlopen] = useState<Omit<Geheugenbeeld, 'id' | 'aangemaakt'> | null>(null)
  const [steuntje, setSteuntje] = useState(steuntjeOpen)
  const [voorstel, setVoorstel] = useState<Beeldvoorstel | null>(null)
  const [voorstelNummer, setVoorstelNummer] = useState(0)
  const [voorstelGebruikt, setVoorstelGebruikt] = useState(false)

  /** Een emoji-voorstel met een gek zinnetje, als de leerling zelf geen beeld kan bedenken (vraag 49). */
  async function helpMetBeeld() {
    const register = (await import('../beelden/emoji-register.json')).default as unknown as EmojiRegister
    const zaad = `${item.id}-${voorstelNummer}`
    setVoorstelNummer((n) => n + 1)
    setVoorstel(
      topo
        ? voorstelVoorPlek(item.toegestaneAntwoorden[0], topo.plek.soort, register, zaad)
        : voorstelVoorWoord(item.oefenrichting.van === 'nl' ? item.toegestaneAntwoorden[0] : item.vraag, item.oefenrichting.van === 'nl' ? item.vraag : item.toegestaneAntwoorden[0], register, zaad),
    )
  }
  const plekNaam = item.toegestaneAntwoorden[0]
  const inhoud = topo ? (
    <>
      <KaartUitsnede kaart={topo.kaart} plek={topo.plek} naam={plekNaam} />
      {topo.ankerzin && <p className="ankerzin">🧭 {topo.ankerzin}</p>}
    </>
  ) : (
    <WoordEnBetekenis item={item} />
  )
  // Het steuntje telt als gebruikt als het bij het bewaren open stond.

  if (topo?.bestaandBeeld) {
    return (
      <div className="leermoment">
        <h3>Nieuwe plek</h3>
        {inhoud}
        <p className="feedback">Je beeld bij deze plek: {topo.bestaandBeeld}</p>
        <button className="knop" onClick={() => onKlaar(null)} autoFocus>
          Volgende
        </button>
      </div>
    )
  }

  if (strategie === undefined) {
    return (
      <div className="leermoment">
        <h3>{topo ? 'Nieuwe plek' : 'Nieuwe woorden'}</h3>
        {inhoud}
        <p>{topo ? 'Hoe wil je de namen van deze kaart onthouden?' : 'Hoe wil je de nieuwe woorden van deze lijst onthouden?'}</p>
        {laatsteReflectie && (
          <p className="feedback">
            Vorige keer zei je dat dit je het meest hielp: <strong>{laatsteReflectie.toLowerCase()}</strong>.
          </p>
        )}
        <div className="strategieen">
          <button className="strategie" onClick={() => onKiesStrategie('beelden koppelen')}>
            <strong>🖼️ Beelden koppelen</strong>
            <span>
              {topo
                ? 'Je bedenkt bij elke naam een grappig plaatje in je hoofd, bijvoorbeeld een luik in de grond bij Luik.'
                : 'Je bedenkt bij elk woord een grappig plaatje in je hoofd. Dat werkt goed voor woorden en hun betekenis.'}
            </span>
          </button>
          {!topo && (
            <button className="strategie" onClick={() => onKiesStrategie('geheugenroute')}>
              <strong>🗺️ Geheugenroute</strong>
              <span>Je legt woorden op plekken in je huis en loopt er in gedachten langs. Handig als je een rijtje woorden tegelijk leert.</span>
            </button>
          )}
        </div>
        <button className="link" onClick={() => onKiesStrategie('geen')}>
          Liever zonder, gewoon herhalen
        </button>
      </div>
    )
  }

  if (strategie === 'geen') {
    return (
      <div className="leermoment">
        <h3>{topo ? 'Nieuwe plek' : 'Nieuw woord'}</h3>
        {inhoud}
        <p className="gedempt">{topo ? 'Kijk goed waar het ligt. Straks komt het terug.' : 'Lees het goed. Straks komt het terug.'}</p>
        <button className="knop" onClick={() => onKlaar(null)} autoFocus>
          Volgende
        </button>
      </div>
    )
  }

  const stappen = topo && strategie === 'beelden koppelen' ? VOORDOEN_TOPO : VOORDOEN[strategie]
  if (!voorgedaan.includes(strategie) && stap < stappen.length) {
    return (
      <div className="leermoment">
        <p className="gedempt">
          Stap {stap + 1} van {stappen.length}
        </p>
        <h3>{stappen[stap].titel}</h3>
        <p>{stappen[stap].tekst}</p>
        <button
          className="knop"
          autoFocus
          onClick={() => {
            if (stap === stappen.length - 1) onVoorgedaan(strategie)
            setStap(stap + 1)
          }}
        >
          {stap === stappen.length - 1 ? 'Ik probeer het' : 'Verder'}
        </button>
      </div>
    )
  }

  if (strategie === 'geheugenroute' && route === null && !topo) {
    const ingevuld = plekken.map((p) => p.trim()).filter(Boolean)
    return (
      <div className="leermoment">
        <h3>Maak een route</h3>
        <p>
          Noem {MIN_PLEKKEN} tot {MAX_PLEKKEN} plekken in je huis die je goed kent, in de volgorde waarin je erlangs loopt.
        </p>
        {plekken.map((p, i) => (
          <label key={i} className="plek-invoer">
            <span className="gedempt">Plek {i + 1}</span>
            <input
              className="invoer"
              value={p}
              onChange={(e) => setPlekken(plekken.map((x, j) => (j === i ? e.target.value : x)))}
              placeholder={['voordeur', 'kapstok', 'bank', 'tafel', 'bed'][i]}
              maxLength={30}
              autoFocus={i === 0}
            />
          </label>
        ))}
        <label className="label" htmlFor="routenaam" style={{ marginTop: '0.75rem' }}>
          Naam van de route
        </label>
        <input id="routenaam" className="invoer" value={naam} onChange={(e) => setNaam(e.target.value)} maxLength={40} />
        <div className="knoppen">
          <button
            className="knop"
            disabled={ingevuld.length < MIN_PLEKKEN || naam.trim() === ''}
            onClick={() => onMaakRoute(naam.trim(), ingevuld)}
          >
            Route bewaren
          </button>
        </div>
      </div>
    )
  }

  const plekIndex = strategie === 'geheugenroute' && !topo ? route!.vrijePlek! : null
  const plek = plekIndex !== null ? route!.route.plekken[plekIndex] : null

  if (doorlopen && route) {
    return (
      <div className="leermoment">
        <h3>Loop je route in gedachten langs</h3>
        <p className="gedempt">{route.route.naam}</p>
        <ol className="route">
          {route.route.plekken.map((p, i) => {
            const opPlek = i === plekIndex ? doorlopen : route.bezet.find((b) => b.plek === i)
            return (
              <li key={i} className={opPlek ? '' : 'gedempt'}>
                <strong>{p}</strong>
                {opPlek ? (
                  <>
                    : {opPlek.emoji} {opPlek.beschrijving} <span className="gedempt">({itemTekst(opPlek.leeritemId)})</span>
                  </>
                ) : (
                  ' (nog leeg)'
                )}
              </li>
            )
          })}
        </ol>
        <p>Zie je elke plek voor je, met het woord dat er ligt?</p>
        <button className="knop" autoFocus onClick={() => onKlaar(doorlopen)}>
          Verder
        </button>
      </div>
    )
  }

  return (
    <div className="leermoment">
      <h3>{plek ? `Plek ${plekIndex! + 1}: ${plek}` : topo ? `Maak een beeld bij ${plekNaam}` : 'Maak je eigen beeld'}</h3>
      {inhoud}
      <label className="label" htmlFor="beschrijving">
        {plek ? `Wat zie je bij de plek "${plek}"?` : 'Wat zie je voor je?'} <span className="gedempt">(een paar woorden)</span>
      </label>
      <input
        id="beschrijving"
        className="invoer"
        value={beschrijving}
        onChange={(e) => setBeschrijving(e.target.value)}
        placeholder={topo ? 'Bijvoorbeeld: een luik in de grond waar de Maas doorheen stroomt' : 'Bijvoorbeeld: brug tussen twee kussens'}
        maxLength={120}
        autoFocus
      />
      <p className="gedempt tip">🎤 Tip: tik op de microfoon van je toetsenbord om je beeld in te spreken.</p>
      {voorstel ? (
        <div className="voorstel" role="note">
          <p className="voorstel-emoji" aria-hidden="true">
            {voorstel.emoji}
          </p>
          <p>{voorstel.zin}</p>
          <p className="gedempt">Maak het nog gekker, of verander het zodat het jouw eigen beeld wordt.</p>
          <div className="knoppen">
            {(voorstel.kort || voorstel.emoji !== '💭') && (
              <button
                type="button"
                className="knop knop-rustig"
                onClick={() => {
                  if (voorstel.kort && !beschrijving.trim()) setBeschrijving(voorstel.kort)
                  if (voorstel.emoji !== '💭' && !emoji.trim()) setEmoji(voorstel.emoji.split(' ').slice(-1)[0])
                  setVoorstelGebruikt(true)
                }}
              >
                Gebruik dit
              </button>
            )}
            <button type="button" className="link" onClick={() => void helpMetBeeld()}>
              Ander voorstel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="link" onClick={() => void helpMetBeeld()}>
          💡 Help me met een beeld
        </button>
      )}
      {steuntje ? (
        <div className="steuntje" role="note">
          <p>
            <strong>Hulp bij bedenken</strong>
          </p>
          <p>
            Vul aan: <em>Ik zie ___ {plek ? `bij de ${plek}` : topo ? `bij ${plekNaam}` : 'ergens'}, en het ___.</em>
          </p>
          <ul>
            <li>Maak het groot of gek: een reuzenbrug, een pratende wolk.</li>
            <li>Laat het bewegen of geluid maken.</li>
            <li>Koppel het aan iets wat je kent: je kamer, je hond, je favoriete spel.</li>
          </ul>
          <button
            className="link"
            onClick={() => setBeschrijving(beschrijving || `Ik zie  ${plek ? `bij de ${plek}` : ''}, en het `)}
          >
            Gebruik het zinnetje
          </button>{' '}
          <button className="link" onClick={() => setSteuntje(false)}>
            Ik heb geen hulp nodig
          </button>
        </div>
      ) : (
        <button className="link" onClick={() => setSteuntje(true)}>
          💡 Hulp bij bedenken?
        </button>
      )}
      <label className="label" htmlFor="emoji" style={{ marginTop: '0.75rem' }}>
        Emoji erbij? <span className="gedempt">(mag, hoeft niet)</span>
      </label>
      <input id="emoji" className="invoer emoji-invoer" value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={12} />
      <label className="knop knop-rustig plaatje-knop">
        🖼️ {plaatje ? 'Ander plaatje kiezen' : 'Plaatje uit je galerij (mag, hoeft niet)'}
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const bestand = e.target.files?.[0]
            if (!bestand) return
            setPlaatjeFout(false)
            verklein(bestand).then(setPlaatje, () => setPlaatjeFout(true))
          }}
        />
      </label>
      {plaatjeFout && <p className="feedback feedback-storing">Dit plaatje kon ik niet openen. Probeer een ander.</p>}
      {plaatje && <img className="plaatje" src={plaatje} alt="Jouw plaatje bij dit woord" />}
      <div className="knoppen">
        <button
          className="knop"
          disabled={beschrijving.trim() === ''}
          onClick={() => {
            const beeld = {
              leeritemId: item.id,
              beschrijving: beschrijving.trim(),
              emoji: emoji.trim(),
              plaatje,
              routeId: route && plekIndex !== null ? route.route.id : null,
              plek: plekIndex,
              metHulp: steuntje || voorstelGebruikt,
            }
            // Bij een geheugenroute eerst de route in gedachten doorlopen, daarna verder.
            if (plekIndex !== null) setDoorlopen(beeld)
            else onKlaar(beeld)
          }}
        >
          Bewaar mijn beeld
        </button>
        <button className="link" onClick={() => onKlaar(null)}>
          Overslaan
        </button>
      </div>
    </div>
  )
}

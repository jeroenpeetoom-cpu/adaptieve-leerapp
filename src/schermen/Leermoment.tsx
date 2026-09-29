import { useState } from 'react'
import type { Leeritem, Strategie } from '../leerlogica'
import type { Geheugenbeeld } from '../bronnen/model'
import { MAX_PLEKKEN, MIN_PLEKKEN, type RouteStand } from '../bronnen/routes'

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
        <span lang={item.oefenrichting.van}>{item.vraag}</span> = <span lang={item.oefenrichting.naar}>{item.toegestaneAntwoorden[0]}</span>
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
  onKlaar: (beeld: Omit<Geheugenbeeld, 'id' | 'aangemaakt'> | null) => void
}

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

  if (strategie === undefined) {
    return (
      <div className="leermoment">
        <h3>Nieuwe woorden</h3>
        <WoordEnBetekenis item={item} />
        <p>Hoe wil je de nieuwe woorden van deze lijst onthouden?</p>
        <div className="strategieen">
          <button className="strategie" onClick={() => onKiesStrategie('beelden koppelen')}>
            <strong>🖼️ Beelden koppelen</strong>
            <span>Je bedenkt bij elk woord een grappig plaatje in je hoofd. Dat werkt goed voor woorden en hun betekenis.</span>
          </button>
          <button className="strategie" onClick={() => onKiesStrategie('geheugenroute')}>
            <strong>🗺️ Geheugenroute</strong>
            <span>Je legt woorden op plekken in je huis en loopt er in gedachten langs. Handig als je een rijtje woorden tegelijk leert.</span>
          </button>
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
        <h3>Nieuw woord</h3>
        <WoordEnBetekenis item={item} />
        <p className="gedempt">Lees het goed. Straks komt het terug.</p>
        <button className="knop" onClick={() => onKlaar(null)} autoFocus>
          Volgende
        </button>
      </div>
    )
  }

  const stappen = VOORDOEN[strategie]
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

  if (strategie === 'geheugenroute' && route === null) {
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

  const plekIndex = strategie === 'geheugenroute' ? route!.vrijePlek! : null
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
      <h3>{plek ? `Plek ${plekIndex! + 1}: ${plek}` : 'Maak je eigen beeld'}</h3>
      <WoordEnBetekenis item={item} />
      <label className="label" htmlFor="beschrijving">
        {plek ? `Wat zie je bij de plek "${plek}"?` : 'Wat zie je voor je?'} <span className="gedempt">(een paar woorden)</span>
      </label>
      <input
        id="beschrijving"
        className="invoer"
        value={beschrijving}
        onChange={(e) => setBeschrijving(e.target.value)}
        placeholder="Bijvoorbeeld: brug tussen twee kussens"
        maxLength={120}
        autoFocus
      />
      <p className="gedempt tip">🎤 Tip: tik op de microfoon van je toetsenbord om je beeld in te spreken.</p>
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

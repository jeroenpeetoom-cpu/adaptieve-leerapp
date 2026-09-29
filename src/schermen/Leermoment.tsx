import { useState } from 'react'
import type { Leeritem, Strategie } from '../leerlogica'
import type { Geheugenbeeld } from '../bronnen/model'

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
  /** Is beelden koppelen al eens voorgedaan? */
  voorgedaan: boolean
  onKiesStrategie: (strategie: Strategie | 'geen') => void
  onVoorgedaan: () => void
  onKlaar: (beeld: Omit<Geheugenbeeld, 'id' | 'aangemaakt'> | null) => void
}

/** Een nieuw woord dat de leerling nog niet kende: laten zien en een eigen geheugenbeeld maken. */
export function Leermoment({ item, strategie, voorgedaan, onKiesStrategie, onVoorgedaan, onKlaar }: Props) {
  const [stap, setStap] = useState(0)
  const [beschrijving, setBeschrijving] = useState('')
  const [emoji, setEmoji] = useState('')
  const [plaatje, setPlaatje] = useState<string | null>(null)
  const [plaatjeFout, setPlaatjeFout] = useState(false)

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
          <button className="strategie" disabled>
            <strong>🗺️ Geheugenroute</strong>
            <span>Je legt woorden op plekken in je huis en loopt er in gedachten langs. Komt binnenkort.</span>
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

  if (!voorgedaan && stap < 3) {
    const stappen = [
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
    ]
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
            if (stap === stappen.length - 1) onVoorgedaan()
            setStap(stap + 1)
          }}
        >
          {stap === stappen.length - 1 ? 'Ik probeer het' : 'Verder'}
        </button>
      </div>
    )
  }

  return (
    <div className="leermoment">
      <h3>Maak je eigen beeld</h3>
      <WoordEnBetekenis item={item} />
      <label className="label" htmlFor="beschrijving">
        Wat zie je voor je? <span className="gedempt">(een paar woorden)</span>
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
          onClick={() =>
            onKlaar({ leeritemId: item.id, beschrijving: beschrijving.trim(), emoji: emoji.trim(), plaatje, routeId: null, plek: null })
          }
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

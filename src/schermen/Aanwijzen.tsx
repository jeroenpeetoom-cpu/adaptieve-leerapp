import { useLayoutEffect, useRef, useState } from 'react'
import type { Kaart } from '../bronnen/model'
import {
  SOORTEN,
  beoordeelTik,
  omschrijfLigging,
  windrichting,
  type Hulp,
  type Leeritem,
  type Oordeel,
  type Poging,
} from '../leerlogica'
import { Voorleesknop } from '../weergave/voorlezen'

const LETTERS = ['A', 'B', 'C', 'D']
const ZOOMSTAPPEN = [1, 1.5, 2.2, 3]

function leesTik(antwoord: string | null): { x: number; y: number } | null {
  if (!antwoord) return null
  const [x, y] = antwoord.split(',').map(Number)
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null
}

interface Props {
  item: Leeritem
  kaart: Kaart
  vorm: 'typen' | 'meerkeuze'
  hulp: Hulp
  afgesloten: boolean
  /** De laatste poging op dit leeritem hier, als die er is. */
  laatste: Poging | undefined
  leermoment: boolean
  bezig: boolean
  /** Andere plekken om uit te kiezen bij meerkeuze (de goede zit er niet in). */
  andereOpties: Leeritem[]
  zaad: string
  /** Hint met een anker en/of het eigen geheugenbeeld; zonder anker de ligging op de kaart. */
  hint: string | null
  onAntwoord: (antwoord: string | null, oordeel: Oordeel) => void
  onHulp: (soort: 'met hint' | 'herkend' | 'na voorbeeld') => void
  onVolgende: () => void
}

/** Aanwijzen: "Waar ligt …?" De leerling tikt op de blinde kaart. */
export function Aanwijzen({ item, kaart, vorm, hulp, afgesloten, laatste, leermoment, bezig, andereOpties, zaad, hint, onAntwoord, onHulp, onVolgende }: Props) {
  const [zoom, setZoom] = useState(1)
  const vensterRef = useRef<HTMLDivElement>(null)
  /** Het midden van wat de leerling zag, zodat in- en uitzoomen daar blijft. */
  const midden = useRef({ x: 0.5, y: 0.5 })

  function zoomNaar(nieuw: number) {
    const v = vensterRef.current
    if (v) {
      midden.current = {
        x: (v.scrollLeft + v.clientWidth / 2) / v.scrollWidth,
        y: (v.scrollTop + v.clientHeight / 2) / v.scrollHeight,
      }
    }
    setZoom(nieuw)
  }

  useLayoutEffect(() => {
    const v = vensterRef.current
    if (!v) return
    v.scrollLeft = midden.current.x * v.scrollWidth - v.clientWidth / 2
    v.scrollTop = midden.current.y * v.scrollHeight - v.clientHeight / 2
  }, [zoom])
  const index = ZOOMSTAPPEN.indexOf(zoom)
  const [hulpOpen, setHulpOpen] = useState(false)
  const plek = item.plek!
  const verhouding = kaart.hoogte / kaart.breedte
  const tik = leesTik(laatste?.antwoord ?? null)
  const toonDoel = afgesloten || leermoment || hulp === 'na voorbeeld'

  // Meerkeuze: de goede plek en drie andere, in een vaste volgorde per poging.
  const opties = (() => {
    if (vorm !== 'meerkeuze' || afgesloten) return []
    let h = 0
    for (const c of zaad) h = (h * 31 + c.charCodeAt(0)) | 0
    const alle = [item, ...andereOpties.slice(0, 3)]
    return alle
      .map((o, i) => ({ o, k: Math.abs(Math.imul(h ^ (i + 1), 2654435761)) }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.o)
  })()

  function kaartTik(x: number, y: number) {
    if (bezig || afgesloten || leermoment || vorm === 'meerkeuze') return
    const { oordeel } = beoordeelTik({ x, y }, plek, plek.soort, verhouding)
    onAntwoord(`${x.toFixed(4)},${y.toFixed(4)}`, oordeel)
  }

  let feedback: string | null = null
  if (leermoment) feedback = `Nieuw: hier ligt ${item.vraag}. Kijk goed waar het is; straks vraag ik het je nog een keer.`
  else if (laatste) {
    if (laatste.oordeel === 'goed') feedback = laatste.hulp === 'vrij opgehaald' ? 'Goed zo, dat wist je helemaal zelf!' : 'Goed! Je had er hulp bij, dus het komt snel terug.'
    else if (!afgesloten && laatste.oordeel === 'bijna' && tik) feedback = `Bijna! Iets meer naar het ${windrichting(tik, plek, verhouding)}.`
    else if (!afgesloten) feedback = `Dat is het niet. Hint: ${hint ?? `het ligt ${omschrijfLigging(plek)}.`}`
    else if (laatste.oordeel === 'niet geweten') feedback = `Geeft niet. Hier ligt ${item.vraag}. Het komt straks terug.`
    else feedback = `Hier ligt ${item.vraag}. Het komt straks terug.`
  } else if (hulp === 'met hint') feedback = `Hint: ${hint ?? `het ligt ${omschrijfLigging(plek)}.`}`
  else if (hulp === 'na voorbeeld') feedback = `Hier ligt ${item.vraag}. Tik er nu zelf op.`

  return (
    <>
      <p className="vraag vraag-kaart">
        Waar ligt {item.vraag}? <Voorleesknop tekst={`Waar ligt ${item.vraag}?`} taal="nl" />
      </p>
      <p className="richting">
        {SOORTEN[plek.soort].emoji} {SOORTEN[plek.soort].naam}
        {vorm === 'meerkeuze' && !afgesloten ? ' · tik op de goede letter' : ' · tik op de kaart'}
      </p>

      {feedback && (
        <div className={`feedback feedback-${(laatste?.oordeel ?? 'hint').replace(' ', '-')}`} role="status">
          <p>{feedback}</p>
        </div>
      )}

      {afgesloten || leermoment ? (
        <button className="knop" onClick={onVolgende} autoFocus>
          Volgende
        </button>
      ) : (
        <div className="knoppen">
          <button className="knop knop-rustig" disabled={bezig} onClick={() => onAntwoord(null, 'niet geweten')}>
            Weet ik niet
          </button>
          <button className="knop knop-rustig" aria-expanded={hulpOpen} disabled={bezig || hulp === 'na voorbeeld'} onClick={() => setHulpOpen(!hulpOpen)}>
            Hulp
          </button>
        </div>
      )}
      {hulpOpen && !afgesloten && !leermoment && (
        <div className="hulpmenu" role="group" aria-label="Kies hulp">
          <button type="button" className="knop knop-rustig" disabled={hulp !== 'vrij opgehaald'} onClick={() => (onHulp('met hint'), setHulpOpen(false))}>
            Geef een hint
          </button>
          <button type="button" className="knop knop-rustig" onClick={() => (onHulp('herkend'), setHulpOpen(false))}>
            Laat me kiezen uit vier plekken
          </button>
          <button type="button" className="knop knop-rustig" onClick={() => (onHulp('na voorbeeld'), setHulpOpen(false))}>
            Laat zien waar het ligt
          </button>
        </div>
      )}
      <div className="zoomknoppen" role="group" aria-label="Zoomen">
        <button type="button" className="icoonknop" aria-label="Uitzoomen" disabled={index <= 0} onClick={() => zoomNaar(ZOOMSTAPPEN[index - 1])}>
          −
        </button>
        <button type="button" className="icoonknop" aria-label="Inzoomen" disabled={index >= ZOOMSTAPPEN.length - 1} onClick={() => zoomNaar(ZOOMSTAPPEN[index + 1])}>
          +
        </button>
        {zoom > 1 && <span className="gedempt">Schuif met je vinger over de kaart</span>}
      </div>
      <div className="kaartvenster kaartvenster-passend" ref={vensterRef}>
        <div
          className={`kaartbeeld ${!afgesloten && !leermoment && vorm !== 'meerkeuze' ? 'tikbaar' : ''}`}
          // Bij zoom 1 past de hele kaart in het vak; inzoomen maakt hem groter binnen het vak.
          style={{ height: `${zoom * 100}%`, width: 'auto', aspectRatio: `${kaart.breedte} / ${kaart.hoogte}` }}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect()
            kaartTik((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height)
          }}
        >
          <img src={kaart.beeld} alt="Blinde kaart" draggable={false} />
          {tik && (laatste?.oordeel !== 'goed' || afgesloten) && (
            <span className={`tikpunt ${laatste?.oordeel === 'goed' ? 'goed' : ''}`} style={{ left: `${tik.x * 100}%`, top: `${tik.y * 100}%` }} aria-hidden="true" />
          )}
          {toonDoel && (
            <span
              className={`doelpunt doel-${plek.soort}`}
              style={{ left: `${plek.x * 100}%`, top: `${plek.y * 100}%` }}
              aria-label={`Hier ligt ${item.vraag}`}
            />
          )}
          {opties.map((o, i) => (
            <button
              key={o.id}
              className="kaartstip optie-stip"
              style={{ left: `${o.plek!.x * 100}%`, top: `${o.plek!.y * 100}%` }}
              disabled={bezig}
              onClick={(e) => {
                e.stopPropagation()
                onAntwoord(o.id === item.id ? `${plek.x},${plek.y}` : `${o.plek!.x},${o.plek!.y}`, o.id === item.id ? 'goed' : 'fout')
              }}
            >
              {LETTERS[i]}
            </button>
          ))}
        </div>
      </div>

    </>
  )
}

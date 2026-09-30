import { useState } from 'react'
import type { Kaart } from '../bronnen/model'
import type { PlekGegevens } from '../leerlogica'

/** Altijd beginnen met de hele kaart; de leerling zoomt zelf in als dat nodig is. */
const ZOOMSTAPPEN = [1, 1.5, 2.2, 3]
/** Verhouding hoogte/breedte van de uitsnede als er is ingezoomd. */
const VENSTER = 0.7

const begrens = (v: number) => Math.max(0, Math.min(100, v))

/**
 * De kaart met een plek die oplicht. Begint altijd met de hele kaart, klein genoeg om met de vraag en het
 * invulveld op het scherm te passen. Inzoomen doet de leerling zelf; de plek blijft dan in het midden.
 */
export function KaartUitsnede({ kaart, plek, naam }: { kaart: Kaart; plek: PlekGegevens; naam?: string }) {
  const [zoom, setZoom] = useState<number>(1)
  const v = kaart.hoogte / kaart.breedte
  // Bij de hele kaart past het venster zich aan de kaart aan, anders een vaste verhouding.
  const venster = zoom === 1 ? v : VENSTER
  const posX = zoom === 1 ? 0 : begrens(((plek.x * zoom - 0.5) / (zoom - 1)) * 100)
  const beeldHoogte = zoom * v // in breedtes van het venster
  const posY = beeldHoogte > venster ? begrens(((plek.y * beeldHoogte - venster / 2) / (beeldHoogte - venster)) * 100) : 50
  const stipX = plek.x * zoom - (posX / 100) * (zoom - 1)
  const stipY = (plek.y * beeldHoogte - (posY / 100) * (beeldHoogte - venster)) / venster
  const index = ZOOMSTAPPEN.indexOf(zoom)

  return (
    <>
      <div
        className="uitsnede"
        style={{
          backgroundImage: `url(${kaart.beeld})`,
          backgroundSize: `${zoom * 100}% auto`,
          backgroundPosition: `${posX}% ${posY}%`,
          aspectRatio: `${1 / venster}`,
          // De hele kaart past altijd in het scherm, zodat de vraag erboven zichtbaar blijft.
          width: `min(100%, calc(42dvh / ${venster}))`,
          marginInline: 'auto',
        }}
        role="img"
        aria-label={naam ? `Kaart: ${naam}` : 'Kaart met een plek die oplicht'}
      >
        <span className={`doelpunt doel-${plek.soort}`} style={{ left: `${stipX * 100}%`, top: `${stipY * 100}%` }} />
        {naam && (
          <span className="uitsnede-naam" style={{ left: `${stipX * 100}%`, top: `${stipY * 100}%` }}>
            {naam}
          </span>
        )}
      </div>
      <div className="zoomknoppen" role="group" aria-label="Zoomen">
        <button type="button" className="icoonknop" aria-label="Uitzoomen" disabled={index <= 0} onClick={() => setZoom(ZOOMSTAPPEN[Math.max(0, index - 1)])}>
          −
        </button>
        <button type="button" className="icoonknop" aria-label="Inzoomen" disabled={index >= ZOOMSTAPPEN.length - 1} onClick={() => setZoom(ZOOMSTAPPEN[Math.min(ZOOMSTAPPEN.length - 1, index + 1)])}>
          +
        </button>
        <button type="button" className="link" disabled={zoom === 1} onClick={() => setZoom(1)}>
          Hele kaart
        </button>
      </div>
    </>
  )
}

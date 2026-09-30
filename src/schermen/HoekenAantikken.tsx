import { useState } from 'react'
import type { Punt } from '../topo/uitlijnen'

const HOEKEN = ['linksboven', 'rechtsboven', 'rechtsonder', 'linksonder']

/** De vier hoeken van het kaartkader aantikken, in vaste volgorde. */
export function HoekenAantikken({ beeld, titel, onKlaar }: { beeld: string; titel: string; onKlaar: (hoeken: Punt[]) => void }) {
  const [hoeken, setHoeken] = useState<Punt[]>([])
  const volgende = HOEKEN[hoeken.length]
  return (
    <div>
      <div className="modusbalk" role="status">
        <p>
          <strong>{titel}</strong>
          <br />
          {volgende ? (
            <>
              👆 Tik op de hoek <strong>{volgende}</strong> van het kaartkader (de dunne rechthoek om de kaart). Hoek {hoeken.length + 1} van 4.
            </>
          ) : (
            'Alle vier de hoeken staan erop.'
          )}
        </p>
        <div className="knoppen">
          {!volgende && (
            <button className="knop" onClick={() => onKlaar(hoeken)}>
              Verder
            </button>
          )}
          {hoeken.length > 0 && (
            <button className="knop knop-rustig" onClick={() => setHoeken([])}>
              Opnieuw
            </button>
          )}
        </div>
      </div>
      <div className="kaartvenster">
        <div
          className="kaartbeeld tikbaar"
          onClick={(e) => {
            if (!volgende) return
            const r = e.currentTarget.getBoundingClientRect()
            setHoeken([...hoeken, { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }])
          }}
        >
          <img src={beeld} alt={titel} draggable={false} />
          {hoeken.map((h, i) => (
            <span key={i} className="kaartstip gekozen" style={{ left: `${h.x * 100}%`, top: `${h.y * 100}%` }}>
              {i + 1}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

import type { Kaart } from '../bronnen/model'
import type { PlekGegevens } from '../leerlogica'

/** Hoe ver er wordt ingezoomd: een stad dichtbij, een gebied, water of land met meer omgeving. */
const ZOOM = { stad: 2.4, water: 1.5, gebied: 1.4, land: 1.3 } as const
/** Verhouding hoogte/breedte van de uitsnede. */
const VENSTER = 0.7

const begrens = (v: number) => Math.max(0, Math.min(100, v))

/**
 * Een uitsnede van de kaart met de plek in het midden (of zo dicht mogelijk daarbij aan de rand),
 * zodat de leerling de plek ziet zonder te scrollen, ook als het toetsenbord openstaat.
 */
export function KaartUitsnede({ kaart, plek, naam }: { kaart: Kaart; plek: PlekGegevens; naam?: string }) {
  const zoom = ZOOM[plek.soort]
  const v = kaart.hoogte / kaart.breedte
  // Achtergrondpositie in procenten, zodat de plek zo veel mogelijk in het midden staat.
  const posX = begrens(((plek.x * zoom - 0.5) / (zoom - 1)) * 100)
  const beeldHoogte = zoom * v // in breedtes van het venster
  const posY = beeldHoogte > VENSTER ? begrens(((plek.y * beeldHoogte - VENSTER / 2) / (beeldHoogte - VENSTER)) * 100) : 50
  const stipX = plek.x * zoom - (posX / 100) * (zoom - 1)
  // Ook als het beeld lager is dan het venster (dan staat het in het midden): dezelfde formule.
  const stipY = (plek.y * beeldHoogte - (posY / 100) * (beeldHoogte - VENSTER)) / VENSTER
  return (
    <div
      className="uitsnede"
      style={{
        backgroundImage: `url(${kaart.beeld})`,
        backgroundSize: `${zoom * 100}% auto`,
        backgroundPosition: `${posX}% ${posY}%`,
        aspectRatio: `${1 / VENSTER}`,
      }}
      role="img"
      aria-label={naam ? `Uitsnede van de kaart: ${naam}` : 'Uitsnede van de kaart met een plek die oplicht'}
    >
      <span className={`doelpunt doel-${plek.soort}`} style={{ left: `${stipX * 100}%`, top: `${stipY * 100}%` }} />
      {naam && (
        <span className="uitsnede-naam" style={{ left: `${stipX * 100}%`, top: `${stipY * 100}%` }}>
          {naam}
        </span>
      )}
    </div>
  )
}

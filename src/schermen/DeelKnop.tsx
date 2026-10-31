import { useState } from 'react'
import { echteDb } from '../opslag/database'
import { maakDeelbestand } from '../opslag/delen'

/**
 * Downloadt een bron als bestand om te delen met de groep (spec delen). Alleen de leerstof; geen voortgang.
 * Het bestand gaat naar de beheerder, die het versleuteld bij de app zet.
 */
export function DeelKnop({ bronId, naam }: { bronId: string; naam: string }) {
  const [melding, setMelding] = useState<string | null>(null)

  async function deel() {
    const deel = await maakDeelbestand(echteDb, bronId, new Date().toISOString())
    const bestandsnaam = `bron-${naam.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.json`
    const bestand = new File([JSON.stringify(deel)], bestandsnaam, { type: 'application/json' })
    if (navigator.canShare?.({ files: [bestand] })) {
      try {
        await navigator.share({ files: [bestand], title: `Bron: ${naam}` })
      } catch (fout) {
        if ((fout as Error).name === 'AbortError') return
        throw fout
      }
    } else {
      const url = URL.createObjectURL(bestand)
      const a = document.createElement('a')
      a.href = url
      a.download = bestandsnaam
      a.click()
      URL.revokeObjectURL(url)
    }
    setMelding('Bestand gemaakt. Stuur het naar de beheerder; daarna komt de bron vanzelf bij de groep.')
  }

  return (
    <div className="deelknop">
      <button className="knop knop-rustig" onClick={() => void deel()}>
        📤 Bron downloaden om te delen
      </button>
      <p className="gedempt">Alleen de woorden, regels en kaart. Geen voortgang, beelden of naam.</p>
      {melding && <p className="feedback">{melding}</p>}
    </div>
  )
}

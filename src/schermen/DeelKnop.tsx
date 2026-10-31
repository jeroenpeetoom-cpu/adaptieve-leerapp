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
    setMelding('Bestand maken…')
    try {
      const deel = await maakDeelbestand(echteDb, bronId, new Date().toISOString())
      const bestandsnaam = `bron-${naam.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.json`
      const inhoud = JSON.stringify(deel)
      // Android deelt een .json-bestand niet altijd; als tekstbestand lukt het wel. Lukt delen niet, dan
      // downloaden we het gewoon, en in elk geval zeggen we wat er gebeurde.
      const alsTekst = new File([inhoud], bestandsnaam, { type: 'text/plain' })
      if (navigator.canShare?.({ files: [alsTekst] })) {
        try {
          await navigator.share({ files: [alsTekst], title: `Bron: ${naam}` })
          setMelding('Gedeeld. Zet het bestand in het gesprek met de beheerder; daarna komt de bron vanzelf bij de groep.')
          return
        } catch (fout) {
          if ((fout as Error).name === 'AbortError') return setMelding(null)
          // Delen mislukte: hieronder downloaden.
        }
      }
      const url = URL.createObjectURL(new Blob([inhoud], { type: 'application/json' }))
      const a = document.createElement('a')
      a.href = url
      a.download = bestandsnaam
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
      setMelding(`Gedownload als "${bestandsnaam}" (in je Downloads). Stuur dat bestand naar de beheerder.`)
    } catch (fout) {
      setMelding(`Dat lukte niet: ${(fout as Error).message}. Probeer het nog eens.`)
    }
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

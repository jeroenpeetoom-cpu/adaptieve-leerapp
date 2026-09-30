import { useRef } from 'react'

interface Props {
  /** Tekst voor wat er gefotografeerd wordt, zoals "de kaart". */
  wat?: string
  meerdere?: boolean
  uit?: boolean
  gekozen?: boolean
  onKies: (bestanden: FileList | null) => void
}

/** Twee manieren om een foto toe te voegen: meteen fotograferen, of een bestaande foto uit de galerij kiezen. */
export function FotoKnoppen({ wat, meerdere = false, uit = false, gekozen = false, onKies }: Props) {
  const camera = useRef<HTMLInputElement>(null)
  const galerij = useRef<HTMLInputElement>(null)
  const kies = (invoer: HTMLInputElement | null) => {
    onKies(invoer?.files ?? null)
    // Leegmaken, zodat dezelfde foto nog een keer gekozen kan worden.
    if (invoer) invoer.value = ''
  }
  return (
    <div className="knoppen fotoknoppen">
      <label className={`knop ${uit ? 'uit' : ''} ${gekozen ? 'knop-rustig' : ''}`}>
        📷 {gekozen ? 'Opnieuw fotograferen' : `Foto maken${wat ? ` van ${wat}` : ''}`}
        <input ref={camera} type="file" accept="image/*" capture="environment" hidden disabled={uit} onChange={() => kies(camera.current)} />
      </label>
      <label className={`knop knop-rustig ${uit ? 'uit' : ''}`}>
        🖼️ Uit galerij kiezen
        <input ref={galerij} type="file" accept="image/*" multiple={meerdere} hidden disabled={uit} onChange={() => kies(galerij.current)} />
      </label>
    </div>
  )
}

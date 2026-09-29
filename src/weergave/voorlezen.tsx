import { useEffect, useState } from 'react'
import type { Taal } from '../leerlogica'

const SLEUTEL = 'woordexpeditie:geluidUit'
const TAALCODE: Record<Taal, string> = { en: 'en', nl: 'nl' }

/** Geluid uit is een instelling per apparaat. */
export function isGeluidUit(): boolean {
  try {
    return localStorage.getItem(SLEUTEL) === 'ja'
  } catch {
    return false
  }
}

export function zetGeluidUit(uit: boolean) {
  try {
    localStorage.setItem(SLEUTEL, uit ? 'ja' : 'nee')
  } catch {
    // Zonder opslag blijft geluid gewoon aan.
  }
}

function stemVoor(taal: Taal): SpeechSynthesisVoice | null {
  if (!('speechSynthesis' in window)) return null
  const stemmen = speechSynthesis.getVoices().filter((s) => s.lang.toLowerCase().startsWith(TAALCODE[taal]))
  return stemmen.find((s) => s.localService) ?? stemmen[0] ?? null
}

/** Voorlezen met de ingebouwde stem van de telefoon; null als er geen stem voor die taal is of geluid uit staat. */
function useStem(taal: Taal): SpeechSynthesisVoice | null {
  const [stem, setStem] = useState<SpeechSynthesisVoice | null>(() => (isGeluidUit() ? null : stemVoor(taal)))
  useEffect(() => {
    if (!('speechSynthesis' in window) || isGeluidUit()) return
    const bijwerken = () => setStem(stemVoor(taal))
    speechSynthesis.addEventListener('voiceschanged', bijwerken)
    return () => speechSynthesis.removeEventListener('voiceschanged', bijwerken)
  }, [taal])
  return stem
}

/** Een 🔊-knop die alleen verschijnt als er een stem voor de taal is; leest nooit vanzelf voor. */
export function Voorleesknop({ tekst, taal }: { tekst: string; taal: Taal }) {
  const stem = useStem(taal)
  if (!stem) return null
  return (
    <button
      type="button"
      className="voorlees"
      aria-label={`Lees "${tekst}" voor`}
      onClick={() => {
        speechSynthesis.cancel()
        const uiting = new SpeechSynthesisUtterance(tekst)
        uiting.voice = stem
        uiting.lang = stem.lang
        uiting.rate = 0.9
        speechSynthesis.speak(uiting)
      }}
    >
      🔊
    </button>
  )
}

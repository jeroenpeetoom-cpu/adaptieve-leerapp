// Herstelacties in het controlescherm. Pure functies: ze krijgen woord en betekenis en geven nieuwe terug.

export interface Paar {
  woord: string
  betekenis: string
}

const woordenVan = (paar: Paar) => `${paar.woord} ${paar.betekenis}`.split(/\s+/).filter(Boolean)

/** Alle woorden van een paar, om de leerling te laten kiezen waar de betekenis begint. */
export function splitsbareWoorden(paar: Paar): string[] {
  return woordenVan(paar)
}

/**
 * Splitst een paar opnieuw: de woorden vóór `plek` worden het woord, de rest de betekenis.
 * Handig als "colour kleur" in één vak staat, of als de grens verkeerd ligt.
 */
export function splits(paar: Paar, plek: number): Paar {
  const woorden = woordenVan(paar)
  return { woord: woorden.slice(0, plek).join(' '), betekenis: woorden.slice(plek).join(' ') }
}

/**
 * Voegt een paar samen met het volgende: het woord blijft, en alles van het volgende paar komt bij de
 * betekenis. Handig als woord en betekenis als twee losse regels herkend zijn.
 */
export function voegSamen(eerste: Paar, volgende: Paar): Paar {
  return {
    woord: eerste.woord.trim(),
    betekenis: [eerste.betekenis, volgende.woord, volgende.betekenis].map((t) => t.trim()).filter(Boolean).join(' '),
  }
}

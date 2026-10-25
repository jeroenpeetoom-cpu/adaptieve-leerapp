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
 * Voegt een paar samen met het volgende. Heeft het volgende paar twee kanten, dan loopt een zin op de
 * volgende regel door: links bij links (Engels) en rechts bij rechts (Nederlands). Heeft het maar één kant,
 * dan is het een losse betekenis of het eind van een afgebroken betekenis: die komt bij de betekenis.
 */
export function voegSamen(eerste: Paar, volgende: Paar): Paar {
  const plak = (...delen: string[]) => delen.map((t) => t.trim()).filter(Boolean).join(' ')
  if (volgende.betekenis.trim() !== '') {
    return { woord: plak(eerste.woord, volgende.woord), betekenis: plak(eerste.betekenis, volgende.betekenis) }
  }
  return { woord: eerste.woord.trim(), betekenis: plak(eerste.betekenis, volgende.woord) }
}

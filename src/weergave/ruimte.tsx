// Thema "ruimte-expeditie": alleen aankleding. De leerlogica weet niets van dit thema; het thema
// leest alleen hoe ver de sessie is en of de laatste poging vrij opgehaald goed was.

export const MISSIE = (aantal: number) =>
  `🎯 Missie: haal ${aantal} ${aantal === 1 ? 'vraag' : 'vragen'} zelf terug en vind codewoorden.`

/**
 * Eén smalle regel bovenaan tijdens het antwoorden: geprobeerd en zelf onthouden apart, en pauzeren.
 * Beweegt niet, zodat de aandacht bij de vraag blijft (spec layout, beslissingen 2 en 7).
 */
export function Voortgangsregel({ gedaan, totaal, codewoorden, onPauzeer }: { gedaan: number; totaal: number; codewoorden: number; onPauzeer?: () => void }) {
  const fractie = totaal === 0 ? 0 : Math.min(1, gedaan / totaal)
  return (
    <div className="voortgangsregel">
      <div className="voortgangstekst">
        <span aria-label={`${gedaan} van ${totaal} geprobeerd`}>
          {gedaan}/{totaal} geprobeerd
        </span>
        <span aria-label={`${codewoorden} zelf onthouden`}>⭐ {codewoorden} zelf</span>
        {onPauzeer && (
          <button className="pauzeknop" aria-label="Pauzeren" onClick={onPauzeer}>
            ⏸
          </button>
        )}
      </div>
      <span className="voortgangsbalk" aria-hidden="true">
        <span style={{ width: `${fractie * 100}%` }} />
      </span>
    </div>
  )
}

interface Props {
  /** Aantal leeritems in de sessie (groeit als er een terugkomt). */
  totaal: number
  /** Aantal afgeronde leeritems. */
  gedaan: number
  /** Aantal codewoorden: vrij opgehaalde goede antwoorden in deze sessie. */
  codewoorden: number
  /** Toon kort de sprong van het schip, pas na een vrij opgehaald goed antwoord. */
  sprong: boolean
}

/** De sterrenkaart: het schip vliegt bij elk afgerond woord verder, en een fout kost nooit iets. */
export function Sterrenkaart({ totaal, gedaan, codewoorden, sprong }: Props) {
  const fractie = totaal === 0 ? 0 : Math.min(1, gedaan / totaal)
  return (
    <div className="sterrenkaart" role="img" aria-label={`Het ruimteschip is ${gedaan} van de ${totaal} stappen onderweg. ${codewoorden} codewoorden gevonden.`}>
      <div className="baan">
        <span className="planeet" aria-hidden="true">
          🌍
        </span>
        <span className="spoor" aria-hidden="true">
          <span className="spoor-gevuld" style={{ width: `${fractie * 100}%` }} />
        </span>
        <span className="planeet" aria-hidden="true">
          🪐
        </span>
        <span className={`schip ${sprong ? 'schip-sprong' : ''}`} style={{ left: `calc(${fractie} * (100% - 5.5rem) + 1.75rem)` }} aria-hidden="true">
          🚀
        </span>
      </div>
      <p className="codewoorden">
        <span aria-hidden="true">⭐ </span>
        {codewoorden} {codewoorden === 1 ? 'codewoord' : 'codewoorden'} gevonden
      </p>
    </div>
  )
}

export function CodewoordMelding() {
  return (
    <p className="codewoord-melding" role="status">
      <span aria-hidden="true">✨ </span>Codewoord gevonden!
    </p>
  )
}

export const LANDING = (codewoorden: number) =>
  codewoorden === 0
    ? '🪐 Geland! Deze keer geen codewoorden, maar je hebt wel geoefend. Morgen weer.'
    : `🪐 Geland! Je vond ${codewoorden} ${codewoorden === 1 ? 'codewoord' : 'codewoorden'}.`

import { PUNTEN, rangVan, type Puntentelling } from '../leerlogica'

/** De ruimterang met een balk naar de volgende rang. */
export function PuntenBalk({ punten }: { punten: number }) {
  const rang = rangVan(punten)
  return (
    <div className="puntenbalk" role="status" aria-label={`${punten} punten, rang ${rang.naam}`}>
      <p>
        <span aria-hidden="true">🚀 </span>
        <strong>{punten.toLocaleString('nl-NL')} punten</strong> · {rang.naam}
        {rang.volgende && <span className="gedempt"> · nog {(rang.volgende.vanaf - punten).toLocaleString('nl-NL')} tot {rang.volgende.naam}</span>}
      </p>
      <div className="balk" aria-hidden="true">
        <div className="balk-vulling" style={{ width: `${Math.round(rang.voortgang * 100)}%` }} />
      </div>
    </div>
  )
}

/** Wat er deze missie bij kwam, en waar het vandaan komt. */
export function PuntenErbij({ erbij, totaal }: { erbij: Puntentelling; totaal: number }) {
  if (erbij.totaal <= 0) return null
  const delen = [
    erbij.missies > 0 && `missie +${erbij.missies}`,
    erbij.codewoorden > 0 && `${erbij.codewoorden / PUNTEN.codewoord} ${erbij.codewoorden === 1 ? 'codewoord' : 'codewoorden'} +${erbij.codewoorden}`,
    erbij.zelfTeruggehaald > 0 && `${erbij.zelfTeruggehaald / PUNTEN.zelfTeruggehaald}× voor het eerst zelf teruggehaald +${erbij.zelfTeruggehaald}`,
    erbij.laterNogGeweten > 0 && `${erbij.laterNogGeweten / PUNTEN.laterNogGeweten}× later nog geweten +${erbij.laterNogGeweten}`,
    erbij.strategie > 0 && `strategiestap +${erbij.strategie}`,
  ].filter(Boolean)
  const voor = rangVan(totaal - erbij.totaal)
  const na = rangVan(totaal)
  return (
    <div className="punten-erbij">
      <p>
        <strong>🏅 +{erbij.totaal} punten</strong>
      </p>
      <p className="gedempt">{delen.join(' · ')}</p>
      {na.naam !== voor.naam && <p className="nieuwe-rang">🎉 Je bent nu {na.naam}!</p>}
      <PuntenBalk punten={totaal} />
    </div>
  )
}

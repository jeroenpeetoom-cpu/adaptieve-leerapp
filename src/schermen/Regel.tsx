import { useState } from 'react'
import { maakRegelvraag, regelfeedback, type Poging, type Regel, type Regelvraag, type Werkwoord } from '../leerlogica'
import { Voorleesknop } from '../weergave/voorlezen'

/** Het schema van een regel met twee beslisvragen: kolommen voor de eerste vraag, rijen voor de tweede. */
export function Regelschema({ regel, uitgelicht }: { regel: Regel; uitgelicht?: string }) {
  const [kolommen, rijen] = regel.beslisvragen
  return (
    <div className="regelschema" role="table" aria-label={`Schema: ${regel.titel}`}>
      <div className="regelschema-kop" role="row">
        <span role="columnheader" />
        {kolommen.opties.map((k) => (
          <strong key={k} role="columnheader">
            {k}
          </strong>
        ))}
      </div>
      {rijen.opties.map((rij) => (
        <div key={rij} className="regelschema-rij" role="row">
          <strong role="rowheader">{rij}</strong>
          {kolommen.opties.map((kolom) => {
            const b = regel.begrippen.find((x) => x.antwoorden[0] === kolom && x.antwoorden[1] === rij)!
            return (
              <div key={kolom} role="cell" className={`regelvak regelvak-${regel.begrippen.indexOf(b)} ${uitgelicht === b.id ? 'uitgelicht' : ''}`}>
                <span className="regelvak-vorm">
                  {b.emoji} {b.vorm}
                </span>
                <span className="regelvak-betekenis">{b.betekenis}</span>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

/**
 * De eerste les bij een regel (spec regels): een startvraag op de valkuil, het schema met hardop voordoen,
 * één voorbeeld samen en één zelf met de beslisvragen als steun.
 */
export function RegelLes({ regel, werkwoorden, onKlaar }: { regel: Regel; werkwoorden: Werkwoord[]; onKlaar: () => void }) {
  const [stap, setStap] = useState(0)
  const [gok, setGok] = useState<string | null>(null)
  const [keuzes, setKeuzes] = useState<string[]>([])
  const start = regel.begrippen.find((b) => b.id === regel.startvraag.begrip)!
  const samen = maakRegelvraag(regel, regel.begrippen[0].id, 'toepassen', werkwoorden, 'les-samen')
  const zelf = maakRegelvraag(regel, start.id, 'toepassen', werkwoorden, 'les-zelf')
  const zelfAntwoord = regel.begrippen.find((b) => b.antwoorden.every((a, i) => keuzes[i] === a))

  return (
    <div className="leermoment regelles">
      <p className="vraaglabel">
        <span className="chip">📐 nieuwe regel · {regel.titel}</span>
      </p>

      {stap === 0 && (
        <>
          <h3>Raad eerst eens</h3>
          <p className="vraag-klein" lang="en">
            Wat betekent: <strong>{regel.startvraag.zin}</strong> <Voorleesknop tekst={regel.startvraag.zin} taal="en" />
          </p>
          {!gok ? (
            <div className="opties-lijst">
              {regel.begrippen.map((b) => (
                <button key={b.id} className="knop knop-rustig optie" onClick={() => setGok(b.id)}>
                  {b.emoji} {b.situatie}
                </button>
              ))}
            </div>
          ) : (
            <>
              <p className="feedback">
                {gok === start.id
                  ? 'Goed! Dat is precies het lastige stukje.'
                  : `Bijna iedereen denkt dat eerst. Het betekent: ${start.betekenis}. ${regel.valkuil}`}
              </p>
              <button className="knop knop-breed" autoFocus onClick={() => setStap(1)}>
                Verder
              </button>
            </>
          )}
        </>
      )}

      {stap === 1 && (
        <>
          <h3>Zo zit het in elkaar</h3>
          <Regelschema regel={regel} />
          <p className="steuntje">
            <strong>Ik denk even hardop:</strong> {regel.hardop}
          </p>
          <button className="knop knop-breed" autoFocus onClick={() => setStap(2)}>
            Verder
          </button>
        </>
      )}

      {stap === 2 && (
        <>
          <h3>Eén samen</h3>
          <p className="regelsituatie">{samen.situatie}</p>
          <p className="vraag-klein" lang="en">
            {samen.zin}
          </p>
          <ol className="beslisstappen">
            {regel.beslisvragen.map((v, i) => (
              <li key={v.vraag}>
                {v.vraag} <strong>{regel.begrippen[0].antwoorden[i]}</strong>
              </li>
            ))}
          </ol>
          <p className="feedback feedback-goed">
            Dus: <strong lang="en">{samen.heleZin}</strong>
          </p>
          <button className="knop knop-breed" autoFocus onClick={() => setStap(3)}>
            Nu jij
          </button>
        </>
      )}

      {stap === 3 && (
        <>
          <h3>Nu jij</h3>
          <p className="regelsituatie">{zelf.situatie}</p>
          <p className="vraag-klein" lang="en">
            {zelf.zin}
          </p>
          {regel.beslisvragen.map((v, i) =>
            i <= keuzes.length ? (
              <div key={v.vraag} className="beslisvraag">
                <p>{v.vraag}</p>
                <div className="opties">
                  {v.opties.map((o) => (
                    <button
                      key={o}
                      className={`knop knop-rustig optie ${keuzes[i] === o ? 'gekozen' : ''}`}
                      disabled={i < keuzes.length}
                      onClick={() => setKeuzes([...keuzes.slice(0, i), o])}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            ) : null,
          )}
          {keuzes.length === regel.beslisvragen.length && zelfAntwoord && (
            <>
              <p className={`feedback ${zelfAntwoord.id === start.id ? 'feedback-goed' : ''}`}>
                {zelfAntwoord.id === start.id ? (
                  <>
                    Goed! Dus: <strong lang="en">{zelf.heleZin}</strong>
                  </>
                ) : (
                  <>
                    {regelfeedback(regel, start.id, zelfAntwoord.id)} De zin wordt: <strong lang="en">{zelf.heleZin}</strong>
                  </>
                )}
              </p>
              <button className="knop knop-breed" autoFocus onClick={onKlaar}>
                Aan de slag
              </button>
            </>
          )}
        </>
      )}
    </div>
  )
}

/** Wat de leerling koos, terug te vinden uit zijn antwoord (de vorm of de betekenis van een begrip). */
export function gekozenBegrip(regel: Regel, poging: Poging | undefined): string | undefined {
  if (!poging?.antwoord) return undefined
  return regel.begrippen.find((b) => b.vorm === poging.antwoord || b.betekenis === poging.antwoord)?.id
}

/** Een regelvraag in de sessie: kiezen uit de begrippen, met uitleg na het antwoord. */
export function RegelVraag({
  regel,
  vraag,
  laatste,
  afgesloten,
  bezig,
  onKies,
  onNietGeweten,
}: {
  regel: Regel
  vraag: Regelvraag
  laatste: Poging | undefined
  afgesloten: boolean
  bezig: boolean
  onKies: (begripId: string) => void
  onNietGeweten: () => void
}) {
  const gekozen = gekozenBegrip(regel, laatste)
  return (
    <>
      {vraag.situatie && <p className="regelsituatie">{vraag.situatie}</p>}
      <p className="vraag vraag-regel" lang="en">
        {afgesloten ? vraag.heleZin : vraag.zin}{' '}
        {vraag.richting === 'begrijpen' && <Voorleesknop tekst={vraag.heleZin} taal="en" vanzelf />}
      </p>
      {afgesloten && laatste ? (
        <div className={`feedback ${laatste.oordeel === 'goed' ? 'feedback-goed' : ''}`} role="status">
          {laatste.oordeel === 'goed' ? (
            <p>Goed zo!</p>
          ) : (
            <>
              <p>{gekozen ? regelfeedback(regel, vraag.goed, gekozen) : `Het is "${regel.begrippen.find((b) => b.id === vraag.goed)!.vorm}".`}</p>
              <Regelschema regel={regel} uitgelicht={vraag.goed} />
            </>
          )}
        </div>
      ) : (
        <>
          <p className="label">{vraag.richting === 'begrijpen' ? 'Wat betekent dit?' : 'Welke vorm hoort op de puntjes?'}</p>
          <div className={vraag.richting === 'begrijpen' ? 'opties-lijst' : 'opties'}>
            {vraag.opties.map((o) => (
              <button key={o.id} className="knop knop-rustig optie" disabled={bezig} onClick={() => onKies(o.id)} lang={vraag.richting === 'toepassen' ? 'en' : 'nl'}>
                {o.tekst}
              </button>
            ))}
          </div>
          <p className="tekstlinks">
            <button className="link" disabled={bezig} onClick={onNietGeweten}>
              Weet ik niet
            </button>
          </p>
        </>
      )}
    </>
  )
}

import { useState, type FormEvent } from 'react'
import { begripUitGetypt, maakRegelvraag, maakZelfuitleg, regelfeedback, zelfuitlegNu, type Poging, type Regel, type Regelsteun, type Regelvraag, type Bronwoord } from '../leerlogica'
import { Voorleesknop } from '../weergave/voorlezen'

/** Het schema van een regel met twee beslisvragen: kolommen voor de eerste vraag, rijen voor de tweede. */
export function Regelschema({ regel, uitgelicht }: { regel: Regel; uitgelicht?: string }) {
  // Eén beslisvraag met veel antwoorden (zoals voorzetsels van tijd): een lijst, van vroeg naar laat.
  if (regel.schema === 'lijst') {
    return (
      <ul className="regellijst" aria-label={`Schema: ${regel.titel}`}>
        {regel.begrippen.map((b, i) => (
          <li key={b.id} className={`regelvak regelvak-${i % 4} ${uitgelicht === b.id ? 'uitgelicht' : ''}`}>
            <span className="regelvak-vorm">
              {b.emoji} {b.vorm} <span className="regelvak-betekenis">= {b.betekenis}</span>
            </span>
            <span className="regelvak-betekenis">bij {b.antwoorden[0]}</span>
          </li>
        ))}
      </ul>
    )
  }
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
export function RegelLes({ regel, werkwoorden, onKlaar }: { regel: Regel; werkwoorden: Bronwoord[]; onKlaar: () => void }) {
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
          <p className="gedempt">📐 Nieuw in je gereedschapskist: schema met beslisvragen. Handig bij elke regel met woorden die op elkaar lijken.</p>
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
  return regel.begrippen.find((b) => b.vorm === poging.antwoord || b.betekenis === poging.antwoord)?.id ?? begripUitGetypt(regel, poging.antwoord)
}

/**
 * Een regelvraag in de sessie (spec regels, R2). De steun wordt afgebouwd: eerst beide beslisvragen, dan
 * één, dan direct kiezen, en bij toepassen uiteindelijk de vorm zelf typen. Na het antwoord volgt uitleg.
 */
export function RegelVraag({
  regel,
  vraag,
  steun,
  zaad,
  laatste,
  afgesloten,
  bezig,
  onKies,
  onTyp,
  onNietGeweten,
}: {
  regel: Regel
  vraag: Regelvraag
  steun: Regelsteun
  /** Vast per vraag, voor de keuze of er een zelfuitleg komt. */
  zaad: string
  laatste: Poging | undefined
  afgesloten: boolean
  bezig: boolean
  /** Een gekozen begrip; `metSteun` als de beslisvragen hielpen. */
  onKies: (begripId: string, metSteun: boolean) => void
  onTyp: (tekst: string) => void
  onNietGeweten: () => void
}) {
  const [keuzes, setKeuzes] = useState<string[]>([])
  const [getypt, setGetypt] = useState('')
  const [uitleg, setUitleg] = useState<number | null>(null)
  const gekozen = gekozenBegrip(regel, laatste)
  const tekstVan = (id: string) => {
    const b = regel.begrippen.find((x) => x.id === id)!
    return vraag.richting === 'begrijpen' ? `${b.emoji} ${b.situatie}` : b.vorm
  }

  function kiesStap(i: number, optie: string) {
    const nieuw = [...keuzes.slice(0, i), optie]
    setKeuzes(nieuw)
    if (steun === 'twee-vragen' && nieuw.length === regel.beslisvragen.length) {
      const b = regel.begrippen.find((x) => x.antwoorden.every((a, j) => nieuw[j] === a))
      if (b) onKies(b.id, true)
    }
  }

  function typ(e: FormEvent) {
    e.preventDefault()
    if (getypt.trim()) onTyp(getypt)
  }

  const beslisvraag = (i: number) => {
    const v = regel.beslisvragen[i]
    return (
      <div key={v.vraag} className="beslisvraag">
        <p>{v.vraag}</p>
        <div className="opties">
          {v.opties.map((o) => (
            <button key={o} className={`knop knop-rustig optie ${keuzes[i] === o ? 'gekozen' : ''}`} disabled={bezig} onClick={() => kiesStap(i, o)}>
              {o}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      {vraag.situatie && <p className="regelsituatie">{vraag.situatie}</p>}
      <p className="vraag vraag-regel" lang="en">
        {afgesloten ? vraag.heleZin : vraag.zin}{' '}
        {vraag.richting === 'begrijpen' && <Voorleesknop tekst={vraag.heleZin} taal="en" vanzelf />}
      </p>
      {afgesloten && laatste ? (
        <div className={`feedback ${laatste.oordeel === 'goed' ? 'feedback-goed' : ''}`} role="status">
          {laatste.oordeel === 'goed' && (
            <p>
              {steun === 'kiezen' || steun === 'typen' ? 'Goed zo, helemaal zelf!' : 'Goed! Met de twee vragen kom je er steeds.'} "
              {regel.begrippen.find((b) => b.id === vraag.goed)!.vorm}" = {regel.begrippen.find((b) => b.id === vraag.goed)!.betekenis}.
            </p>
          )}
          {laatste.oordeel === 'goed' && (steun === 'kiezen' || steun === 'typen') && zelfuitlegNu(zaad) && (() => {
            // Zelfuitleg (R3): waarom dit begrip en niet het begrip dat erop lijkt?
            const z = maakZelfuitleg(regel, vraag.goed, zaad)
            return (
              <div className="zelfuitleg">
                <p>
                  <strong>🤔 {z.vraag}</strong>
                </p>
                <div className="opties-lijst">
                  {z.opties.map((o, i) => (
                    <button
                      key={o.tekst}
                      className={`knop knop-rustig optie ${uitleg === i ? (o.goed ? 'uitleg-goed' : 'uitleg-mis') : ''}`}
                      disabled={uitleg !== null}
                      onClick={() => setUitleg(i)}
                    >
                      {o.tekst}
                    </button>
                  ))}
                </div>
                {uitleg !== null && (
                  <p className="gedempt">
                    {z.opties[uitleg].goed
                      ? 'Precies. Zo kun je het ook aan een ander uitleggen.'
                      : `Niet helemaal. ${z.opties.find((o) => o.goed)!.tekst}`}
                  </p>
                )}
              </div>
            )
          })()}
          {laatste.oordeel !== 'goed' && (
            <>
              <p>{gekozen ? regelfeedback(regel, vraag.goed, gekozen) : `Het is "${regel.begrippen.find((b) => b.id === vraag.goed)!.vorm}".`}</p>
              <Regelschema regel={regel} uitgelicht={vraag.goed} />
            </>
          )}
        </div>
      ) : steun === 'typen' ? (
        <form onSubmit={typ}>
          <label className="label" htmlFor="regelantwoord">
            Typ wat er op de puntjes hoort
          </label>
          <input
            id="regelantwoord"
            className="invoer"
            value={getypt}
            onChange={(e) => setGetypt(e.target.value)}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            lang="en"
            autoFocus
          />
          <button className="knop knop-breed" type="submit" disabled={bezig || getypt.trim() === ''}>
            Controleer
          </button>
          <p className="tekstlinks">
            <button className="link" type="button" disabled={bezig} onClick={onNietGeweten}>
              Weet ik niet
            </button>
          </p>
        </form>
      ) : (
        <>
          {steun === 'twee-vragen' && regel.beslisvragen.map((_, i) => (i <= keuzes.length ? beslisvraag(i) : null))}
          {steun === 'een-vraag' && (
            <>
              {beslisvraag(0)}
              {keuzes.length > 0 && (
                <>
                  <p className="label">Welke past?</p>
                  <div className="opties">
                    {regel.begrippen
                      .filter((b) => b.antwoorden[0] === keuzes[0])
                      .map((b) => (
                        <button key={b.id} className="knop knop-rustig optie" disabled={bezig} onClick={() => onKies(b.id, true)} lang={vraag.richting === 'toepassen' ? 'en' : 'nl'}>
                          {tekstVan(b.id)}
                        </button>
                      ))}
                  </div>
                </>
              )}
            </>
          )}
          {steun === 'kiezen' && (
            <>
              <p className="label">{vraag.richting === 'begrijpen' ? 'Wat betekent dit?' : 'Welke vorm hoort op de puntjes?'}</p>
              <div className={vraag.richting === 'begrijpen' ? 'opties-lijst' : 'opties'}>
                {vraag.opties.map((o) => (
                  <button key={o.id} className="knop knop-rustig optie" disabled={bezig} onClick={() => onKies(o.id, false)} lang={vraag.richting === 'toepassen' ? 'en' : 'nl'}>
                    {o.tekst}
                  </button>
                ))}
              </div>
            </>
          )}
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

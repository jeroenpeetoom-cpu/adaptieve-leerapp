import { useEffect, useMemo, useRef, useState } from 'react'
import {
  kiesRonde,
  rondebewijs,
  somstatus,
  STANDAARD_INSTELLINGEN,
  tafelstand,
  trucVoor,
  type Som,
  type Tafelpoging,
  type Tafelstand,
  type Tafeluitkomst,
  type Truc,
} from '../leerlogica'
import type { Database } from '../opslag/database'

const TZ = STANDAARD_INSTELLINGEN.tijdzone
const nu = () => new Date().toISOString()
/** Een som die misgaat, komt zoveel sommen later nog een keer terug. */
const TERUG_NA = 3

const STATUSTEKEN = { nieuw: '·', bezig: '…', vlot: '✓', beheerst: '★' } as const

/** Het raster van alle sommen: zo ziet de leerling wat er al zit (kennis), los van de trucs (strategie). */
function Raster({ stand }: { stand: Tafelstand }) {
  return (
    <div className="tafelraster" role="table" aria-label="Alle sommen">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((b) => {
        const actief = stand.actief.includes(b)
        return (
          <div key={b} className={`tafelrij ${actief ? '' : 'tafelrij-dicht'}`} role="row">
            <span className="tafelrij-kop" role="rowheader">
              {actief ? '' : '🔒'}
              {b}
            </span>
            {Array.from({ length: 10 }, (_, j) => {
              const st = stand.sommen.get(`${j + 1}x${b}`)!
              const status = somstatus(st)
              return (
                <span key={j} role="cell" className={`tafelcel tafelcel-${status}`} title={`${j + 1} × ${b}: ${status}`}>
                  {STATUSTEKEN[status]}
                </span>
              )
            })}
          </div>
        )
      })}
      <p className="gedempt tafellegenda">· nieuw &nbsp; … bezig &nbsp; ✓ vlot &nbsp; ★ beheerst (2 dagen binnen 3 seconden)</p>
    </div>
  )
}

interface Beurt {
  som: Som
  /** Een herhaling binnen de ronde, na een fout. */
  terug?: boolean
}

export function TafelScherm({ db, onTerug, onBezig }: { db: Database; onTerug: () => void; onBezig?: (bezig: boolean) => void }) {
  const [pogingen, setPogingen] = useState<Tafelpoging[] | null>(null)
  const [ronde, setRonde] = useState<{ id: string; beurten: Beurt[]; instap: boolean } | null>(null)
  const [klaar, setKlaar] = useState<{ id: string; instap: boolean } | null>(null)

  useEffect(() => {
    void db.tafelpogingen.toArray().then(setPogingen)
  }, [db])
  useEffect(() => {
    onBezig?.(ronde !== null)
  }, [ronde, onBezig])

  const stand = useMemo(() => (pogingen ? tafelstand(pogingen, TZ) : null), [pogingen])
  if (!pogingen || !stand) return null

  function start() {
    const keuze = kiesRonde(stand!, nu(), TZ, Math.random)
    setKlaar(null)
    setRonde({ id: crypto.randomUUID(), beurten: keuze.sommen.map((som) => ({ som })), instap: keuze.instap })
  }

  if (ronde) {
    return (
      <Ronde
        key={ronde.id}
        ronde={ronde}
        stand={stand}
        onPoging={async (p) => {
          await db.tafelpogingen.put(p)
          setPogingen((oud) => [...(oud ?? []), p])
        }}
        onKlaar={() => {
          setKlaar({ id: ronde.id, instap: ronde.instap })
          setRonde(null)
        }}
      />
    )
  }

  const bewijs = klaar ? rondebewijs(pogingen, klaar.id, TZ) : null
  const trucs = klaar ? [...new Set(pogingen.filter((p) => p.rondeId === klaar.id && p.truc).map((p) => p.truc!))] : []
  const beheerst = [...stand.sommen.values()].filter((s) => s.beheerst).length

  return (
    <section className="kaart tafels">
      <h2>✖️ Tafels</h2>
      {bewijs && bewijs.totaal > 0 && (
        <div className="feedback feedback-goed tafelbewijs" role="status">
          <p>
            <strong>Ronde klaar!</strong> {bewijs.goed} van de {bewijs.totaal} goed, {bewijs.opDoel} binnen 3 seconden.
          </p>
          {bewijs.sneller > 0 && (
            <p>
              ⚡ {bewijs.sneller} {bewijs.sneller === 1 ? 'som ging' : 'sommen gingen'} sneller dan de vorige keer.
            </p>
          )}
          {bewijs.nuBeheerst > 0 && <p>★ {bewijs.nuBeheerst} {bewijs.nuBeheerst === 1 ? 'som zit' : 'sommen zitten'} er nu echt in.</p>}
          {bewijs.nieuweTafels.length > 0 && <p>🔓 Nieuwe tafel erbij: {bewijs.nieuweTafels.join(', ')}.</p>}
          {klaar?.instap && stand.snel.length > 0 && (
            <p>Deze tafels kon je al vlot: {stand.snel.join(', ')}. Daar ga je meteen sneller mee verder.</p>
          )}
          {trucs.length > 0 && <p>🧰 Trucs die je zag: {trucs.join(', ')}. Probeer ze de volgende keer zelf.</p>}
        </div>
      )}
      {!stand.instapGedaan ? (
        <p>
          Eerst kijken wat je al kunt: van elke tafel twee sommen. Je hebt 10 seconden per som. Typ het antwoord: is het goed, dan gaat het
          vanzelf door.
        </p>
      ) : (
        <p className="gedempt">
          Je oefent nu de tafels van {[...stand.actief].sort((a, b) => a - b).join(', ')}. Hoe sneller je een som weet, hoe korter de tijd
          wordt, tot 3 seconden. {beheerst > 0 && `${beheerst} van de 100 sommen zitten er al echt in.`}
        </p>
      )}
      <button className="knop knop-breed" onClick={start}>
        {!stand.instapGedaan ? 'Laat zien wat je al kunt' : klaar ? 'Nog een ronde' : 'Start een ronde'}
      </button>
      <Raster stand={stand} />
      <button className="link" onClick={onTerug}>
        ← Terug
      </button>
    </section>
  )
}

function Ronde({
  ronde,
  stand,
  onPoging,
  onKlaar,
}: {
  ronde: { id: string; beurten: Beurt[]; instap: boolean }
  stand: Tafelstand
  onPoging: (p: Tafelpoging) => Promise<void>
  onKlaar: () => void
}) {
  const [beurten, setBeurten] = useState(ronde.beurten)
  const [index, setIndex] = useState(0)
  const [invoer, setInvoer] = useState('')
  /** Na een fout of te laat: het goede antwoord en een truc; de leerling typt het goede antwoord over. */
  const [na, setNa] = useState<{ uitkomst: Tafeluitkomst; truc: Truc } | null>(null)
  const begin = useRef(0)
  const veld = useRef<HTMLInputElement>(null)
  const beurt = beurten[index]
  const limietSec = ronde.instap ? 10 : (stand.sommen.get(beurt?.som.id ?? '')?.limietSec ?? 10)

  function volgende() {
    setNa(null)
    setInvoer('')
    if (index + 1 >= beurten.length) onKlaar()
    else setIndex(index + 1)
  }

  function beoordeel(uitkomst: Tafeluitkomst, antwoord: string) {
    const tijdMs = Math.round(performance.now() - begin.current)
    const truc = uitkomst === 'goed' ? undefined : trucVoor(beurt.som, stand)
    void onPoging({
      id: `${ronde.id}-${index}`,
      som: beurt.som.id,
      antwoord,
      uitkomst,
      tijdMs,
      limietSec,
      tijdstip: nu(),
      rondeId: ronde.id,
      instap: ronde.instap || undefined,
      truc: truc && !ronde.instap ? truc.naam : undefined,
    })
    if (uitkomst === 'goed') return volgende()
    // In de instapronde geen uitleg tussendoor: alleen kijken wat er al zit.
    if (ronde.instap) return volgende()
    if (!beurt.terug && !beurten.slice(index + 1).some((b) => b.som.id === beurt.som.id)) {
      const kopie = [...beurten]
      kopie.splice(Math.min(index + 1 + TERUG_NA, kopie.length), 0, { som: beurt.som, terug: true })
      setBeurten(kopie)
    }
    setInvoer('')
    setNa({ uitkomst, truc: truc! })
  }

  // De tijd loopt vanaf het moment dat de som verschijnt.
  useEffect(() => {
    if (na || !beurt) return
    begin.current = performance.now()
    veld.current?.focus()
    const klok = window.setTimeout(() => {
      const waarde = veld.current?.value.trim() ?? ''
      const goed = String(beurt.som.uitkomst)
      beoordeel(waarde === '' || goed.startsWith(waarde) ? 'te laat' : 'fout', waarde)
    }, limietSec * 1000)
    return () => window.clearTimeout(klok)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, na])

  if (!beurt) return null
  const goedAntwoord = String(beurt.som.uitkomst)

  function typ(waarde: string) {
    const schoon = waarde.replace(/\D/g, '')
    setInvoer(schoon)
    if (schoon === goedAntwoord) {
      if (na) volgende()
      else beoordeel('goed', schoon)
    }
  }

  return (
    <section className="kaart tafelronde">
      <p className="voortgang">
        {ronde.instap ? 'Kijken wat je al kunt' : 'Tafels'} · {Math.min(index + 1, beurten.length)} van {beurten.length}
      </p>
      <p className="vraag tafelsom" aria-live="polite">
        {beurt.som.a} × {beurt.som.b} {na ? `= ${goedAntwoord}` : ''}
      </p>
      {!na ? (
        <div className="tafeltijd" aria-hidden="true">
          <span key={`${index}`} style={{ animationDuration: `${limietSec}s` }} />
        </div>
      ) : (
        <div className="feedback feedback-bijna" role="status">
          <p>{na.uitkomst === 'te laat' ? 'Nog even oefenen.' : 'Bijna.'} Het is {goedAntwoord}.</p>
          <p className="tafeltruc">
            🧰 <strong>{na.truc.naam}:</strong> {na.truc.uitleg}
          </p>
          <p className="gedempt">Typ {goedAntwoord} en je gaat verder. Deze som komt zo nog een keer.</p>
        </div>
      )}
      <input
        ref={veld}
        className="invoer tafelinvoer"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        aria-label={`${beurt.som.a} keer ${beurt.som.b}`}
        value={invoer}
        onChange={(e) => typ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !na && invoer !== '') beoordeel(invoer === goedAntwoord ? 'goed' : 'fout', invoer)
        }}
      />
      {!na && (
        <button className="knop knop-rustig knop-breed" disabled={invoer === ''} onMouseDown={(e) => e.preventDefault()} onClick={() => beoordeel(invoer === goedAntwoord ? 'goed' : 'fout', invoer)}>
          Klaar
        </button>
      )}
      <button className="link" onClick={onKlaar}>
        ✓ Klaar voor nu
      </button>
    </section>
  )
}

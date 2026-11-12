import { useEffect, useMemo, useRef, useState } from 'react'
import {
  kiesRonde,
  lastigsteSom,
  rondebewijs,
  somstatus,
  STANDAARD_INSTELLINGEN,
  tafelplannen,
  tafelplanVraag,
  tafelstand,
  trucVoor,
  uitkomstTafelvoornemen,
  type Som,
  type Tafelpoging,
  type Tafelstand,
  type Tafeluitkomst,
  type Tafelvoornemen,
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
  const [ronde, setRonde] = useState<{ id: string; beurten: Beurt[]; instap: boolean; voornemen: Tafelvoornemen | null } | null>(null)
  const [klaar, setKlaar] = useState<{ id: string; instap: boolean; voornemen: Tafelvoornemen | null } | null>(null)
  const [voornemen, setVoornemen] = useState<Tafelvoornemen | null>(null)
  const [planVariant, setPlanVariant] = useState(0)
  /** Na de ronde: de som waar de leerling een plan voor kiest (spec tafels, beslissing 6). */
  const [planVoor, setPlanVoor] = useState<Som | null>(null)

  useEffect(() => {
    void (async () => {
      setVoornemen(await db.leesMeta<Tafelvoornemen | null>('tafelvoornemen', null))
      setPlanVariant(await db.leesMeta('tafelplanVariant', 0))
      setPogingen(await db.tafelpogingen.toArray())
    })()
  }, [db])
  useEffect(() => {
    onBezig?.(ronde !== null)
  }, [ronde, onBezig])

  const stand = useMemo(() => (pogingen ? tafelstand(pogingen, TZ) : null), [pogingen])
  if (!pogingen || !stand) return null

  function start() {
    const keuze = kiesRonde(stand!, nu(), TZ, Math.random, undefined, voornemen ? [voornemen.som] : [])
    setKlaar(null)
    setRonde({ id: crypto.randomUUID(), beurten: keuze.sommen.map((som) => ({ som })), instap: keuze.instap, voornemen })
  }

  async function rondeKlaar() {
    const r = ronde!
    setRonde(null)
    setKlaar({ id: r.id, instap: r.instap, voornemen: r.voornemen })
    const alle = await db.tafelpogingen.toArray()
    // Een plan dat nu getest is, is klaar; wat ervan kwam staat in het bewijs.
    if (r.voornemen && uitkomstTafelvoornemen(r.voornemen, alle)) {
      await db.schrijfMeta('tafelvoornemen', null)
      setVoornemen(null)
    }
    if (!r.instap) setPlanVoor(lastigsteSom(alle, r.id) ?? null)
  }

  async function kiesPlan(tekst: string) {
    const nieuw = { som: planVoor!.id, plan: tekst, tijdstip: nu() }
    await db.schrijfMeta('tafelvoornemen', nieuw)
    await db.schrijfMeta('tafelplanVariant', planVariant + 1)
    setVoornemen(nieuw)
    setPlanVariant(planVariant + 1)
    setPlanVoor(null)
  }

  if (ronde) {
    return (
      <Ronde
        key={ronde.id}
        ronde={ronde}
        stand={stand}
        onPoging={async (p) => {
          await db.tafelpogingen.put(p)
          setPogingen((oud) => [...(oud ?? []).filter((x) => x.id !== p.id), p])
        }}
        onKlaar={() => void rondeKlaar()}
      />
    )
  }

  // Eerst het plan, bovenaan en alleen: een vraag onder het bewijs wordt overgeslagen.
  if (planVoor) {
    return (
      <section className="kaart tafels">
        <p className="voortgang">Ronde klaar · nog één vraag</p>
        <h2 className="tafelplanvraag">{tafelplanVraag(planVariant, planVoor)}</h2>
        <div className="opties-lijst">
          {tafelplannen(planVoor, stand).map((p) => (
            <button key={p.id} className="knop knop-rustig optie" onClick={() => void kiesPlan(p.tekst)}>
              {p.tekst}
            </button>
          ))}
        </div>
        <button className="link" onClick={() => setPlanVoor(null)}>
          Nu niet
        </button>
      </section>
    )
  }

  const bewijs = klaar ? rondebewijs(pogingen, klaar.id, TZ) : null
  const trucs = klaar ? [...new Set(pogingen.filter((p) => p.rondeId === klaar.id && p.truc).map((p) => p.truc!))] : []
  const planUitkomst = klaar?.voornemen ? uitkomstTafelvoornemen(klaar.voornemen, pogingen) : null
  const planSom = klaar?.voornemen?.som.replace('x', ' × ')
  const beheerst = [...stand.sommen.values()].filter((s) => s.beheerst).length

  return (
    <section className="kaart tafels">
      <h2>✖️ Tafels</h2>
      {bewijs && bewijs.totaal > 0 && (
        <div className="feedback feedback-goed tafelbewijs" role="status">
          <p>
            <strong>Ronde klaar!</strong> {bewijs.goed} van de {bewijs.totaal} goed, {bewijs.opDoel} binnen 3 seconden.
          </p>
          {planUitkomst && planUitkomst.poging.rondeId === klaar!.id && (
            <p>
              📌 Je plan bij {planSom} ({klaar!.voornemen!.plan.replace(/^\S+\s/, '').toLowerCase()}):{' '}
              {planUitkomst.uitkomst === 'gelukt'
                ? `het werkte, binnen ${sec(planUitkomst.poging.tijdMs)} goed!`
                : 'nog niet gelukt. Hij komt terug, probeer het nog eens.'}
            </p>
          )}
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
      {voornemen && !planUitkomst && (
        <p className="voornemen">📌 Je plan voor {voornemen.som.replace('x', ' × ')}: {voornemen.plan.replace(/^\S+\s/, '').toLowerCase()}. Die som komt de volgende ronde.</p>
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

const sec = (ms: number) => {
  const n = Math.max(1, Math.round(ms / 1000))
  return n === 1 ? '1 seconde' : `${n} seconden`
}

interface Na {
  uitkomst: Tafeluitkomst
  truc: Truc
}

function Ronde({
  ronde,
  stand,
  onPoging,
  onKlaar,
}: {
  ronde: { id: string; beurten: Beurt[]; instap: boolean; voornemen: Tafelvoornemen | null }
  stand: Tafelstand
  onPoging: (p: Tafelpoging) => Promise<void>
  onKlaar: () => void
}) {
  const [beurten, setBeurten] = useState(ronde.beurten)
  const [index, setIndex] = useState(0)
  const [invoer, setInvoer] = useState('')
  /** Na een fout of te laat: het goede antwoord en een truc; de leerling typt het goede antwoord over. */
  const [na, setNa] = useState<Na | null>(null)
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
    const poging: Tafelpoging = {
      id: `${ronde.id}-${index}`,
      som: beurt.som.id,
      antwoord,
      uitkomst,
      tijdMs: Math.round(performance.now() - begin.current),
      limietSec,
      tijdstip: nu(),
      rondeId: ronde.id,
      instap: ronde.instap || undefined,
    }
    const truc = uitkomst === 'goed' || ronde.instap ? undefined : trucVoor(beurt.som, stand)
    void onPoging(truc ? { ...poging, truc: truc.naam } : poging)
    // In de instapronde geen uitleg tussendoor: alleen kijken wat er al zit.
    if (uitkomst === 'goed' || ronde.instap) return volgende()
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
  const somTekst = `${beurt.som.a} × ${beurt.som.b}`
  const metPlan = !na && ronde.voornemen?.som === beurt.som.id

  function typ(waarde: string) {
    const schoon = waarde.replace(/\D/g, '')
    setInvoer(schoon)
    if (schoon === goedAntwoord) {
      if (na) volgende()
      else beoordeel('goed', schoon)
    }
  }

  return (
    <section className="kaart tafelronde sessie-twee">
      <p className="voortgang">
        {ronde.instap ? 'Kijken wat je al kunt' : 'Tafels'} · {Math.min(index + 1, beurten.length)} van {beurten.length}
      </p>
      <div className="sessie-vraag">
      {metPlan && <p className="voornemen">📌 Je plan: {ronde.voornemen!.plan.replace(/^\S+\s/, '').toLowerCase()}</p>}
      <p className="vraag tafelsom" aria-live="polite">
        {somTekst} {na ? `= ${goedAntwoord}` : ''}
      </p>
      {!na && (
        <div className="tafeltijd" aria-hidden="true">
          <span key={`${index}`} style={{ animationDuration: `${limietSec}s` }} />
        </div>
      )}
      </div>
      <div className="sessie-antwoord">
      {na && (
        <div className="feedback feedback-bijna" role="status">
          <p>
            {na.uitkomst === 'te laat' ? 'Nog even oefenen.' : 'Bijna.'} Het is {goedAntwoord}.
          </p>
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
      </div>
    </section>
  )
}

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Bron, Kaart, Plek, Plekrichting } from '../bronnen/model'
import { controleerBestand, herkenTweeKeer } from '../herkenning/herkenner'
import { echteDb } from '../opslag/database'
import { koppelAfkortingen } from '../topo/afkortingen'
import { dekAf, naarJpeg } from '../topo/kaartbeeld'
import { labelsUit, midden, vakRond } from '../topo/labels'
import { leesWerkblad } from '../topo/werkblad'
import { FotoKnoppen } from './FotoKnoppen'

const SOORTEN: { waarde: Plek['soort']; label: string }[] = [
  { waarde: 'land', label: 'Land' },
  { waarde: 'stad', label: 'Stad' },
  { waarde: 'water', label: 'Water' },
  { waarde: 'gebied', label: 'Gebied' },
]

export const PLEKRICHTINGEN: { label: string; waarde: Plekrichting[] }[] = [
  { label: 'Allebei: aanwijzen én benoemen', waarde: ['aanwijzen', 'benoemen'] },
  { label: 'Aanwijzen: "Waar ligt …?"', waarde: ['aanwijzen'] },
  { label: 'Benoemen: "Wat ligt hier?"', waarde: ['benoemen'] },
]

type Tikmodus = { soort: 'plaats'; plekId: string } | { soort: 'afdekken' } | null

/** De kaart met genummerde stippen; tikken plaatst een plek of dekt tekst af. */
function KaartMetPlekken({
  kaart,
  plekken,
  gekozen,
  afgedekt,
  onTik,
  onKies,
  groot,
}: {
  kaart: Kaart
  plekken: Plek[]
  gekozen: string | null
  afgedekt: { x: number; y: number }[]
  onTik: ((x: number, y: number) => void) | null
  onKies: (plekId: string) => void
  groot: boolean
}) {
  return (
    <div className={`kaartvenster ${groot ? 'groot' : ''}`}>
      <div
        className={`kaartbeeld ${onTik ? 'tikbaar' : ''}`}
        onClick={(e) => {
          if (!onTik) return
          const r = e.currentTarget.getBoundingClientRect()
          onTik((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height)
        }}
      >
        <img src={kaart.beeld} alt="De kaart" draggable={false} />
        {plekken.map(
          (p, i) =>
            p.x !== null &&
            p.y !== null && (
              <button
                key={p.id}
                className={`kaartstip ${gekozen === p.id ? 'gekozen' : ''} ${p.alternatieven.length > 0 ? 'twijfel' : ''}`}
                style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
                onClick={(e) => {
                  e.stopPropagation()
                  onKies(p.id)
                }}
                aria-label={`${i + 1}: ${p.naam}`}
              >
                {i + 1}
              </button>
            ),
        )}
        {afgedekt.map((a, i) => (
          <span key={i} className="afdekstip" style={{ left: `${a.x * 100}%`, top: `${a.y * 100}%` }} aria-hidden="true" />
        ))}
      </div>
    </div>
  )
}

export function TopoBronScherm({ bronId, onTerug }: { bronId: string; onTerug: () => void }) {
  const [bron, setBron] = useState<Bron | null>(null)
  const [kaart, setKaart] = useState<Kaart | null>(null)
  const [plekken, setPlekken] = useState<Plek[]>([])
  const [kaartFoto, setKaartFoto] = useState<File | null>(null)
  const [werkbladFoto, setWerkbladFoto] = useState<File | null>(null)
  const [bezig, setBezig] = useState<{ fractie: number; stap: string } | null>(null)
  const [melding, setMelding] = useState<string | null>(null)
  const [gekozen, setGekozen] = useState<string | null>(null)
  const [tikmodus, setTikmodus] = useState<Tikmodus>(null)
  const [groot, setGroot] = useState(false)
  const lijstRef = useRef<HTMLUListElement>(null)

  const laad = useCallback(async () => {
    setBron((await echteDb.bronnen.get(bronId)) ?? null)
    setKaart((await echteDb.kaarten.where('bronId').equals(bronId).first()) ?? null)
    setPlekken((await echteDb.plekken.where('bronId').equals(bronId).toArray()).sort((a, b) => a.volgorde - b.volgorde))
  }, [bronId])

  useEffect(() => {
    void laad()
  }, [laad])

  async function herkennen() {
    if (!kaartFoto || !werkbladFoto) return
    const fout = controleerBestand(kaartFoto) ?? controleerBestand(werkbladFoto)
    if (fout) return setMelding(fout)
    setMelding(null)
    try {
      setBezig({ fractie: 0, stap: 'Werkblad lezen' })
      const wb = await herkenTweeKeer(werkbladFoto, 'kolom', (f, stap) => setBezig({ fractie: f / 2, stap: `Werkblad: ${stap.toLowerCase()}` }))
      const werkblad = leesWerkblad(wb.varianten)
      setBezig({ fractie: 0.5, stap: 'Kaart lezen' })
      const k = await herkenTweeKeer(kaartFoto, 'losse tekst', (f, stap) => setBezig({ fractie: 0.5 + f / 2, stap: `Kaart: ${stap.toLowerCase()}` }))
      const voorstel = koppelAfkortingen(labelsUit(k.varianten, k.breedte, k.hoogte), werkblad.plekken, werkblad.woorden)

      const nieuweKaart: Kaart = {
        id: crypto.randomUUID(),
        bronId,
        beeld: naarJpeg(k.canvas),
        breedte: k.breedte,
        hoogte: k.hoogte,
        blind: false,
        afgedekt: [],
      }
      // Toetsstof eerst, en daarbinnen de grote dingen (spec topografie, vraag 45).
      const rang = { land: 0, water: 1, gebied: 2, stad: 3 } as const
      const opVolgorde = [...voorstel].sort(
        (a, b) => Number(b.toetsstof) - Number(a.toetsstof) || rang[a.soort] - rang[b.soort],
      )
      const nieuwePlekken: Plek[] = opVolgorde.map((v, i) => {
        const m = v.label ? midden(v.label) : null
        return {
          id: crypto.randomUUID(),
          bronId,
          kaartId: nieuweKaart.id,
          naam: v.naam,
          soort: v.soort,
          toetsstof: v.toetsstof,
          x: m?.x ?? null,
          y: m?.y ?? null,
          labelVak: v.label ? { x0: v.label.x0, y0: v.label.y0, x1: v.label.x1, y1: v.label.y1 } : null,
          alternatieven: v.alternatieven,
          bevestigd: false,
          bronversie: 1,
          volgorde: i + 1,
        }
      })
      await echteDb.transaction('rw', echteDb.kaarten, echteDb.plekken, async () => {
        await echteDb.plekken.where('bronId').equals(bronId).delete()
        await echteDb.kaarten.where('bronId').equals(bronId).delete()
        await echteDb.kaarten.add(nieuweKaart)
        await echteDb.plekken.bulkAdd(nieuwePlekken)
      })
      if (nieuwePlekken.length === 0) {
        setMelding('Op het werkblad vond ik geen lijst met plekken. Voeg de plekken hieronder zelf toe en tik ze aan op de kaart.')
      }
      await laad()
    } catch {
      setMelding('Het herkennen lukte niet. Probeer het opnieuw, of maak nieuwe foto’s met goed licht.')
    } finally {
      setBezig(null)
    }
  }

  async function wijzig(plek: Plek, velden: Partial<Plek>) {
    setPlekken((p) => p.map((x) => (x.id === plek.id ? { ...x, ...velden } : x)))
    await echteDb.plekken.update(plek.id, velden)
  }

  /** Bij "Lu": dit label hoort bij een andere naam. Die plek neemt het label over, deze moet opnieuw aangetikt. */
  async function kiesNaam(plek: Plek, naam: string) {
    const ander = plekken.find((p) => p.naam === naam && p.id !== plek.id && p.x === null)
    if (ander) {
      await wijzig(ander, { x: plek.x, y: plek.y, labelVak: plek.labelVak, alternatieven: [] })
      await wijzig(plek, { x: null, y: null, labelVak: null, alternatieven: [] })
    } else {
      await wijzig(plek, { alternatieven: [] })
    }
  }

  async function voegToe() {
    if (!kaart) return
    const plek: Plek = {
      id: crypto.randomUUID(),
      bronId,
      kaartId: kaart.id,
      naam: '',
      soort: 'stad',
      toetsstof: false,
      x: null,
      y: null,
      labelVak: null,
      alternatieven: [],
      bevestigd: false,
      bronversie: 1,
      volgorde: plekken.length + 1,
    }
    await echteDb.plekken.add(plek)
    setPlekken((p) => [...p, plek])
    setTikmodus({ soort: 'plaats', plekId: plek.id })
  }

  async function tik(x: number, y: number) {
    if (!tikmodus || !kaart) return
    const voorbeelden = plekken.flatMap((p) => (p.labelVak ? [p.labelVak] : []))
    if (tikmodus.soort === 'plaats') {
      const plek = plekken.find((p) => p.id === tikmodus.plekId)
      // Wie aantikt, tikt de afkorting aan: die wordt straks ook afgedekt.
      if (plek) await wijzig(plek, { x, y, labelVak: vakRond(x, y, voorbeelden), alternatieven: [] })
      setTikmodus(null)
    } else {
      const afgedekt = [...kaart.afgedekt, vakRond(x, y, voorbeelden)]
      setKaart({ ...kaart, afgedekt })
      await echteDb.kaarten.update(kaart.id, { afgedekt })
    }
  }

  async function bevestig() {
    if (!kaart) return
    const stukken = [...plekken.flatMap((p) => (p.labelVak ? [p.labelVak] : [])), ...kaart.afgedekt]
    setBezig({ fractie: 0.5, stap: 'Blinde kaart maken' })
    const blind = await dekAf(kaart.beeld, stukken)
    await echteDb.transaction('rw', echteDb.kaarten, echteDb.plekken, async () => {
      await echteDb.kaarten.update(kaart.id, { beeld: blind, blind: true })
      await echteDb.plekken.where('bronId').equals(bronId).modify({ bevestigd: true })
    })
    setBezig(null)
    await laad()
  }

  async function opnieuw() {
    if (!window.confirm('Kaart en plekken van deze bron opnieuw inladen? De huidige plekken verdwijnen.')) return
    await echteDb.plekken.where('bronId').equals(bronId).delete()
    await echteDb.kaarten.where('bronId').equals(bronId).delete()
    setKaartFoto(null)
    setWerkbladFoto(null)
    await laad()
  }

  if (!bron) return null
  const nietGeplaatst = plekken.filter((p) => p.x === null)
  const twijfel = plekken.filter((p) => p.alternatieven.length > 0)
  const leeg = plekken.filter((p) => p.naam.trim() === '')
  const kanBevestigen = kaart !== null && plekken.length > 0 && nietGeplaatst.length === 0 && twijfel.length === 0 && leeg.length === 0
  const richtingIndex = PLEKRICHTINGEN.findIndex((r) => JSON.stringify(r.waarde) === JSON.stringify(bron.plekrichtingen ?? ['aanwijzen', 'benoemen']))
  const bevestigd = kaart?.blind === true

  return (
    <>
      <section className="kaart">
        <h2>{bron.naam}</h2>
        <p className="gedempt">Topografie · {plekken.length} {plekken.length === 1 ? 'plek' : 'plekken'}</p>

        {!kaart && (
          <>
            <p>Maak twee foto's: de kaart die je hebt ingevuld, en het werkblad met "Wat moet je leren?".</p>
            <p className="label">1. De kaart {kaartFoto && <span className="gedempt">✓ {kaartFoto.name}</span>}</p>
            <FotoKnoppen wat="de kaart" gekozen={kaartFoto !== null} uit={bezig !== null} onKies={(b) => b?.[0] && setKaartFoto(b[0])} />
            <p className="label">2. Het werkblad {werkbladFoto && <span className="gedempt">✓ {werkbladFoto.name}</span>}</p>
            <FotoKnoppen wat="het werkblad" gekozen={werkbladFoto !== null} uit={bezig !== null} onKies={(b) => b?.[0] && setWerkbladFoto(b[0])} />
            <p className="gedempt">Tips: goed licht, geen schaduw, telefoon recht boven de pagina. De foto's blijven op deze telefoon.</p>
            <div className="knoppen">
              <button className="knop" disabled={!kaartFoto || !werkbladFoto || bezig !== null} onClick={() => void herkennen()}>
                Herkennen
              </button>
            </div>
          </>
        )}

        {bezig && (
          <div className="feedback" role="status">
            <p>{bezig.stap}…</p>
            <progress max={1} value={bezig.fractie} style={{ width: '100%' }} />
            <p className="gedempt">Elke foto wordt twee keer gelezen; dit duurt even.</p>
          </div>
        )}
        {melding && (
          <p className="feedback feedback-storing" role="alert">
            {melding}
          </p>
        )}
      </section>

      {kaart && (
        <section className="kaart">
          <h2>{bevestigd ? 'Blinde kaart' : 'Controleer de plekken'}</h2>
          {!bevestigd && (
            <p>
              Klopt elk nummer met de plek op de kaart? <strong>Laat een ouder even meekijken</strong>: de kaart heb je zelf
              ingevuld, en een fout leer je anders verkeerd.
            </p>
          )}
          {tikmodus?.soort === 'plaats' && (
            <p className="feedback" role="status">
              👆 Tik op de kaart waar <strong>{plekken.find((p) => p.id === tikmodus.plekId)?.naam || 'de nieuwe plek'}</strong> staat.{' '}
              <button className="link" onClick={() => setTikmodus(null)}>
                Annuleren
              </button>
            </p>
          )}
          {tikmodus?.soort === 'afdekken' && (
            <p className="feedback" role="status">
              👆 Tik op tekst die nog zichtbaar is, zoals een naam die je erbij schreef. Die wordt afgedekt.{' '}
              <button className="link" onClick={() => setTikmodus(null)}>
                Klaar
              </button>
            </p>
          )}
          <KaartMetPlekken
            kaart={kaart}
            plekken={bevestigd ? [] : plekken}
            gekozen={gekozen}
            afgedekt={bevestigd ? [] : kaart.afgedekt.map(midden)}
            onTik={tikmodus ? (x, y) => void tik(x, y) : null}
            onKies={(id) => {
              setGekozen(id)
              lijstRef.current?.querySelector(`[data-plek="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }}
            groot={groot}
          />
          <button className="link" onClick={() => setGroot(!groot)}>
            {groot ? '🔍 Kleiner' : '🔍 Groter (om beter te kunnen tikken)'}
          </button>

          {!bevestigd && (
            <>
              <ul className="plekkenlijst" ref={lijstRef}>
                {plekken.map((p, i) => (
                  <li key={p.id} data-plek={p.id} className={`${gekozen === p.id ? 'gekozen' : ''} ${p.x === null || p.alternatieven.length ? 'met-twijfel' : ''}`}>
                    <div className="plek-regel">
                      <span className="plek-nummer">{i + 1}</span>
                      <input className="invoer" value={p.naam} placeholder="Naam" onChange={(e) => void wijzig(p, { naam: e.target.value })} />
                      <select className="invoer plek-soort" value={p.soort} onChange={(e) => void wijzig(p, { soort: e.target.value as Plek['soort'] })}>
                        {SOORTEN.map((s) => (
                          <option key={s.waarde} value={s.waarde}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="knoppen plek-acties">
                      <label className="keuze">
                        <input type="checkbox" checked={p.toetsstof} onChange={(e) => void wijzig(p, { toetsstof: e.target.checked })} />
                        Toetsstof
                      </label>
                      <button className="link" onClick={() => setTikmodus({ soort: 'plaats', plekId: p.id })}>
                        {p.x === null ? '👆 Aantikken' : 'Verplaatsen'}
                      </button>
                      <button
                        className="link"
                        onClick={() => void echteDb.plekken.delete(p.id).then(() => setPlekken((l) => l.filter((x) => x.id !== p.id)))}
                      >
                        Verwijderen
                      </button>
                    </div>
                    {p.x === null && <p className="gedempt">Niet gevonden op de kaart: tik hem aan.</p>}
                    {p.alternatieven.length > 0 && (
                      <div className="feedback">
                        <p>Deze afkorting past bij meer plekken. Welke is het?</p>
                        <div className="knoppen">
                          {[p.naam, ...p.alternatieven].map((naam) => (
                            <button key={naam} className="knop knop-rustig" onClick={() => void kiesNaam(p, naam)}>
                              {naam}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <div className="knoppen">
                <button className="link" onClick={() => void voegToe()}>
                  + Plek toevoegen
                </button>
                <button className="link" onClick={() => setTikmodus({ soort: 'afdekken' })}>
                  ✎ Nog tekst zichtbaar? Afdekken
                </button>
              </div>

              <fieldset className="keuzes">
                <legend className="label">Wat wil je oefenen?</legend>
                {PLEKRICHTINGEN.map((r, i) => (
                  <label key={r.label} className="keuze">
                    <input
                      type="radio"
                      name="plekrichting"
                      checked={richtingIndex === i}
                      onChange={() => {
                        setBron({ ...bron, plekrichtingen: r.waarde })
                        void echteDb.bronnen.update(bronId, { plekrichtingen: r.waarde })
                      }}
                    />
                    {r.label}
                  </label>
                ))}
              </fieldset>

              <div className="knoppen">
                <button className="knop" disabled={!kanBevestigen || bezig !== null} onClick={() => void bevestig()}>
                  Bevestigen ({plekken.length} {plekken.length === 1 ? 'plek' : 'plekken'})
                </button>
              </div>
              {!kanBevestigen && (
                <p className="gedempt">
                  {nietGeplaatst.length > 0 && `Nog ${nietGeplaatst.length} ${nietGeplaatst.length === 1 ? 'plek' : 'plekken'} aantikken. `}
                  {twijfel.length > 0 && `Nog ${twijfel.length} ${twijfel.length === 1 ? 'afkorting' : 'afkortingen'} kiezen. `}
                  {leeg.length > 0 && 'Geef elke plek een naam.'}
                </p>
              )}
            </>
          )}

          {bevestigd && (
            <>
              <p className="gedempt">
                De afkortingen zijn afgedekt. Oefenen op deze kaart komt in de volgende versie van de app. Zie je nog een
                afkorting? Laad de kaart dan opnieuw in.
              </p>
              <button className="link" onClick={() => void opnieuw()}>
                Kaart opnieuw inladen
              </button>
            </>
          )}
        </section>
      )}

      <button className="link" onClick={onTerug}>
        ← Terug
      </button>
    </>
  )
}

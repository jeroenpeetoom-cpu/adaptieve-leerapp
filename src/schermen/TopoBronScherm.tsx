import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import type { Bron, Kaart, Plek, Plekrichting, Rechthoek } from '../bronnen/model'
import { controleerBestand, herkenMeermaals, voorbereiden } from '../herkenning/herkenner'
import { echteDb } from '../opslag/database'
import { verwijderBron } from '../opslag/verwijderen'
import { koppelAfkortingen } from '../topo/afkortingen'
import { dekAf, grijswaarden, naarJpeg } from '../topo/kaartbeeld'
import { klikVast, omrekeningUit, reken, vindStippen, type Punt } from '../topo/uitlijnen'
import { isInhoudelijkeWijziging, PLEKSOORTEN, SOORTEN as SOORTGEGEVENS } from '../leerlogica'
import { HoekenAantikken } from './HoekenAantikken'
import { labelsUit, midden, tekstOmAfTeDekken, vakRond } from '../topo/labels'
import { leesWerkblad } from '../topo/werkblad'
import { FotoKnoppen } from './FotoKnoppen'

const SOORTKEUZES: { waarde: Plek['soort']; label: string }[] = PLEKSOORTEN.map((waarde) => ({
  waarde,
  label: `${SOORTGEGEVENS[waarde].emoji} ${SOORTGEGEVENS[waarde].naam[0].toUpperCase()}${SOORTGEGEVENS[waarde].naam.slice(1)}`,
}))

export const PLEKRICHTINGEN: { label: string; waarde: Plekrichting[] }[] = [
  { label: 'Allebei: aanwijzen én benoemen', waarde: ['aanwijzen', 'benoemen'] },
  { label: 'Aanwijzen: "Waar ligt …?"', waarde: ['aanwijzen'] },
  { label: 'Benoemen: "Wat ligt hier?"', waarde: ['benoemen'] },
]

type Tikmodus = { soort: 'plaats'; plekId: string } | { soort: 'afdekken' } | null

/** De kaart met genummerde stippen. Tikken plaatst een plek; in de afdekstand trek je een vakje over tekst. */
function KaartMetPlekken({
  kaart,
  plekken,
  gekozen,
  vakken,
  onTik,
  onVak,
  onKies,
  groot,
}: {
  kaart: Kaart
  plekken: Plek[]
  gekozen: string | null
  /** Zelf afgedekte vakken, om te laten zien. */
  vakken: Rechthoek[]
  onTik: ((x: number, y: number) => void) | null
  /** In de afdekstand: het getrokken vakje (of een vakje rond een tik). */
  onVak: ((vak: Rechthoek | { x: number; y: number }) => void) | null
  onKies: (plekId: string) => void
  groot: boolean
}) {
  const [slepen, setSlepen] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null)
  const positie = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }
  }
  return (
    <div className={`kaartvenster ${groot ? 'groot' : ''}`}>
      <div
        className={`kaartbeeld ${onTik || onVak ? 'tikbaar' : ''} ${onVak ? 'afdekstand' : ''}`}
        onPointerDown={(e) => {
          if (!onVak) return
          e.currentTarget.setPointerCapture(e.pointerId)
          const p = positie(e)
          setSlepen({ x0: p.x, y0: p.y, x1: p.x, y1: p.y })
        }}
        onPointerMove={(e) => {
          if (!onVak || !slepen) return
          const p = positie(e)
          setSlepen({ ...slepen, x1: p.x, y1: p.y })
        }}
        onPointerUp={() => {
          if (onVak && slepen) {
            const vak = {
              x0: Math.min(slepen.x0, slepen.x1),
              y0: Math.min(slepen.y0, slepen.y1),
              x1: Math.max(slepen.x0, slepen.x1),
              y1: Math.max(slepen.y0, slepen.y1),
            }
            setSlepen(null)
            // Een tik zonder slepen wordt een vakje zo groot als een afkorting.
            onVak(vak.x1 - vak.x0 < 0.01 && vak.y1 - vak.y0 < 0.01 ? { x: slepen.x0, y: slepen.y0 } : vak)
          }
        }}
        onClick={(e) => {
          // Een klik, geen pointerup: na scrollen over de kaart komt er geen klik, dus geen per ongeluk geplaatste plek.
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
        {[...vakken, ...(slepen ? [{ x0: Math.min(slepen.x0, slepen.x1), y0: Math.min(slepen.y0, slepen.y1), x1: Math.max(slepen.x0, slepen.x1), y1: Math.max(slepen.y0, slepen.y1) }] : [])].map((v, i) => (
          <span
            key={i}
            className="afdekvak"
            style={{ left: `${v.x0 * 100}%`, top: `${v.y0 * 100}%`, width: `${(v.x1 - v.x0) * 100}%`, height: `${(v.y1 - v.y0) * 100}%` }}
            aria-hidden="true"
          />
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
  const [legeFoto, setLegeFoto] = useState<File | null>(null)
  /** Uitlijnen met een lege kaart: eerst de hoeken op de ingevulde kaart, dan op de lege. */
  const [uitlijnen, setUitlijnen] = useState<{ leeg: HTMLCanvasElement; leegBeeld: string; hoekenIngevuld: Punt[] | null } | null>(null)
  const [bewerken, setBewerken] = useState<string | null>(null)
  const [bezig, setBezig] = useState<{ fractie: number; stap: string } | null>(null)
  const [melding, setMelding] = useState<string | null>(null)
  const [gekozen, setGekozen] = useState<string | null>(null)
  const [tikmodus, setTikmodus] = useState<Tikmodus>(null)
  const [groot, setGroot] = useState(false)
  const lijstRef = useRef<HTMLUListElement>(null)
  const kaartRef = useRef<HTMLDivElement>(null)

  /** Bij aantikken meteen naar de kaart, en daarna terug naar de plek in de lijst. */
  function naarKaart() {
    setTimeout(() => kaartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  function naarRegel(id: string) {
    setTimeout(() => lijstRef.current?.querySelector(`[data-plek="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  }

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
      const wb = await herkenMeermaals(werkbladFoto, 'kolom', ['gewoon', 'grijs'], (f, stap) =>
        setBezig({ fractie: f * 0.4, stap: `Werkblad: ${stap.toLowerCase()}` }),
      )
      const werkblad = leesWerkblad(wb.varianten)
      setBezig({ fractie: 0.4, stap: 'Kaart lezen' })
      // Drie keer: gewoon, zwart-wit, en het rode kanaal voor tekst op rode en oranje vlakken.
      const k = await herkenMeermaals(kaartFoto, 'losse tekst', ['gewoon', 'grijs', 'rood'], (f, stap) =>
        setBezig({ fractie: 0.4 + f * 0.6, stap: `Kaart: ${stap.toLowerCase()}` }),
      )
      const labels = labelsUit(k.varianten, k.breedte, k.hoogte)
      const voorstel = koppelAfkortingen(labels, werkblad.plekken, werkblad.woorden)
      const beeld = naarJpeg(k.canvas)

      const nieuweKaart: Kaart = {
        id: crypto.randomUUID(),
        bronId,
        beeld,
        origineel: beeld,
        tekstvakken: tekstOmAfTeDekken(labels),
        breedte: k.breedte,
        hoogte: k.hoogte,
        blind: false,
        afgedekt: [],
      }
      // Toetsstof eerst, en daarbinnen de grote dingen (spec topografie, vraag 45).
      const opVolgorde = [...voorstel].sort(
        (a, b) => Number(b.toetsstof) - Number(a.toetsstof) || SOORTGEGEVENS[a.soort].volgorde - SOORTGEGEVENS[b.soort].volgorde,
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
      if (legeFoto) {
        const leeg = await voorbereiden(legeFoto)
        setUitlijnen({ leeg, leegBeeld: naarJpeg(leeg), hoekenIngevuld: null })
      }
      await laad()
    } catch {
      setMelding('Het herkennen lukte niet. Probeer het opnieuw, of maak nieuwe foto’s met goed licht.')
    } finally {
      setBezig(null)
    }
  }

  /** Zet de plekken van de ingevulde kaart over op de lege kaart, en klikt steden vast op hun stipje. */
  async function lijnUit(hoekenLeeg: Punt[]) {
    if (!uitlijnen?.hoekenIngevuld || !kaart) return
    const { leeg, leegBeeld, hoekenIngevuld } = uitlijnen
    const h = omrekeningUit(hoekenIngevuld, hoekenLeeg)
    const verhouding = leeg.height / leeg.width
    const overgezet = plekken.map((p) => (p.x === null || p.y === null ? p : { ...p, ...reken(h, { x: p.x, y: p.y }) }))
    const stippen = vindStippen(grijswaarden(leeg), leeg.width, leeg.height, hoekenLeeg)
    const vast = klikVast(
      overgezet.filter((p) => p.soort === 'stad' && p.x !== null && p.y !== null) as (Plek & { x: number; y: number })[],
      stippen,
      verhouding,
    )
    const bijgewerkt = overgezet.map((p) => ({ ...p, ...(vast.get(p.id) ?? {}), labelVak: null }))
    const nieuweKaart: Kaart = { ...kaart, beeld: leegBeeld, origineel: leegBeeld, breedte: leeg.width, hoogte: leeg.height, tekstvakken: [], afgedekt: [], leeg: true }
    await echteDb.transaction('rw', echteDb.kaarten, echteDb.plekken, async () => {
      await echteDb.kaarten.put(nieuweKaart)
      await echteDb.plekken.bulkPut(bijgewerkt)
    })
    setUitlijnen(null)
    await laad()
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
      // Na het bevestigen van de kaart doet een nieuwe plek meteen mee.
      bevestigd: kaart.blind,
      bronversie: 1,
      volgorde: plekken.length + 1,
    }
    await echteDb.plekken.add(plek)
    setPlekken((p) => [...p, plek])
    setTikmodus({ soort: 'plaats', plekId: plek.id })
    if (kaart.blind) setBewerken(plek.id)
    naarKaart()
  }

  async function tik(x: number, y: number) {
    if (tikmodus?.soort !== 'plaats') return
    const plek = plekken.find((p) => p.id === tikmodus.plekId)
    // Aantikken wijst de plek zelf aan (het stipje of de rivier); daar wordt niets afgedekt.
    if (plek) await wijzig(plek, { x, y, alternatieven: [] })
    setTikmodus(null)
    naarRegel(tikmodus.plekId)
  }

  /** De blinde kaart opnieuw maken van het origineel, met alle af te dekken stukken. */
  async function maakBlind(k: Kaart, afgedekt: Rechthoek[]) {
    // Een lege kaart heeft geen afkortingen; alleen wat de leerling zelf afdekte (bijvoorbeeld doorschijnende tekst).
    if (k.leeg) return afgedekt.length > 0 ? dekAf(k.origineel ?? k.beeld, afgedekt) : (k.origineel ?? k.beeld)
    const stukken = [
      ...plekken.flatMap((p) => (p.labelVak ? [p.labelVak] : [])),
      ...(k.tekstvakken ?? []),
      ...afgedekt,
    ]
    return dekAf(k.origineel ?? k.beeld, stukken)
  }

  async function vakAfdekken(vak: Rechthoek | { x: number; y: number }) {
    if (!kaart) return
    const voorbeelden = plekken.flatMap((p) => (p.labelVak ? [p.labelVak] : []))
    const rechthoek = 'x0' in vak ? vak : vakRond(vak.x, vak.y, voorbeelden)
    const afgedekt = [...kaart.afgedekt, rechthoek]
    await bewaarAfgedekt(afgedekt)
  }

  async function bewaarAfgedekt(afgedekt: Rechthoek[]) {
    if (!kaart) return
    const bijgewerkt: Kaart = { ...kaart, afgedekt }
    if (kaart.blind) bijgewerkt.beeld = await maakBlind(bijgewerkt, afgedekt)
    setKaart(bijgewerkt)
    await echteDb.kaarten.update(kaart.id, { afgedekt, beeld: bijgewerkt.beeld })
  }

  async function bevestig() {
    if (!kaart) return
    setBezig({ fractie: 0.5, stap: 'Blinde kaart maken' })
    const blind = await maakBlind(kaart, kaart.afgedekt)
    await echteDb.transaction('rw', echteDb.kaarten, echteDb.plekken, async () => {
      await echteDb.kaarten.update(kaart.id, { beeld: blind, blind: true })
      await echteDb.plekken.where('bronId').equals(bronId).modify({ bevestigd: true })
    })
    setBezig(null)
    setTikmodus(null)
    await laad()
  }

  async function opnieuw() {
    if (!window.confirm('Kaart en plekken van deze bron opnieuw inladen? De huidige plekken verdwijnen.')) return
    await echteDb.plekken.where('bronId').equals(bronId).delete()
    await echteDb.kaarten.where('bronId').equals(bronId).delete()
    setKaartFoto(null)
    setWerkbladFoto(null)
    setLegeFoto(null)
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
            <p className="label">
              3. De lege kaart <span className="gedempt">(mag, hoeft niet)</span> {legeFoto && <span className="gedempt">✓ {legeFoto.name}</span>}
            </p>
            <p className="gedempt">
              Heb je dezelfde kaart zonder afkortingen, met alleen de stipjes? Dan oefen je op die schone kaart. Leg een wit vel achter
              de pagina, zodat tekst van de achterkant niet doorschijnt, en zet de hele pagina op de foto.
            </p>
            <FotoKnoppen wat="de lege kaart" gekozen={legeFoto !== null} uit={bezig !== null} onKies={(b) => b?.[0] && setLegeFoto(b[0])} />
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
            <p className="gedempt">Elke foto wordt een paar keer gelezen, op verschillende manieren; dit duurt even.</p>
          </div>
        )}
        {melding && (
          <p className="feedback feedback-storing" role="alert">
            {melding}
          </p>
        )}
      </section>

      {kaart && uitlijnen && (
        <section className="kaart">
          <h2>Kaarten op elkaar leggen</h2>
          <p>Tik op beide kaarten de vier hoeken van het kaartkader aan. Dan zet de app de plekken over op de lege kaart.</p>
          {uitlijnen.hoekenIngevuld === null ? (
            <HoekenAantikken key="ingevuld" beeld={kaart.beeld} titel="Eerst de ingevulde kaart" onKlaar={(h) => setUitlijnen({ ...uitlijnen, hoekenIngevuld: h })} />
          ) : (
            <HoekenAantikken key="leeg" beeld={uitlijnen.leegBeeld} titel="Nu de lege kaart" onKlaar={(h) => void lijnUit(h)} />
          )}
          <button className="link" onClick={() => setUitlijnen(null)}>
            Overslaan en de ingevulde kaart gebruiken
          </button>
        </section>
      )}

      {kaart && !uitlijnen && (
        <section className="kaart">
          <h2>{bevestigd ? 'Blinde kaart' : 'Controleer de plekken'}</h2>
          {!bevestigd && (
            <p>
              Klopt elk nummer met de plek op de kaart? <strong>Laat een ouder even meekijken</strong>: de kaart heb je zelf
              ingevuld, en een fout leer je anders verkeerd.
            </p>
          )}
          {tikmodus && (
            <div className="modusbalk" role="status">
              {tikmodus.soort === 'plaats' ? (
                <>
                  <p>
                    👆 Tik op de kaart waar <strong>{plekken.find((p) => p.id === tikmodus.plekId)?.naam || 'de nieuwe plek'}</strong> ligt: op
                    het stipje, de rivier of in het gebied.
                  </p>
                  <div className="knoppen">
                    <button className="knop knop-rustig" onClick={() => setTikmodus(null)}>
                      Annuleren
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p>✎ Trek met je vinger een vakje over tekst die nog zichtbaar is. Een korte tik dekt een klein stukje af.</p>
                  <div className="knoppen">
                    <button className="knop" onClick={() => setTikmodus(null)}>
                      ✓ Klaar met afdekken
                    </button>
                    {kaart.afgedekt.length > 0 && (
                      <button className="knop knop-rustig" onClick={() => void bewaarAfgedekt(kaart.afgedekt.slice(0, -1))}>
                        ↶ Ongedaan maken
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
          <div ref={kaartRef}>
            <KaartMetPlekken
              kaart={kaart}
              plekken={bevestigd ? plekken.filter((p) => tikmodus?.soort === 'plaats' && p.id === tikmodus.plekId) : plekken}
              gekozen={gekozen}
              vakken={bevestigd ? [] : kaart.afgedekt}
              onTik={tikmodus?.soort === 'plaats' ? (x, y) => void tik(x, y) : null}
              onVak={tikmodus?.soort === 'afdekken' ? (v) => void vakAfdekken(v) : null}
              onKies={(id) => {
                setGekozen(id)
                naarRegel(id)
              }}
              groot={groot}
            />
          </div>
          <div className="knoppen">
            <button className="link" onClick={() => setGroot(!groot)}>
              {groot ? '🔍 Kleiner' : '🔍 Groter (om beter te kunnen tikken)'}
            </button>
            {!tikmodus && (
              <button className="link" onClick={() => (setTikmodus({ soort: 'afdekken' }), naarKaart())}>
                ✎ Nog tekst zichtbaar? Afdekken
              </button>
            )}
          </div>

          {!bevestigd && (
            <>
              <ul className="plekkenlijst" ref={lijstRef}>
                {plekken.map((p, i) => (
                  <li key={p.id} data-plek={p.id} className={`${gekozen === p.id ? 'gekozen' : ''} ${p.x === null || p.alternatieven.length ? 'met-twijfel' : ''}`}>
                    <div className="plek-regel">
                      <span className="plek-nummer">{i + 1}</span>
                      <input className="invoer" value={p.naam} placeholder="Naam" onChange={(e) => void wijzig(p, { naam: e.target.value })} />
                      <select className="invoer plek-soort" value={p.soort} onChange={(e) => void wijzig(p, { soort: e.target.value as Plek['soort'] })}>
                        {SOORTKEUZES.map((s) => (
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
                      <button
                        className="link"
                        onClick={() => {
                          setTikmodus({ soort: 'plaats', plekId: p.id })
                          naarKaart()
                        }}
                      >
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
              <h3>Plekken aanpassen</h3>
              <p className="gedempt">Een fout in een naam? Pas hem hier aan. Verander je de naam echt, dan begint die plek opnieuw.</p>
              <ul className="plekkenlijst">
                {plekken.map((p) => (
                  <li key={p.id} data-plek={p.id}>
                    {bewerken === p.id ? (
                      <>
                        <div className="plek-regel">
                          <span className="plek-nummer">📍</span>
                          <input className="invoer" defaultValue={p.naam} id={`naam-${p.id}`} />
                          <select className="invoer plek-soort" defaultValue={p.soort} id={`soort-${p.id}`}>
                            {SOORTKEUZES.map((s) => (
                              <option key={s.waarde} value={s.waarde}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="knoppen plek-acties">
                          <label className="keuze">
                            <input type="checkbox" defaultChecked={p.toetsstof} id={`toets-${p.id}`} />
                            Toetsstof
                          </label>
                          <button
                            className="knop"
                            onClick={() => {
                              const naam = (document.getElementById(`naam-${p.id}`) as HTMLInputElement).value.trim()
                              const soort = (document.getElementById(`soort-${p.id}`) as HTMLSelectElement).value as Plek['soort']
                              const toetsstof = (document.getElementById(`toets-${p.id}`) as HTMLInputElement).checked
                              if (!naam) return
                              const inhoudelijk = isInhoudelijkeWijziging({ woord: p.naam, betekenis: '' }, { woord: naam, betekenis: '' })
                              void wijzig(p, { naam, soort, toetsstof, bronversie: inhoudelijk ? p.bronversie + 1 : p.bronversie }).then(async () => {
                                // Een geheugenbeeld hoorde bij de oude naam.
                                if (inhoudelijk) await echteDb.geheugenbeelden.filter((b) => b.leeritemId.startsWith(`${p.id}-`)).delete()
                                setBewerken(null)
                              })
                            }}
                          >
                            Opslaan
                          </button>
                          <button
                            className="knop knop-rustig"
                            onClick={() => {
                              setTikmodus({ soort: 'plaats', plekId: p.id })
                              naarKaart()
                            }}
                          >
                            Verplaatsen
                          </button>
                          <button
                            className="link"
                            onClick={() => {
                              if (!window.confirm(`${p.naam} verwijderen?`)) return
                              void echteDb.plekken.delete(p.id).then(() => setPlekken((l) => l.filter((x) => x.id !== p.id)))
                            }}
                          >
                            Verwijderen
                          </button>
                          <button className="link" onClick={() => setBewerken(null)}>
                            Annuleren
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="woordpaar-regel">
                        <span>
                          {SOORTGEGEVENS[p.soort].emoji} {p.naam} <span className="gedempt">{SOORTGEGEVENS[p.soort].naam}{p.toetsstof ? ' · toetsstof' : ''}</span>
                        </span>
                        <button className="link" onClick={() => setBewerken(p.id)}>
                          Aanpassen
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <button className="link" onClick={() => void voegToe()}>
                + Plek toevoegen
              </button>
              <p className="gedempt">
                De afkortingen zijn afgedekt. Zie je nog tekst, zoals een naam die je erbij schreef? Tik op "Afdekken" en trek
                er een vakje over. Oefenen op deze kaart komt in de volgende versie van de app.
              </p>
              <button className="link" onClick={() => void opnieuw()}>
                Kaart opnieuw inladen
              </button>
            </>
          )}
        </section>
      )}

      <section className="kaart">
        <h2>Toets en afronden</h2>
        <label className="label" htmlFor="topotoets">
          Toetsdatum
        </label>
        <input
          id="topotoets"
          className="invoer"
          type="date"
          value={bron.toetsdag ?? ''}
          onChange={(e) => {
            const toetsdag = e.target.value || null
            setBron({ ...bron, toetsdag })
            void echteDb.bronnen.update(bronId, { toetsdag })
          }}
        />
        <div className="knoppen">
          <button
            className="knop knop-rustig"
            onClick={() => {
              if (!bron.afgerond && !window.confirm('Wil je deze bron afronden? De plekken komen dan niet meer terug; je voortgang blijft bewaard.')) return
              const wijziging = { afgerond: !bron.afgerond, onderhoud: false }
              setBron({ ...bron, ...wijziging })
              void echteDb.bronnen.update(bronId, wijziging)
            }}
          >
            {bron.afgerond ? 'Weer laten herhalen' : 'Bron afronden'}
          </button>
        </div>
        {bron.afgerond && <p className="gedempt">Deze bron is afgerond: de plekken komen niet meer terug. Je voortgang is bewaard.</p>}
        {bron.onderhoud && !bron.afgerond && <p className="gedempt">🧠 Blijven onthouden: af en toe komt er een plek uit deze bron langs.</p>}
      </section>

      <section className="kaart">
        <h2>Bron verwijderen</h2>
        <p className="gedempt">Verwijdert deze bron met alle woorden of plekken, de kaart, je beelden en je voortgang. Dit kan niet ongedaan worden gemaakt.</p>
        <button
          className="knop knop-rustig"
          onClick={() => {
            if (!window.confirm(`"${bron.naam}" helemaal verwijderen, met je voortgang? Dit kan niet ongedaan worden gemaakt.`)) return
            void verwijderBron(echteDb, bronId).then(onTerug)
          }}
        >
          🗑 Bron verwijderen
        </button>
      </section>
      <button className="link" onClick={onTerug}>
        ← Terug
      </button>
    </>
  )
}

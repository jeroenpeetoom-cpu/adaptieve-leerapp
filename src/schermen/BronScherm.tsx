import { useCallback, useEffect, useState } from 'react'
import { regelsUitTekst, verwerkRegels, type Twijfel, type Voorstel } from '../bronverwerking'
import { splits, splitsbareWoorden, voegSamen } from '../bronnen/bewerken'
import { kanBevestigen, nogTeBekijken } from '../bronnen/leeritems'
import type { Bron, Bronpagina, Woordpaar } from '../bronnen/model'
import { controleerBestand, herken } from '../herkenning/herkenner'
import { isInhoudelijkeWijziging, type Strategie } from '../leerlogica'
import { echteDb } from '../opslag/database'
import { verwijderBron } from '../opslag/verwijderen'
import { legStrategieVast } from '../opslag/strategie'
import { FotoKnoppen } from './FotoKnoppen'
import { RICHTINGEN } from './NieuweBron'

const STRATEGIEKEUZES: { waarde: Strategie | 'geen'; label: string }[] = [
  { waarde: 'beelden koppelen', label: '🖼️ Beelden koppelen' },
  { waarde: 'geheugenroute', label: '🗺️ Geheugenroute' },
  { waarde: 'geen', label: 'Zonder, gewoon herhalen' },
]

function BevestigdWoordpaar({ wp, onBewaar, onVerwijder }: { wp: Woordpaar; onBewaar: (woord: string, betekenis: string) => void; onVerwijder: () => void }) {
  const [bewerken, setBewerken] = useState(false)
  const [woord, setWoord] = useState(wp.woord)
  const [betekenis, setBetekenis] = useState(wp.betekenis)
  if (!bewerken) {
    return (
      <li className="woordpaar-regel">
        <span>
          <span lang="en">{wp.woord}</span> = <span lang="nl">{wp.betekenis}</span>
        </span>
        <button className="link" onClick={() => setBewerken(true)}>
          Aanpassen
        </button>
      </li>
    )
  }
  const inhoudelijk = isInhoudelijkeWijziging(wp, { woord, betekenis })
  return (
    <li>
      <div className="controle-velden">
        <label>
          <span className="klein">Engels</span>
          <input className="invoer" value={woord} lang="en" autoCapitalize="off" spellCheck={false} onChange={(e) => setWoord(e.target.value)} />
        </label>
        <label>
          <span className="klein">Nederlands</span>
          <input className="invoer" value={betekenis} lang="nl" autoCapitalize="off" spellCheck={false} onChange={(e) => setBetekenis(e.target.value)} />
        </label>
      </div>
      {inhoudelijk && (
        <p className="gedempt">Dit is een echte wijziging: het woord begint opnieuw, want je eerdere antwoorden gingen over iets anders.</p>
      )}
      <div className="knoppen">
        <button
          className="knop"
          disabled={woord.trim() === '' || betekenis.trim() === ''}
          onClick={() => {
            onBewaar(woord.trim(), betekenis.trim())
            setBewerken(false)
          }}
        >
          Opslaan
        </button>
        <button className="knop knop-rustig" onClick={() => (setWoord(wp.woord), setBetekenis(wp.betekenis), setBewerken(false))}>
          Annuleren
        </button>
        <button
          className="link"
          onClick={() => {
            if (window.confirm(`"${wp.woord} = ${wp.betekenis}" verwijderen? Het komt dan niet meer terug bij het oefenen.`)) onVerwijder()
          }}
        >
          Verwijderen
        </button>
      </div>
    </li>
  )
}

const MAX_PAGINAS_PER_KEER = 10

const STATUSTEKST: Record<Bronpagina['status'], string> = {
  wachtend: '⏳ Wacht op herkenning',
  verwerkt: '✓ Herkend',
  onzeker: '⚠ Herkend, met twijfel',
  mislukt: '✗ Mislukt',
  bevestigd: '✓ Bevestigd',
}

/** Draait een foto een kwartslag met de klok mee. */
async function draai(foto: Blob): Promise<Blob> {
  const beeld = await createImageBitmap(foto, { imageOrientation: 'from-image' })
  const canvas = document.createElement('canvas')
  canvas.width = beeld.height
  canvas.height = beeld.width
  const ctx = canvas.getContext('2d')!
  ctx.translate(canvas.width, 0)
  ctx.rotate(Math.PI / 2)
  ctx.drawImage(beeld, 0, 0)
  beeld.close()
  return new Promise((klaar, fout) => canvas.toBlob((b) => (b ? klaar(b) : fout(new Error('draaien mislukt'))), 'image/jpeg', 0.92))
}

const GEEN_WOORDENLIJST =
  'Op deze foto vond ik geen woordenlijst. Andere soorten huiswerk, zoals rekensommen, worden nog niet ondersteund. Is het wel een woordenlijst? Maak dan een nieuwe foto, plak de tekst, of voeg de woorden hieronder zelf toe.'

function TwijfelLabel({ twijfel }: { twijfel: Twijfel }) {
  if (twijfel === 'geen') return null
  return (
    <span className={`twijfel twijfel-${twijfel === 'grote twijfel' ? 'groot' : 'klein'}`}>
      {twijfel === 'grote twijfel' ? '⚠⚠ grote twijfel' : '⚠ twijfel'}
    </span>
  )
}

export function BronScherm({ bronId, onTerug }: { bronId: string; onTerug: () => void }) {
  const [bron, setBron] = useState<Bron | null>(null)
  const [paginas, setPaginas] = useState<Bronpagina[]>([])
  const [paren, setParen] = useState<Woordpaar[]>([])
  const [bezig, setBezig] = useState<{ fractie: number; stap: string; pagina: number; van: number } | null>(null)
  const [melding, setMelding] = useState<string | null>(null)
  const [strategie, setStrategie] = useState<Strategie | 'geen' | undefined>(undefined)
  const [plakken, setPlakken] = useState<string | null>(null)
  const [plakLos, setPlakLos] = useState<string[]>([])
  const [splitsen, setSplitsen] = useState<string | null>(null)

  const laad = useCallback(async () => {
    setBron((await echteDb.bronnen.get(bronId)) ?? null)
    setPaginas((await echteDb.bronpaginas.where('bronId').equals(bronId).toArray()).sort((a, b) => a.volgorde - b.volgorde))
    setParen((await echteDb.woordparen.where('bronId').equals(bronId).toArray()).sort((a, b) => a.volgorde - b.volgorde))
    setStrategie((await echteDb.leesMeta<Record<string, Strategie | 'geen'>>('strategiePerBron', {}))[bronId])
  }, [bronId])

  useEffect(() => {
    void laad()
  }, [laad])

  async function verwerkPagina(pagina: Bronpagina, nummer: number, van: number) {
    setBezig({ fractie: 0, stap: 'Voorbereiden', pagina: nummer, van })
    try {
      const regels = await herken(pagina.foto!, (fractie, stap) => setBezig({ fractie, stap, pagina: nummer, van }))
      const { voorstellen, losseRegels } = verwerkRegels(regels)
      const bestaand = await echteDb.woordparen.where('bronId').equals(bronId).count()
      const nieuwe: Woordpaar[] = voorstellen.map((v, i) => ({
        id: crypto.randomUUID(),
        bronId,
        bronpaginaId: pagina.id,
        woord: v.woord,
        betekenis: v.betekenis,
        bronversie: 1,
        bevestigd: false,
        twijfelWoord: v.twijfelWoord,
        twijfelBetekenis: v.twijfelBetekenis,
        bekeken: false,
        volgorde: bestaand + i + 1,
      }))
      await echteDb.woordparen.bulkAdd(nieuwe)
      const metTwijfel = nieuwe.some((wp) => wp.twijfelWoord !== 'geen' || wp.twijfelBetekenis !== 'geen')
      await echteDb.bronpaginas.update(pagina.id, {
        status: nieuwe.length === 0 ? 'onzeker' : metTwijfel ? 'onzeker' : 'verwerkt',
        losseRegels,
        melding: nieuwe.length === 0 ? GEEN_WOORDENLIJST : null,
      })
    } catch {
      await echteDb.bronpaginas.update(pagina.id, {
        status: 'mislukt',
        melding: 'Het herkennen lukte niet. Probeer het opnieuw, maak een nieuwe foto, of voeg de woorden zelf toe.',
      })
    }
  }

  async function fotosGekozen(bestanden: FileList | null) {
    if (!bestanden || bestanden.length === 0) return
    setMelding(null)
    const lijst = [...bestanden]
    if (lijst.length > MAX_PAGINAS_PER_KEER) {
      setMelding(`Je kunt maximaal ${MAX_PAGINAS_PER_KEER} pagina's tegelijk toevoegen. Er is nog niets toegevoegd; kies er minder.`)
      return
    }
    const fout = lijst.map(controleerBestand).find(Boolean)
    if (fout) {
      setMelding(fout)
      return
    }
    const nieuwe: Bronpagina[] = lijst.map((foto, i) => ({
      id: crypto.randomUUID(),
      bronId,
      volgorde: paginas.length + i + 1,
      origineelNummer: null,
      status: 'wachtend',
      foto,
      losseRegels: [],
      melding: null,
    }))
    await echteDb.bronpaginas.bulkAdd(nieuwe)
    await laad()
    for (const [i, pagina] of nieuwe.entries()) {
      await verwerkPagina(pagina, i + 1, nieuwe.length)
      await laad()
    }
    setBezig(null)
  }

  async function opnieuw(pagina: Bronpagina) {
    await echteDb.woordparen.where('bronpaginaId').equals(pagina.id).filter((wp) => !wp.bevestigd).delete()
    await verwerkPagina(pagina, 1, 1)
    setBezig(null)
    await laad()
  }

  async function voegVoorstellenToe(voorstellen: Voorstel[], bronpaginaId: string | null) {
    const bestaand = await echteDb.woordparen.where('bronId').equals(bronId).count()
    const nieuwe: Woordpaar[] = voorstellen.map((v, i) => ({
      id: crypto.randomUUID(),
      bronId,
      bronpaginaId,
      woord: v.woord,
      betekenis: v.betekenis,
      bronversie: 1,
      bevestigd: false,
      twijfelWoord: v.twijfelWoord,
      twijfelBetekenis: v.twijfelBetekenis,
      bekeken: false,
      volgorde: bestaand + i + 1,
    }))
    await echteDb.woordparen.bulkAdd(nieuwe)
    return nieuwe
  }

  async function verwerkGeplakt() {
    if (!plakken?.trim()) return
    const { voorstellen, losseRegels } = verwerkRegels(regelsUitTekst(plakken))
    await voegVoorstellenToe(voorstellen, null)
    setPlakLos(losseRegels)
    setPlakken(null)
    setMelding(
      voorstellen.length === 0
        ? 'In de geplakte tekst vond ik geen woordparen. Zet op elke regel een woord, een = of een tab, en de betekenis.'
        : null,
    )
    await laad()
  }

  async function losseRegelAlsPaar(tekst: string, bronpaginaId: string | null) {
    await voegVoorstellenToe([{ woord: tekst, betekenis: '', twijfelWoord: 'geen', twijfelBetekenis: 'geen' }], bronpaginaId)
    await laad()
  }

  async function verplaats(pagina: Bronpagina, richting: -1 | 1) {
    const ander = paginas.find((p) => p.volgorde === pagina.volgorde + richting)
    if (!ander) return
    await echteDb.bronpaginas.update(pagina.id, { volgorde: ander.volgorde })
    await echteDb.bronpaginas.update(ander.id, { volgorde: pagina.volgorde })
    await laad()
  }

  async function draaiPagina(pagina: Bronpagina) {
    if (!pagina.foto) return
    const foto = await draai(pagina.foto)
    await echteDb.bronpaginas.update(pagina.id, { foto })
    await opnieuw({ ...pagina, foto })
  }

  async function verwijderPagina(pagina: Bronpagina) {
    if (!window.confirm(`Pagina ${pagina.volgorde} verwijderen? Woordparen die nog niet bevestigd zijn, verdwijnen ook.`)) return
    await echteDb.transaction('rw', echteDb.bronpaginas, echteDb.woordparen, async () => {
      await echteDb.woordparen.where('bronpaginaId').equals(pagina.id).filter((wp) => !wp.bevestigd).delete()
      await echteDb.woordparen.where('bronpaginaId').equals(pagina.id).modify({ bronpaginaId: null })
      await echteDb.bronpaginas.delete(pagina.id)
      const rest = (await echteDb.bronpaginas.where('bronId').equals(bronId).toArray()).sort((a, b) => a.volgorde - b.volgorde)
      for (const [i, p] of rest.entries()) await echteDb.bronpaginas.update(p.id, { volgorde: i + 1 })
    })
    await laad()
  }

  async function samenvoegen(wp: Woordpaar, volgende: Woordpaar) {
    const paar = voegSamen(wp, volgende)
    await echteDb.woordparen.update(wp.id, { ...paar, bekeken: true })
    await echteDb.woordparen.delete(volgende.id)
    await laad()
  }

  async function wijzig(wp: Woordpaar, velden: Partial<Woordpaar>) {
    // Eerst het scherm bijwerken en pas daarna opslaan: anders zet React het invulveld tijdens het
    // opslaan terug naar de oude tekst en springt de cursor naar het eind.
    setParen((p) => p.map((x) => (x.id === wp.id ? { ...x, ...velden } : x)))
    await echteDb.woordparen.update(wp.id, velden)
  }

  async function verwijder(wp: Woordpaar) {
    await echteDb.woordparen.delete(wp.id)
    setParen((p) => p.filter((x) => x.id !== wp.id))
  }

  async function voegToe() {
    const wp: Woordpaar = {
      id: crypto.randomUUID(),
      bronId,
      bronpaginaId: null,
      woord: '',
      betekenis: '',
      bronversie: 1,
      bevestigd: false,
      twijfelWoord: 'geen',
      twijfelBetekenis: 'geen',
      bekeken: true,
      volgorde: paren.length + 1,
    }
    await echteDb.woordparen.add(wp)
    setParen((p) => [...p, wp])
  }

  async function bevestig() {
    const open = paren.filter((wp) => !wp.bevestigd)
    if (!kanBevestigen(paren)) return
    await echteDb.transaction('rw', echteDb.woordparen, echteDb.bronpaginas, async () => {
      await echteDb.woordparen.bulkUpdate(open.map((wp) => ({ key: wp.id, changes: { bevestigd: true, woord: wp.woord.trim(), betekenis: wp.betekenis.trim() } })))
      // Na bevestigen verdwijnt de foto; tekst en woordparen blijven (spec).
      for (const p of paginas.filter((p) => p.status !== 'mislukt')) {
        await echteDb.bronpaginas.update(p.id, { status: 'bevestigd', foto: undefined })
      }
    })
    await laad()
  }

  async function wijzigBron(velden: Partial<Bron>) {
    setBron((b) => (b ? { ...b, ...velden } : b))
    await echteDb.bronnen.update(bronId, velden)
  }

  async function kiesStrategie(nieuw: Strategie | 'geen') {
    await legStrategieVast(echteDb, bronId, nieuw, new Date().toISOString())
    setStrategie(nieuw)
  }

  async function bewaarBevestigd(wp: Woordpaar, woord: string, betekenis: string) {
    const inhoudelijk = isInhoudelijkeWijziging(wp, { woord, betekenis })
    const bronversie = inhoudelijk ? wp.bronversie + 1 : wp.bronversie
    await echteDb.woordparen.update(wp.id, { woord, betekenis, bronversie })
    if (inhoudelijk) {
      // Een zelf toegevoegd antwoord of geheugenbeeld hoorde bij de oude inhoud.
      const idPrefix = `${wp.id}-`
      const extra = await echteDb.leesMeta<Record<string, string[]>>('extraAntwoorden', {})
      await echteDb.schrijfMeta('extraAntwoorden', Object.fromEntries(Object.entries(extra).filter(([id]) => !id.startsWith(idPrefix))))
      await echteDb.geheugenbeelden.filter((b) => b.leeritemId.startsWith(idPrefix)).delete()
    }
    setParen((p) => p.map((x) => (x.id === wp.id ? { ...x, woord, betekenis, bronversie } : x)))
  }

  async function verwijderBevestigd(wp: Woordpaar) {
    await echteDb.woordparen.delete(wp.id)
    await echteDb.geheugenbeelden.filter((b) => b.leeritemId.startsWith(`${wp.id}-`)).delete()
    setParen((p) => p.filter((x) => x.id !== wp.id))
  }

  async function wisselAfronden() {
    if (!bron) return
    if (!bron.afgerond && !window.confirm('Engelse woorden heb je later vaak nog nodig. Wil je deze bron toch afronden? De woorden komen dan niet meer terug; je voortgang blijft bewaard.')) return
    await wijzigBron({ afgerond: !bron.afgerond })
  }

  if (!bron) return null
  const richtingIndex = RICHTINGEN.findIndex((r) => JSON.stringify(r.waarde) === JSON.stringify(bron.oefenrichtingen))

  const open = paren.filter((wp) => !wp.bevestigd)
  const bevestigd = paren.filter((wp) => wp.bevestigd)
  const teBekijken = nogTeBekijken(paren)
  const mislukt = paginas.filter((p) => p.status === 'mislukt')

  return (
    <>
      <section className="kaart">
        <h2>{bron.naam}</h2>
        <p className="gedempt">
          {bevestigd.length} {bevestigd.length === 1 ? 'woord' : 'woorden'} klaar om te oefenen
          {bron.toetsdag && ` · toets op ${new Date(`${bron.toetsdag}T12:00:00Z`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}`}
        </p>

        <p>Tips: goed licht, geen schaduw, telefoon recht boven de pagina, alleen de woordenlijst in beeld.</p>
        <FotoKnoppen wat="een pagina" meerdere uit={bezig !== null} onKies={(b) => void fotosGekozen(b)} />
        <p className="gedempt">Maximaal {MAX_PAGINAS_PER_KEER} pagina's per keer. De foto blijft op deze telefoon.</p>
        {plakken === null ? (
          <button className="link" onClick={() => setPlakken('')}>
            📋 Of plak de tekst van een woordenlijst
          </button>
        ) : (
          <div className="plakken">
            <label className="label" htmlFor="plak">
              Plak hier de woordenlijst. Zet op elke regel een woord en de betekenis, met een = of een tab ertussen.
            </label>
            <textarea id="plak" className="invoer" rows={6} value={plakken} onChange={(e) => setPlakken(e.target.value)} placeholder={'bridge = brug\ncloud = wolk'} />
            <div className="knoppen">
              <button className="knop" disabled={plakken.trim() === ''} onClick={() => void verwerkGeplakt()}>
                Verwerken
              </button>
              <button className="knop knop-rustig" onClick={() => setPlakken(null)}>
                Annuleren
              </button>
            </div>
          </div>
        )}
        {plakLos.length > 0 && (
          <details>
            <summary className="gedempt">{plakLos.length} geplakte regels zonder woordpaar</summary>
            <ul>
              {plakLos.map((r, i) => (
                <li key={i} className="gedempt">
                  {r}{' '}
                  <button className="link" onClick={() => void losseRegelAlsPaar(r, null).then(() => setPlakLos((l) => l.filter((_, j) => j !== i)))}>
                    + als woordpaar
                  </button>
                </li>
              ))}
            </ul>
          </details>
        )}

        {bezig && (
          <div className="feedback" role="status">
            <p>
              {bezig.stap}… {bezig.van > 1 && `(pagina ${bezig.pagina} van ${bezig.van})`}
            </p>
            <progress max={1} value={bezig.fractie} style={{ width: '100%' }} />
            <p className="gedempt">De eerste keer duurt dit langer, omdat de tekstherkenning geladen wordt.</p>
          </div>
        )}
        {melding && (
          <p className="feedback feedback-storing" role="alert">
            {melding}
          </p>
        )}
      </section>

      {paginas.length > 0 && (
        <section className="kaart">
          <h2>Pagina's</h2>
          <ul className="paginas">
            {paginas.map((p) => (
              <li key={p.id}>
                <div className="pagina-kop">
                  <span>
                    Pagina {p.volgorde} <span className="gedempt">{STATUSTEKST[p.status]}</span>
                  </span>
                  <span className="pagina-acties">
                    <button className="icoonknop" aria-label="Pagina omhoog" disabled={p.volgorde === 1} onClick={() => void verplaats(p, -1)}>
                      ↑
                    </button>
                    <button
                      className="icoonknop"
                      aria-label="Pagina omlaag"
                      disabled={p.volgorde === paginas.length}
                      onClick={() => void verplaats(p, 1)}
                    >
                      ↓
                    </button>
                    {p.foto && p.status !== 'bevestigd' && (
                      <button className="icoonknop" aria-label="Foto een kwartslag draaien en opnieuw herkennen" disabled={bezig !== null} onClick={() => void draaiPagina(p)}>
                        ⟳
                      </button>
                    )}
                    <button className="icoonknop" aria-label="Pagina verwijderen" disabled={bezig !== null} onClick={() => void verwijderPagina(p)}>
                      🗑
                    </button>
                  </span>
                </div>
                <label className="paginanummer">
                  <span className="gedempt">Bladzijde in het boek</span>
                  <input
                    className="invoer"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    defaultValue={p.origineelNummer ?? ''}
                    onBlur={(e) => void echteDb.bronpaginas.update(p.id, { origineelNummer: e.target.value ? Number(e.target.value) : null })}
                  />
                </label>
                {p.melding && <p className="gedempt">{p.melding}</p>}
                {p.status !== 'bevestigd' && p.foto && (
                  <button className="link" disabled={bezig !== null} onClick={() => void opnieuw(p)}>
                    Opnieuw herkennen
                  </button>
                )}
                {p.losseRegels.length > 0 && p.status !== 'bevestigd' && (
                  <details>
                    <summary className="gedempt">{p.losseRegels.length} regels zonder woordpaar</summary>
                    <ul>
                      {p.losseRegels.map((r, i) => (
                        <li key={i} className="gedempt">
                          {r}{' '}
                          <button
                            className="link"
                            onClick={() =>
                              void echteDb.bronpaginas
                                .update(p.id, { losseRegels: p.losseRegels.filter((_, j) => j !== i) })
                                .then(() => losseRegelAlsPaar(r, p.id))
                            }
                          >
                            + als woordpaar
                          </button>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </li>
            ))}
          </ul>
          {mislukt.length > 0 && (
            <p className="feedback feedback-storing">
              Let op: {mislukt.length === 1 ? 'één pagina is' : `${mislukt.length} pagina's zijn`} niet gelukt. Die woorden ontbreken nog.
            </p>
          )}
        </section>
      )}

      {(open.length > 0 || paginas.some((p) => p.status !== 'bevestigd')) && (
        <section className="kaart">
          <h2>Controleer de woorden</h2>
          <p>
            Klopt alles? Verbeter wat fout gelezen is.
            {teBekijken.length > 0 && (
              <strong>
                {' '}
                Nog {teBekijken.length} {teBekijken.length === 1 ? 'woordpaar' : 'woordparen'} met twijfel om te bekijken.
              </strong>
            )}
          </p>
          <ul className="controle">
            {open.map((wp, index) => {
              const volgende = open[index + 1]
              const twijfel = wp.twijfelWoord !== 'geen' || wp.twijfelBetekenis !== 'geen'
              return (
                <li key={wp.id} id={`woordpaar-${wp.id}`} className={twijfel && !wp.bekeken ? 'met-twijfel' : ''}>
                  <div className="controle-velden">
                    <label>
                      <span className="klein">Engels</span> <TwijfelLabel twijfel={wp.bekeken ? 'geen' : wp.twijfelWoord} />
                      <input
                        className="invoer"
                        value={wp.woord}
                        lang="en"
                        autoCapitalize="off"
                        spellCheck={false}
                        onChange={(e) => void wijzig(wp, { woord: e.target.value, bekeken: true })}
                      />
                    </label>
                    <label>
                      <span className="klein">Nederlands</span> <TwijfelLabel twijfel={wp.bekeken ? 'geen' : wp.twijfelBetekenis} />
                      <input
                        className="invoer"
                        value={wp.betekenis}
                        lang="nl"
                        autoCapitalize="off"
                        spellCheck={false}
                        onChange={(e) => void wijzig(wp, { betekenis: e.target.value, bekeken: true })}
                      />
                    </label>
                  </div>
                  <div className="knoppen">
                    {twijfel && !wp.bekeken && (
                      <button className="knop knop-rustig" onClick={() => void wijzig(wp, { bekeken: true })}>
                        ✓ Klopt
                      </button>
                    )}
                    <button className="link" onClick={() => setSplitsen(splitsen === wp.id ? null : wp.id)}>
                      Splitsen
                    </button>
                    {volgende && (
                      <button className="link" onClick={() => void samenvoegen(wp, volgende)}>
                        Samenvoegen met volgende
                      </button>
                    )}
                    <button className="link" onClick={() => void verwijder(wp)}>
                      Verwijderen
                    </button>
                  </div>
                  {splitsen === wp.id && (
                    <div className="splitsen">
                      <p className="gedempt">Tik op het woord waar de Nederlandse betekenis begint:</p>
                      <div className="splits-woorden">
                        {splitsbareWoorden(wp).map((w, i) =>
                          i === 0 ? (
                            <span key={i} className="splits-woord vast">
                              {w}
                            </span>
                          ) : (
                            <button
                              key={i}
                              className="splits-woord"
                              onClick={() => {
                                void wijzig(wp, { ...splits(wp, i), bekeken: true })
                                setSplitsen(null)
                              }}
                            >
                              {w}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
          <button className="link" onClick={() => void voegToe()}>
            + Woordpaar zelf toevoegen
          </button>
          <div className="knoppen">
            <button className="knop" disabled={!kanBevestigen(paren) || bezig !== null} onClick={() => void bevestig()}>
              Bevestigen ({open.length} {open.length === 1 ? 'woord' : 'woorden'})
            </button>
          </div>
          {teBekijken.length > 0 && (
            <div className="feedback" role="status">
              <p>
                Bekijk eerst {teBekijken.length === 1 ? 'het woordpaar' : `de ${teBekijken.length} woordparen`} met ⚠: verbeter
                wat fout is en tik op <strong>✓ Klopt</strong>, of verwijder {teBekijken.length === 1 ? 'het' : 'ze'}.
              </p>
              <button
                className="link"
                onClick={() =>
                  document.getElementById(`woordpaar-${teBekijken[0].id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }
              >
                Ga naar {teBekijken.length === 1 ? 'dit woordpaar' : 'het eerste'}
              </button>
            </div>
          )}
          {open.some((wp) => wp.woord.trim() === '' || wp.betekenis.trim() === '') && (
            <p className="feedback">Vul bij elk woordpaar beide kanten in, of verwijder het.</p>
          )}
        </section>
      )}

      {bevestigd.length > 0 && (
        <section className="kaart">
          <h2>Bevestigde woorden</h2>
          <ul className="woordenlijst">
            {bevestigd.map((wp) => (
              <BevestigdWoordpaar
                key={wp.id}
                wp={wp}
                onBewaar={(w, b) => void bewaarBevestigd(wp, w, b)}
                onVerwijder={() => void verwijderBevestigd(wp)}
              />
            ))}
          </ul>
        </section>
      )}

      <section className="kaart">
        <h2>Instellingen van deze bron</h2>
        <label className="label" htmlFor="bronnaam">
          Naam
        </label>
        <input
          id="bronnaam"
          className="invoer"
          defaultValue={bron.naam}
          onBlur={(e) => e.target.value.trim() && void wijzigBron({ naam: e.target.value.trim() })}
        />

        <fieldset className="keuzes">
          <legend className="label">Wat moet je op de toets kunnen?</legend>
          {RICHTINGEN.map((r, i) => (
            <label key={r.label} className="keuze">
              <input type="radio" name="richting" checked={richtingIndex === i} onChange={() => void wijzigBron({ oefenrichtingen: r.waarde })} />
              {r.label}
            </label>
          ))}
          <p className="gedempt">Elke richting telt als een eigen woord, met een eigen voortgang.</p>
        </fieldset>

        <fieldset className="keuzes">
          <legend className="label">Hoe leer je de nieuwe woorden?</legend>
          {STRATEGIEKEUZES.map((k) => (
            <label key={k.waarde} className="keuze">
              <input type="radio" name="strategie" checked={strategie === k.waarde} onChange={() => void kiesStrategie(k.waarde)} />
              {k.label}
            </label>
          ))}
          {strategie === undefined && <p className="gedempt">Nog niet gekozen: dat vraagt de app bij het eerste nieuwe woord.</p>}
          <p className="gedempt">Werkt een aanpak niet goed voor je? Probeer dan eens een andere. Je beelden en routes blijven bewaard.</p>
        </fieldset>

        <label className="label" htmlFor="brontoets">
          Toetsdatum
        </label>
        <input
          id="brontoets"
          className="invoer"
          type="date"
          value={bron.toetsdag ?? ''}
          onChange={(e) => void wijzigBron({ toetsdag: e.target.value || null })}
        />

        <div className="knoppen">
          <button className="knop knop-rustig" onClick={() => void wisselAfronden()}>
            {bron.afgerond ? 'Weer laten herhalen' : 'Bron afronden'}
          </button>
        </div>
        {bron.afgerond && <p className="gedempt">Deze bron is afgerond: de woorden komen niet meer terug. Je voortgang is bewaard.</p>}
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

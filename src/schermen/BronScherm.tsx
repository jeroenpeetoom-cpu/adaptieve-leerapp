import { useCallback, useEffect, useRef, useState } from 'react'
import { verwerkRegels, type Twijfel } from '../bronverwerking'
import { kanBevestigen, nogTeBekijken } from '../bronnen/leeritems'
import type { Bron, Bronpagina, Woordpaar } from '../bronnen/model'
import { controleerBestand, herken } from '../herkenning/herkenner'
import { echteDb } from '../opslag/database'

const MAX_PAGINAS_PER_KEER = 10

const STATUSTEKST: Record<Bronpagina['status'], string> = {
  wachtend: '⏳ Wacht op herkenning',
  verwerkt: '✓ Herkend',
  onzeker: '⚠ Herkend, met twijfel',
  mislukt: '✗ Mislukt',
  bevestigd: '✓ Bevestigd',
}

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
  const fotoRef = useRef<HTMLInputElement>(null)

  const laad = useCallback(async () => {
    setBron((await echteDb.bronnen.get(bronId)) ?? null)
    setPaginas((await echteDb.bronpaginas.where('bronId').equals(bronId).toArray()).sort((a, b) => a.volgorde - b.volgorde))
    setParen((await echteDb.woordparen.where('bronId').equals(bronId).toArray()).sort((a, b) => a.volgorde - b.volgorde))
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
        melding:
          nieuwe.length === 0
            ? 'Op deze foto vond ik geen woordparen. Maak een nieuwe foto of voeg de woorden hieronder zelf toe.'
            : null,
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
    if (fotoRef.current) fotoRef.current.value = ''
  }

  async function opnieuw(pagina: Bronpagina) {
    await echteDb.woordparen.where('bronpaginaId').equals(pagina.id).filter((wp) => !wp.bevestigd).delete()
    await verwerkPagina(pagina, 1, 1)
    setBezig(null)
    await laad()
  }

  async function wijzig(wp: Woordpaar, velden: Partial<Woordpaar>) {
    await echteDb.woordparen.update(wp.id, velden)
    setParen((p) => p.map((x) => (x.id === wp.id ? { ...x, ...velden } : x)))
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

  if (!bron) return null

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
        <label className={`knop ${bezig ? 'uit' : ''}`}>
          📷 Foto van een pagina toevoegen
          <input
            ref={fotoRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            hidden
            disabled={bezig !== null}
            onChange={(e) => void fotosGekozen(e.target.files)}
          />
        </label>
        <p className="gedempt">Maximaal {MAX_PAGINAS_PER_KEER} pagina's per keer. De foto blijft op deze telefoon.</p>

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
                <span>Pagina {p.volgorde}</span> <span className="gedempt">{STATUSTEKST[p.status]}</span>
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
                          {r}
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
            {open.map((wp) => {
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
                    <button className="link" onClick={() => void verwijder(wp)}>
                      Verwijderen
                    </button>
                  </div>
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
              <li key={wp.id}>
                <span lang="en">{wp.woord}</span> = <span lang="nl">{wp.betekenis}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <button className="link" onClick={onTerug}>
        ← Terug
      </button>
    </>
  )
}

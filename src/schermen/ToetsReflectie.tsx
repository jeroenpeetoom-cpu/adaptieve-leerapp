import { useEffect, useState } from 'react'
import type { Bron } from '../bronnen/model'
import {
  STANDAARD_INSTELLINGEN,
  berekenVoortgang,
  gebruikteAanpakken,
  kiesVarianten,
  reflectievraag,
  toetsvormStand,
  type Keuze,
  type Leeritem,
  type Poging,
  type Reflectiedeel,
  type ToetsReflectie as Reflectie,
  type Varianten,
} from '../leerlogica'
import { echteDb } from '../opslag/database'

const nu = () => new Date().toISOString()
const datum = (dag: string) => new Date(`${dag}T12:00:00Z`).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })

type Stap = 'geweest' | 'verzet' | 'kennis' | 'ruimte' | 'cijfers' | 'strategie' | 'vooruit' | 'keuze' | 'klaar'

interface Props {
  bron: Bron
  leeritems: Leeritem[]
  onKlaar: () => void
  onTerug: () => void
}

/** Na de toets: is hij geweest, drie korte vragen, en dan onthouden of klaar (spec na-de-toets). */
export function ToetsReflectie({ bron, leeritems, onKlaar, onTerug }: Props) {
  const [stap, setStap] = useState<Stap>('geweest')
  const [pogingen, setPogingen] = useState<Poging[] | null>(null)
  const [varianten, setVarianten] = useState<Varianten | null>(null)
  const [antwoorden, setAntwoorden] = useState<Reflectie['antwoorden']>({})
  const [nieuweDag, setNieuweDag] = useState('')
  const [keuze, setKeuze] = useState<Reflectie['keuze'] | null>(null)

  useEffect(() => {
    void (async () => {
      const ids = new Set(leeritems.map((i) => i.id))
      setPogingen((await echteDb.pogingen.toArray()).filter((p) => ids.has(p.leeritemId)))
      const eerder = await echteDb.leesMeta<Reflectie[]>('toetsreflecties', [])
      setVarianten(kiesVarianten(eerder.at(-1)?.varianten ?? null, `${bron.id}-${bron.toetsdag}`))
    })()
  }, [bron.id, bron.toetsdag, leeritems])

  if (!pogingen || !varianten) return null

  async function verzet() {
    if (!nieuweDag) return
    await echteDb.bronnen.update(bron.id, { toetsdag: nieuweDag })
    onKlaar()
  }

  async function rondAf(gekozen: Reflectie['keuze']) {
    const reflectie: Reflectie = { bronId: bron.id, toetsdag: bron.toetsdag!, tijdstip: nu(), varianten: varianten!, antwoorden, keuze: gekozen }
    const eerder = await echteDb.leesMeta<Reflectie[]>('toetsreflecties', [])
    await echteDb.schrijfMeta('toetsreflecties', [...eerder, reflectie])
    await echteDb.bronnen.update(bron.id, {
      toetsGereflecteerd: bron.toetsdag!,
      afgerond: gekozen === 'klaar',
      onderhoud: gekozen === 'onthouden',
    })
    setKeuze(gekozen)
    setStap('klaar')
  }

  const kies = (deel: Reflectiedeel | 'ruimte', id: string, volgende: Stap) => {
    setAntwoorden((a) => ({ ...a, [deel]: id }))
    setStap(volgende)
  }

  const knoppen = (keuzes: Keuze[], opKies: (id: string) => void) => (
    <div className="opties-lijst">
      {keuzes.map((k) => (
        <button key={k.id} className="knop knop-rustig optie" onClick={() => opKies(k.id)}>
          {k.tekst}
        </button>
      ))}
    </div>
  )

  const kennis = reflectievraag('kennis', varianten.kennis)
  const strategie = reflectievraag('strategie', varianten.strategie)
  const vooruit = reflectievraag('vooruit', varianten.vooruit)
  const stappen: Stap[] = ['kennis', 'strategie', 'vooruit']
  const nummer = stap === 'ruimte' || stap === 'cijfers' ? 1 : stappen.indexOf(stap) + 1

  // Ter vergelijking: wat de leerling in de app liet zien, liefst in toetsvorm.
  const toets = toetsvormStand(leeritems, pogingen)
  const zelf = leeritems.filter((i) => berekenVoortgang(i, pogingen, STANDAARD_INSTELLINGEN).status !== 'nog aan het leren').length
  const cijfers =
    toets.gesteld > 0
      ? `In de toetsronde in de app wist je ${toets.geweten} van de ${toets.gesteld}.`
      : `In de app kon je ${zelf} van de ${leeritems.length} zelf terughalen.`

  return (
    <section className="kaart reflectie-na-toets">
      <h2>🏁 {bron.naam}</h2>
      {nummer >= 1 && stap !== 'keuze' && stap !== 'klaar' && <p className="gedempt">Vraag {nummer} van 3</p>}

      {stap === 'geweest' && (
        <>
          <p className="vraag">Is de toets van {datum(bron.toetsdag!)} geweest?</p>
          <div className="knoppen">
            <button className="knop" onClick={() => setStap('kennis')}>
              Ja
            </button>
            <button className="knop knop-rustig" onClick={() => setStap('verzet')}>
              Nee, hij is verzet
            </button>
          </div>
        </>
      )}

      {stap === 'verzet' && (
        <>
          <label className="label" htmlFor="nieuwe-dag">
            Wanneer is de toets nu?
          </label>
          <input id="nieuwe-dag" className="invoer" type="date" value={nieuweDag} min={bron.toetsdag ?? undefined} onChange={(e) => setNieuweDag(e.target.value)} />
          <div className="knoppen">
            <button className="knop" disabled={!nieuweDag} onClick={() => void verzet()}>
              Opslaan en verder oefenen
            </button>
          </div>
        </>
      )}

      {stap === 'kennis' && (
        <>
          <p className="vraag">{kennis.vraag}</p>
          {knoppen(kennis.keuzes, (id) => kies('kennis', id, kennis.vervolg?.bij.includes(id) ? 'ruimte' : 'cijfers'))}
        </>
      )}

      {stap === 'ruimte' && kennis.vervolg && (
        <>
          <p className="vraag">{kennis.vervolg.vraag}</p>
          {knoppen(kennis.vervolg.keuzes, (id) => kies('ruimte', id, 'cijfers'))}
        </>
      )}

      {stap === 'cijfers' && (
        <>
          <p className="vraag">🔬 Even vergelijken</p>
          <p>{cijfers}</p>
          <p className="gedempt">Klopt dat met hoe de toets voelde? Dat is goed om te weten voor de volgende keer.</p>
          <button className="knop" onClick={() => setStap('strategie')}>
            Verder
          </button>
        </>
      )}

      {stap === 'strategie' && (
        <>
          <p className="vraag">{strategie.vraag}</p>
          {knoppen(gebruikteAanpakken(leeritems, pogingen, STANDAARD_INSTELLINGEN.tijdzone), (id) => kies('strategie', id, 'vooruit'))}
        </>
      )}

      {stap === 'vooruit' && (
        <>
          <p className="vraag">{vooruit.vraag}</p>
          {knoppen(vooruit.keuzes, (id) => kies('vooruit', id, 'keuze'))}
        </>
      )}

      {stap === 'keuze' && (
        <>
          <p className="vraag">Wil je dit blijven onthouden, of is het klaar?</p>
          <p className="gedempt">Komt dit later nog terug op school? Dan is onthouden slim.</p>
          <div className="opties-lijst">
            <button className="knop optie" onClick={() => void rondAf('onthouden')}>
              🧠 Blijven onthouden: af en toe een vraagje
            </button>
            <button className="knop knop-rustig optie" onClick={() => void rondAf('klaar')}>
              ✅ Klaar: niet meer oefenen
            </button>
          </div>
        </>
      )}

      {stap === 'klaar' && (
        <>
          <p className="vraag">Bedankt! 🚀</p>
          <p>
            {keuze === 'klaar'
              ? 'Deze bron is afgerond. Je voortgang blijft bewaard, en bij de bron kun je hem altijd weer laten herhalen.'
              : 'Af en toe komt er een vraag uit deze bron langs, zodat je het niet vergeet.'}
          </p>
          <button className="knop" onClick={onKlaar} autoFocus>
            Verder
          </button>
        </>
      )}

      {stap !== 'klaar' && (
        <button className="link" onClick={onTerug}>
          ← Later
        </button>
      )}
    </section>
  )
}

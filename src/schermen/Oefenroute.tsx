import { useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  kalenderdag,
  startSessie,
  stelSessieSamen,
  type BronInfo,
  type Instellingen,
  type Leeritem,
  type Poging,
  type SessieToestand,
  type Strategie,
} from '../leerlogica'
import type { Geheugenbeeld, Kaart, Route } from '../bronnen/model'
import { beeldTekst, routeMetVrijePlek, standaardRoutenaam } from '../bronnen/routes'
import { legStrategieVast, type Reflectie } from '../opslag/strategie'
import { ReflectieVraag } from './Reflectie'
import type { Database } from '../opslag/database'
import { OefenSessie } from './OefenSessie'
import { Terugblik } from './Terugblik'

type Weergave =
  | { soort: 'overzicht' }
  | { soort: 'sessie'; toestand: SessieToestand }
  | { soort: 'klaar'; toestand: SessieToestand }

export interface OverzichtInfo {
  pogingen: Poging[]
  leeritems: Leeritem[]
  vandaag: string
}

interface Props {
  db: Database
  /** Naam per bron, voor de standaardnaam van een route. */
  bronnamen?: Record<string, string>
  leeritems: Leeritem[]
  bronnen: BronInfo[]
  nu: () => string
  instellingen: Instellingen
  /** Getoond als er nog helemaal geen leeritems zijn. */
  leeg: ReactNode
  boven?: ReactNode
  onder?: (info: OverzichtInfo) => ReactNode
  /** Laat de ouder weten of er een sessie of terugblik openstaat. */
  onBezig?: (bezig: boolean) => void
}

/** Vandaag oefenen: samenstellen, sessie, hervatten, terugblik en nog een rondje. */
export function Oefenroute({ db, bronnamen = {}, leeritems: basis, bronnen, nu, instellingen, leeg, boven, onder, onBezig }: Props) {
  const [pogingen, setPogingen] = useState<Poging[]>([])
  const [extraAntwoorden, setExtraAntwoorden] = useState<Record<string, string[]>>({})
  const [openSessie, setOpenSessie] = useState<SessieToestand | null>(null)
  const [weergave, setWeergaveIntern] = useState<Weergave>({ soort: 'overzicht' })
  const [melding, setMelding] = useState<string | null>(null)
  const [beelden, setBeelden] = useState<Geheugenbeeld[]>([])
  const [strategiePerBron, setStrategiePerBron] = useState<Record<string, Strategie | 'geen'>>({})
  const [voorgedaan, setVoorgedaan] = useState<Strategie[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [kaarten, setKaarten] = useState<Record<string, Kaart>>({})
  const [laatsteReflectie, setLaatsteReflectie] = useState<Reflectie | null>(null)
  /** De bron die de leerling koos om te oefenen; null is alles samen. "Nog een rondje" blijft daarbij. */
  const [gekozenBron, setGekozenBron] = useState<string | null>(null)

  const setWeergave = useCallback(
    (w: Weergave) => {
      setWeergaveIntern(w)
      onBezig?.(w.soort !== 'overzicht')
    },
    [onBezig],
  )

  const laad = useCallback(async () => {
    setPogingen(await db.pogingen.toArray())
    setExtraAntwoorden(await db.leesMeta<Record<string, string[]>>('extraAntwoorden', {}))
    setBeelden(await db.geheugenbeelden.toArray())
    setRoutes(await db.routes.toArray())
    setKaarten(Object.fromEntries((await db.kaarten.toArray()).map((k) => [k.id, k])))
    setLaatsteReflectie(await db.leesMeta<Reflectie | null>('laatsteReflectie', null))
    setStrategiePerBron(await db.leesMeta<Record<string, Strategie | 'geen'>>('strategiePerBron', {}))
    setVoorgedaan(await db.leesMeta<Strategie[]>('voorgedaan', []))
    const open = await db.openSessie()
    // Een gepauzeerde sessie uit een oudere versie van de app is niet te hervatten; die sluiten we af.
    if (open && !('vorm' in open.toestand)) await db.slaSessieOp(open.toestand, true, open.bijgewerkt)
    setOpenSessie(open && 'vorm' in open.toestand ? open.toestand : null)
  }, [db])

  useEffect(() => {
    void laad()
  }, [laad])

  const vandaag = kalenderdag(nu(), instellingen.tijdzone)

  // Door de leerling toegevoegde toegestane antwoorden gelden voortaan bij het leeritem.
  const leeritems = basis.map((i) => ({
    ...i,
    toegestaneAntwoorden: [...i.toegestaneAntwoorden, ...(extraAntwoorden[i.id] ?? [])],
  }))

  /** Wat er vandaag klaarstaat, voor alle bronnen samen (null) of voor één bron. */
  const samenstellingVoor = (bronId: string | null) =>
    stelSessieSamen(
      bronId === null ? leeritems : leeritems.filter((i) => i.bronId === bronId),
      pogingen,
      bronnen,
      vandaag,
      instellingen,
    )
  const samenstelling = samenstellingVoor(null)
  const totaal = (s: typeof samenstelling) => s.repetitie.length + s.herhalingen.length + s.nieuw.length
  const aantal = totaal(samenstelling)
  const perBron = [...new Set(leeritems.map((i) => i.bronId))]
    .map((bronId) => ({ bronId, s: samenstellingVoor(bronId) }))
    .filter(({ s }) => totaal(s) > 0)

  /** Korte omschrijving van wat er klaarstaat, met de geschatte duur. */
  const omschrijving = (s: typeof samenstelling) => {
    const delen = []
    if (s.repetitie.length > 0) delen.push(`${s.repetitie.length} voor de generale repetitie`)
    if (s.herhalingen.length > 0) delen.push(`${s.herhalingen.length} ${s.herhalingen.length === 1 ? 'herhaling' : 'herhalingen'}`)
    if (s.nieuw.length > 0) delen.push(`${s.nieuw.length} ${s.nieuw.length === 1 ? 'nieuw woord' : 'nieuwe woorden'}`)
    return `${delen.join(', ')} · ongeveer ${s.minuten} ${s.minuten === 1 ? 'minuut' : 'minuten'}`
  }
  const langerMelding = (s: typeof samenstelling) =>
    s.tekort ? (
      <p className="feedback" role="note">
        📅 Er komt een toets aan, en niet alles past meer in de tijd. Een extra rondje helpt, of begin de volgende keer eerder.
      </p>
    ) : s.langer ? (
      <p className="feedback" role="note">
        📅 Er komt een toets aan. Vandaag duurt het wat langer, ongeveer {s.minuten} minuten, zodat je op tijd alles geleerd hebt.
      </p>
    ) : null

  function startNieuweSessie(bronId: string | null = gekozenBron): boolean {
    const gekozen = samenstellingVoor(bronId)
    const items = [...gekozen.repetitie, ...gekozen.herhalingen, ...gekozen.nieuw]
    if (items.length === 0) return false
    setGekozenBron(bronId)
    setMelding(null)
    const strategiePerItem = Object.fromEntries(
      beelden.map((b) => [b.leeritemId, b.routeId ? ('geheugenroute' as const) : ('beelden koppelen' as const)]),
    )
    setWeergave({ soort: 'sessie', toestand: startSessie(crypto.randomUUID(), items, pogingen, strategiePerItem) })
    return true
  }

  async function antwoordToegevoegd(leeritemId: string, antwoord: string) {
    const nieuw = { ...extraAntwoorden, [leeritemId]: [...(extraAntwoorden[leeritemId] ?? []), antwoord] }
    await db.schrijfMeta('extraAntwoorden', nieuw)
    setExtraAntwoorden(nieuw)
  }

  async function kiesStrategie(bronId: string, strategie: Strategie | 'geen') {
    await legStrategieVast(db, bronId, strategie, nu())
    setStrategiePerBron({ ...strategiePerBron, [bronId]: strategie })
  }

  async function bewaarReflectie(sessieId: string, tekst: string) {
    const reflectie = { tekst, tijdstip: nu() }
    await db.sessies.update(sessieId, { reflectie: tekst })
    await db.schrijfMeta('laatsteReflectie', reflectie)
    setLaatsteReflectie(reflectie)
  }

  async function markeerVoorgedaan(strategie: Strategie) {
    const nieuw = [...new Set([...voorgedaan, strategie])]
    await db.schrijfMeta('voorgedaan', nieuw)
    setVoorgedaan(nieuw)
  }

  async function bewaarBeeld(beeld: Omit<Geheugenbeeld, 'id' | 'aangemaakt'>) {
    const volledig: Geheugenbeeld = { ...beeld, id: crypto.randomUUID(), aangemaakt: nu() }
    // Eén geheugenbeeld per leeritem: een nieuw beeld vervangt het oude.
    await db.geheugenbeelden.where('leeritemId').equals(beeld.leeritemId).delete()
    await db.geheugenbeelden.add(volledig)
    setBeelden((b) => [...b.filter((x) => x.leeritemId !== beeld.leeritemId), volledig])
  }

  async function maakRoute(bronId: string, naam: string, plekken: string[]) {
    const route: Route = { id: crypto.randomUUID(), bronId, naam, plekken, aangemaakt: nu() }
    await db.routes.add(route)
    setRoutes((r) => [...r, route])
  }

  if (weergave.soort === 'sessie') {
    return (
      <>
        <OefenSessie
          key={weergave.toestand.sessieId}
          db={db}
          begintoestand={weergave.toestand}
          bronItems={leeritems}
          nu={nu}
          onAntwoordToegevoegd={antwoordToegevoegd}
          onKlaar={(toestand) => void laad().then(() => setWeergave({ soort: 'klaar', toestand }))}
          geheugenbeelden={Object.fromEntries(beelden.map((b) => [b.leeritemId, beeldTekst(b, routes)]))}
          routeVoor={(bronId) => routeMetVrijePlek(bronId, routes, beelden)}
          routenaamVoor={(bronId) =>
            standaardRoutenaam(bronnamen[bronId] ?? 'woorden', routes.filter((r) => r.bronId === bronId))
          }
          onMaakRoute={maakRoute}
          laatsteReflectie={laatsteReflectie?.tekst ?? null}
          aantalBeelden={{
            'beelden koppelen': beelden.filter((b) => !b.routeId).length,
            geheugenroute: beelden.filter((b) => b.routeId).length,
          }}
          beeldenMetSteuntje={instellingen.beeldenMetSteuntje}
          eerderePogingen={pogingen}
          instellingen={instellingen}
          kaarten={kaarten}
          strategiePerBron={strategiePerBron}
          voorgedaan={voorgedaan}
          onKiesStrategie={kiesStrategie}
          onVoorgedaan={markeerVoorgedaan}
          onGeheugenbeeld={bewaarBeeld}
        />
        <button className="link" onClick={() => void laad().then(() => setWeergave({ soort: 'overzicht' }))}>
          ← Pauzeren
        </button>
      </>
    )
  }

  if (weergave.soort === 'klaar') {
    return (
      <Terugblik sessie={weergave.toestand} pogingen={pogingen} vandaag={vandaag} instellingen={instellingen}>
        <ReflectieVraag key={weergave.toestand.sessieId} onKies={(tekst) => void bewaarReflectie(weergave.toestand.sessieId, tekst)} />
        {melding && <p className="feedback">{melding}</p>}
        <div className="knoppen">
          <button
            className="knop"
            onClick={() => {
              if (startNieuweSessie()) return
              setMelding(
                gekozenBron !== null && aantal > 0
                  ? 'Deze lijst is klaar voor vandaag. Tik op "Klaar voor vandaag" om een andere lijst te kiezen.'
                  : 'Alles voor vandaag is klaar. Morgen komen er weer woorden terug.',
              )
            }}
          >
            Nog een rondje
          </button>
          <button className="knop knop-rustig" onClick={() => setWeergave({ soort: 'overzicht' })}>
            Klaar voor vandaag
          </button>
        </div>
      </Terugblik>
    )
  }

  return (
    <>
      {boven}
      <section className="kaart">
        <h2>Vandaag</h2>
        {basis.length === 0 ? (
          leeg
        ) : openSessie ? (
          <>
            <p>Je hebt een sessie gepauzeerd.</p>
            <button className="knop" onClick={() => setWeergave({ soort: 'sessie', toestand: openSessie })}>
              Ga verder
            </button>
          </>
        ) : perBron.length > 1 ? (
          <>
            <p>Welke lijst wil je oefenen?</p>
            <ul className="bronkeuze">
              {perBron.map(({ bronId, s }) => (
                <li key={bronId}>
                  <button className="bron-knop" onClick={() => startNieuweSessie(bronId)}>
                    <strong>{bronnamen[bronId] ?? 'Bron'}</strong>
                    <span className="gedempt">{omschrijving(s)}</span>
                    {s.langer && <span className="gedempt">📅 toets op komst: wat langer vandaag</span>}
                  </button>
                </li>
              ))}
            </ul>
            <button className="knop knop-rustig" onClick={() => startNieuweSessie(null)}>
              Alles samen ({aantal} {aantal === 1 ? 'woord' : 'woorden'})
            </button>
          </>
        ) : aantal > 0 ? (
          <>
            <p>
              {omschrijving(samenstelling)}
              {perBron.length === 1 && bronnamen[perBron[0].bronId] ? ` · ${bronnamen[perBron[0].bronId]}` : ''}
            </p>
            {langerMelding(samenstelling)}
            <button className="knop" onClick={() => startNieuweSessie(null)}>
              Start ({aantal} {aantal === 1 ? 'woord' : 'woorden'})
            </button>
          </>
        ) : (
          <p>Alles voor vandaag is klaar. Morgen komen er weer woorden terug.</p>
        )}
      </section>
      {onder?.({ pogingen, leeritems, vandaag })}
    </>
  )
}

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
import type { Geheugenbeeld, Route } from '../bronnen/model'
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
  const [laatsteReflectie, setLaatsteReflectie] = useState<Reflectie | null>(null)

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

  const samenstelling = stelSessieSamen(leeritems, pogingen, bronnen, vandaag, instellingen)
  const aantal = samenstelling.herhalingen.length + samenstelling.nieuw.length

  function startNieuweSessie(): boolean {
    if (aantal === 0) return false
    const items = [...samenstelling.herhalingen, ...samenstelling.nieuw]
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
              if (!startNieuweSessie()) setMelding('Alles voor vandaag is klaar. Morgen komen er weer woorden terug.')
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
        ) : aantal > 0 ? (
          <>
            <p>
              {samenstelling.herhalingen.length} {samenstelling.herhalingen.length === 1 ? 'herhaling' : 'herhalingen'} en{' '}
              {samenstelling.nieuw.length} {samenstelling.nieuw.length === 1 ? 'nieuw woord' : 'nieuwe woorden'}.
            </p>
            <button className="knop" onClick={() => startNieuweSessie()}>
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

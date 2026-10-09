import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  isKlaar,
  mengVolgorde,
  kalenderdag,
  nogTeGaan,
  startSessie,
  stelExtraSamen,
  stelSessieSamen,
  type BronInfo,
  type Instellingen,
  type Leeritem,
  type Poging,
  type Puntentelling,
  type SessieToestand,
  type Strategie,
} from '../leerlogica'
import type { Geheugenbeeld, Kaart, Route } from '../bronnen/model'
import { beeldTekst, routeMetVrijePlek, standaardRoutenaam } from '../bronnen/routes'
import { legStrategieVast, type Reflectie } from '../opslag/strategie'
import { leesPunten, puntenErbij } from '../opslag/punten'
import { PuntenErbij } from './Punten'
import { ReflectieVraag } from './Reflectie'
import type { Database } from '../opslag/database'
import { OefenSessie } from './OefenSessie'
import { Terugblik } from './Terugblik'

type Weergave =
  | { soort: 'overzicht' }
  | { soort: 'sessie'; toestand: SessieToestand }
  | { soort: 'klaar'; toestand: SessieToestand; erbij: Puntentelling | null; totaal: number }

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
  const [openSessies, setOpenSessies] = useState<SessieToestand[]>([])
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
  /** De punten bij het begin van de sessie, om na afloop te laten zien wat erbij kwam. */
  const puntenBijStart = useRef<Puntentelling | null>(null)

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
    const open = await db.openSessies()
    // Een gepauzeerde sessie uit een oudere versie van de app is niet te hervatten; die sluiten we af.
    for (const o of open.filter((o) => !('vorm' in o.toestand))) await db.slaSessieOp(o.toestand, true, o.bijgewerkt)
    setOpenSessies(open.filter((o) => 'vorm' in o.toestand && !isKlaar(o.toestand)).map((o) => o.toestand))
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
    .filter((bronId) => { const b = bronnen.find((x) => x.bronId === bronId); return !b?.afgerond && !b?.wachtOpReflectie })
    .map((bronId) => ({ bronId, s: samenstellingVoor(bronId) }))

  /** De bronnen in een sessie; een gepauzeerde sessie hoort bij één lijst of bij "alles samen". */
  const bronnenVan = (t: SessieToestand) => [...new Set(t.leeritems.map((i) => i.bronId))]
  const gepauzeerdVoor = (bronId: string) => openSessies.find((t) => bronnenVan(t).length === 1 && bronnenVan(t)[0] === bronId)
  const gepauzeerdSamen = openSessies.filter((t) => bronnenVan(t).length > 1)

  async function sluitAf(t: SessieToestand) {
    // Wat al geoefend is, is al opgeslagen en telt gewoon mee.
    await db.slaSessieOp(t, true, nu())
    setOpenSessies((o) => o.filter((x) => x.sessieId !== t.sessieId))
  }

  const hervatKnop = (t: SessieToestand, titel: string) => (
    <li key={t.sessieId}>
      <div className="bron-knop gepauzeerd">
        <button
          className="bron-knop-hoofd"
          onClick={() => {
            void leesPunten(db, instellingen).then((p) => (puntenBijStart.current = p))
            setWeergave({ soort: 'sessie', toestand: t })
          }}
        >
          <strong>{titel}</strong>
          <span className="gedempt">⏸ Ga verder · nog {nogTeGaan(t)}</span>
        </button>
        <button className="link" onClick={() => void sluitAf(t)}>
          Afsluiten
        </button>
      </div>
    </li>
  )

  /** Korte omschrijving van wat er klaarstaat, met de geschatte duur. */
  const omschrijving = (s: typeof samenstelling) => {
    const delen = []
    if (s.repetitie.length > 0) delen.push(`${s.repetitie.length} voor de generale repetitie`)
    if (s.toetsvorm.length > 0) delen.unshift(`📝 toetsronde met ${s.toetsvorm.length}`)
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

  /** Extra oefenen voor een lijst (of alles) als er vandaag niets meer klaarstaat. */
  const extraVoor = (bronId: string | null) =>
    stelExtraSamen(bronId === null ? leeritems : leeritems.filter((i) => i.bronId === bronId), pogingen, bronnen, instellingen)

  function startNieuweSessie(bronId: string | null = gekozenBron): boolean {
    const gekozen = samenstellingVoor(bronId)
    let items = [...gekozen.repetitie, ...gekozen.herhalingen, ...gekozen.nieuw]
    // Niets meer aan de beurt: dan een extra ronde met wat het minst goed zit.
    if (items.length === 0) items = extraVoor(bronId)
    if (items.length === 0) return false
    setGekozenBron(bronId)
    void leesPunten(db, instellingen).then((p) => (puntenBijStart.current = p))
    setMelding(null)
    // Door elkaar, en twee richtingen van hetzelfde nooit vlak na elkaar.
    const sessieId = crypto.randomUUID()
    // Eerst de toetsronde (schoolvorm), dan de rest; elk deel door elkaar.
    const inToets = new Set(gekozen.toetsvorm)
    const toetsItems = mengVolgorde(items.filter((i) => inToets.has(i.id)), sessieId)
    items = [...toetsItems, ...mengVolgorde(items.filter((i) => !inToets.has(i.id)), sessieId)]
    const strategiePerItem = Object.fromEntries(
      beelden.map((b) => [b.leeritemId, b.routeId ? ('geheugenroute' as const) : ('beelden koppelen' as const)]),
    )
    setWeergave({ soort: 'sessie', toestand: startSessie(sessieId, items, pogingen, strategiePerItem, toetsItems.length) })
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
          onPauzeer={() => void laad().then(() => setWeergave({ soort: 'overzicht' }))}
          onKlaar={(toestand) =>
            void laad()
              .then(() => leesPunten(db, instellingen))
              .then((na) =>
                setWeergave({ soort: 'klaar', toestand, erbij: puntenBijStart.current ? puntenErbij(puntenBijStart.current, na) : null, totaal: na.totaal }),
              )
          }
          geheugenbeelden={Object.fromEntries(
            beelden.flatMap((b) => {
              const tekst = beeldTekst(b, routes)
              // Een beeld bij een plek geldt voor aanwijzen én benoemen van die plek.
              const plek = b.leeritemId.match(/^(.*)-(aanwijzen|benoemen)$/)
              return plek ? [[`${plek[1]}-aanwijzen`, tekst], [`${plek[1]}-benoemen`, tekst]] : [[b.leeritemId, tekst]]
            }),
          )}
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
      </>
    )
  }

  if (weergave.soort === 'klaar') {
    return (
      <Terugblik
        sessie={weergave.toestand}
        pogingen={pogingen}
        vandaag={vandaag}
        instellingen={instellingen}
        alleItems={leeritems}
        metBeeld={new Set(beelden.map((b) => b.leeritemId))}
      >
        {weergave.erbij && <PuntenErbij erbij={weergave.erbij} totaal={weergave.totaal} />}
        <ReflectieVraag key={weergave.toestand.sessieId} onKies={(tekst) => void bewaarReflectie(weergave.toestand.sessieId, tekst)} />
        {melding && <p className="feedback">{melding}</p>}
        <div className="knoppen">
          <button
            className="knop"
            onClick={() => {
              if (startNieuweSessie()) return
              setMelding(
                'Er is niets meer om te oefenen in deze lijst. Morgen komen er weer woorden terug.',
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
        ) : perBron.length + openSessies.length > 1 ? (
          <>
            <p>Welke lijst wil je oefenen?</p>
            <ul className="bronkeuze">
              {gepauzeerdSamen.map((t) => hervatKnop(t, 'Alles samen'))}
              {[...new Set([...perBron.map((p) => p.bronId), ...openSessies.flatMap((t) => (bronnenVan(t).length === 1 ? bronnenVan(t) : []))])].map((bronId) => {
                const gepauzeerd = gepauzeerdVoor(bronId)
                if (gepauzeerd) return hervatKnop(gepauzeerd, bronnamen[bronId] ?? 'Bron')
                const s = perBron.find((p) => p.bronId === bronId)!.s
                const klaarVoorVandaag = totaal(s) === 0
                if (klaarVoorVandaag && extraVoor(bronId).length === 0) return null
                return (
                  <li key={bronId}>
                    <button className={`bron-knop ${klaarVoorVandaag ? 'klaar' : ''}`} onClick={() => startNieuweSessie(bronId)}>
                      <strong>{bronnamen[bronId] ?? 'Bron'}</strong>
                      <span className="gedempt">{klaarVoorVandaag ? '✓ Klaar voor vandaag · Extra oefenen' : omschrijving(s)}</span>
                      {s.langer && <span className="gedempt">📅 toets op komst: wat langer vandaag</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
            {aantal > 0 && gepauzeerdSamen.length === 0 && (
              <button className="knop knop-rustig" onClick={() => startNieuweSessie(null)}>
                Alles samen ({aantal} {aantal === 1 ? 'woord' : 'woorden'})
              </button>
            )}
          </>
        ) : openSessies.length === 1 ? (
          <ul className="bronkeuze">{hervatKnop(openSessies[0], bronnamen[bronnenVan(openSessies[0])[0]] ?? 'Je sessie')}</ul>
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
          <>
            <p>Alles voor vandaag is klaar. Morgen komen er weer woorden terug.</p>
            {extraVoor(null).length > 0 && (
              <button className="knop knop-rustig" onClick={() => startNieuweSessie(null)}>
                Extra oefenen
              </button>
            )}
          </>
        )}
      </section>
      {onder?.({ pogingen, leeritems, vandaag })}
    </>
  )
}

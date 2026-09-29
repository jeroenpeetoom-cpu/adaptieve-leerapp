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
} from '../leerlogica'
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
export function Oefenroute({ db, leeritems: basis, bronnen, nu, instellingen, leeg, boven, onder, onBezig }: Props) {
  const [pogingen, setPogingen] = useState<Poging[]>([])
  const [extraAntwoorden, setExtraAntwoorden] = useState<Record<string, string[]>>({})
  const [openSessie, setOpenSessie] = useState<SessieToestand | null>(null)
  const [weergave, setWeergaveIntern] = useState<Weergave>({ soort: 'overzicht' })
  const [melding, setMelding] = useState<string | null>(null)

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
    setWeergave({ soort: 'sessie', toestand: startSessie(crypto.randomUUID(), items, pogingen) })
    return true
  }

  async function antwoordToegevoegd(leeritemId: string, antwoord: string) {
    const nieuw = { ...extraAntwoorden, [leeritemId]: [...(extraAntwoorden[leeritemId] ?? []), antwoord] }
    await db.schrijfMeta('extraAntwoorden', nieuw)
    setExtraAntwoorden(nieuw)
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

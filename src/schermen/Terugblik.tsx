import type { ReactNode } from 'react'
import { LANDING } from '../weergave/ruimte'
import {
  beschrijfAanpak,
  berekenPlanning,
  berekenVoortgang,
  dagenTussen,
  type Instellingen,
  type Leeritem,
  type Poging,
  type Beeldvergelijking,
  type SessieToestand,
  type Voortgangsstatus,
  vergelijkBeelden,
} from '../leerlogica'

const STATUS: Record<Voortgangsstatus, { icoon: string; tekst: string }> = {
  'nog aan het leren': { icoon: '🌱', tekst: 'Nog aan het leren' },
  'zelf teruggehaald': { icoon: '⭐', tekst: 'Zelf teruggehaald' },
  'later nog geweten': { icoon: '🚀', tekst: 'Later nog geweten' },
}

const RANG: Voortgangsstatus[] = ['nog aan het leren', 'zelf teruggehaald', 'later nog geweten']

export function StatusLabel({ status }: { status: Voortgangsstatus }) {
  return (
    <span className={`status status-${RANG.indexOf(status)}`}>
      <span aria-hidden="true">{STATUS[status].icoon} </span>
      {STATUS[status].tekst}
    </span>
  )
}

function wanneerTerug(vandaag: string, dag: string | null): string {
  if (dag === null) return ''
  const n = dagenTussen(vandaag, dag)
  if (n <= 0) return 'komt vandaag nog terug'
  if (n === 1) return 'komt morgen terug'
  return `komt over ${n} dagen terug`
}

const procent = (geweten: number, getoetst: number) => Math.round((100 * geweten) / getoetst)

/** Met en zonder eigen geheugenbeeld: hoe vaak wist de leerling het na een week nog? */
export function BeeldvergelijkingTekst({ vergelijking }: { vergelijking: Beeldvergelijking }) {
  const { met, zonder } = vergelijking
  return (
    <div className="vergelijking">
      <p>
        🔬 <strong>Bij jou</strong>, na een week nog geweten:
      </p>
      <ul>
        <li>
          met een eigen beeld: <strong>{met.geweten} van de {met.getoetst}</strong> ({procent(met.geweten, met.getoetst)}%)
        </li>
        <li>
          zonder beeld: <strong>{zonder.geweten} van de {zonder.getoetst}</strong> ({procent(zonder.geweten, zonder.getoetst)}%)
        </li>
      </ul>
      <p className="gedempt">
        Dit zijn jouw eigen cijfers, geen wet. Misschien maakte je vooral een beeld bij moeilijke woorden; dan zegt het verschil
        minder dan het lijkt.
      </p>
    </div>
  )
}

interface Props {
  sessie: SessieToestand
  pogingen: Poging[]
  vandaag: string
  instellingen: Instellingen
  /** Alle leeritems en welke een eigen geheugenbeeld hebben, voor de vergelijking met en zonder beeld. */
  alleItems?: Leeritem[]
  metBeeld?: Set<string>
  children?: ReactNode
}

export function Terugblik({ sessie, pogingen, vandaag, instellingen, alleItems, metBeeld, children }: Props) {
  const aanpak = beschrijfAanpak(sessie)
  const vergelijking = alleItems && metBeeld ? vergelijkBeelden(alleItems, pogingen, metBeeld, instellingen) : null
  const items = [...new Map(sessie.leeritems.map((i) => [i.id, i])).values()]
  const zelf = items.filter((i) =>
    sessie.pogingen.some((p) => p.leeritemId === i.id && p.oordeel === 'goed' && p.hulp === 'vrij opgehaald'),
  )

  return (
    <section className="kaart">
      <h2>Terugblik</h2>
      <p className="landing">
        {LANDING(sessie.pogingen.filter((p) => p.oordeel === 'goed' && p.hulp === 'vrij opgehaald' && !p.antwoordZelfToegevoegd).length)}
      </p>
      <p>
        Zelf gelukt: <strong>{zelf.length}</strong> van de {items.length} {items.length === 1 ? 'woord' : 'woorden'}.
      </p>
      {aanpak && <p className="aanpak">🧭 {aanpak}</p>}
      {vergelijking?.genoeg && <BeeldvergelijkingTekst vergelijking={vergelijking} />}
      <ul className="terugblik">
        {items.map((item: Leeritem) => {
          const { status, hoogsteOoit } = berekenVoortgang(item, pogingen, instellingen)
          const planning = berekenPlanning(item.id, pogingen, instellingen, item.bronversie)
          const gezakt = RANG.indexOf(hoogsteOoit) > RANG.indexOf(status)
          return (
            <li key={item.id}>
              <div className="terugblik-regel">
                {item.soort === 'plek' ? (
                  <span>
                    <strong>📍 {item.vraag}</strong> <span className="gedempt">{item.plek?.richting ?? 'aanwijzen'}</span>
                  </span>
                ) : (
                  <span>
                    <strong lang={item.oefenrichting.van}>{item.vraag}</strong> →{' '}
                    <span lang={item.oefenrichting.naar}>{item.toegestaneAntwoorden[0]}</span>
                  </span>
                )}
                <StatusLabel status={status} />
              </div>
              <p className="gedempt">
                {wanneerTerug(vandaag, planning.volgendeDag)}
                {gezakt && ` · Je wist dit al eens (${STATUS[hoogsteOoit].tekst.toLowerCase()}), je haalt het snel weer op.`}
              </p>
            </li>
          )
        })}
      </ul>
      {children}
    </section>
  )
}

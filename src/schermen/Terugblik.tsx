import type { ReactNode } from 'react'
import {
  berekenPlanning,
  berekenVoortgang,
  dagenTussen,
  type Instellingen,
  type Leeritem,
  type Poging,
  type SessieToestand,
  type Voortgangsstatus,
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

interface Props {
  sessie: SessieToestand
  pogingen: Poging[]
  vandaag: string
  instellingen: Instellingen
  children?: ReactNode
}

export function Terugblik({ sessie, pogingen, vandaag, instellingen, children }: Props) {
  const items = [...new Map(sessie.leeritems.map((i) => [i.id, i])).values()]
  const zelf = items.filter((i) =>
    sessie.pogingen.some((p) => p.leeritemId === i.id && p.oordeel === 'goed' && p.hulp === 'vrij opgehaald'),
  )

  return (
    <section className="kaart">
      <h2>Terugblik</h2>
      <p>
        Zelf gelukt: <strong>{zelf.length}</strong> van de {items.length} {items.length === 1 ? 'woord' : 'woorden'}.
      </p>
      <ul className="terugblik">
        {items.map((item: Leeritem) => {
          const { status, hoogsteOoit } = berekenVoortgang(item, pogingen, instellingen)
          const planning = berekenPlanning(item.id, pogingen, instellingen)
          const gezakt = RANG.indexOf(hoogsteOoit) > RANG.indexOf(status)
          return (
            <li key={item.id}>
              <div className="terugblik-regel">
                <span>
                  <strong lang={item.oefenrichting.van}>{item.vraag}</strong> →{' '}
                  <span lang={item.oefenrichting.naar}>{item.toegestaneAntwoorden[0]}</span>
                </span>
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

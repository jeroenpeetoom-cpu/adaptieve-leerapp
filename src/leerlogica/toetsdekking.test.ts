// Vangnet (23 oktober): elk woord van een lijst met toets moet vóór de toets geoefend zijn, ook als de
// sessies vol zitten en op tijd worden afgerond. Simuleert 14 dagen met één sessie per dag.
import { expect, it } from 'vitest'
import {
  afrondenNodig, beantwoord, berekenTempo, huidigLeeritem, isKlaar, kalenderdag, mengVolgorde, raad, raadvraagNodig, rondAf,
  startSessie, stelSessieSamen, STANDAARD_INSTELLINGEN, telDagenOp, volgende, type Leeritem, type Poging,
} from './index'

function simuleer(richtingen: 'een' | 'beide', minuten: number, zaad: number) {
  let r = zaad
  const kans = () => ((r = (r * 1103515245 + 12345) % 2147483648) / 2147483648)
  const ins = { ...STANDAARD_INSTELLINGEN, sessieMinuten: minuten }
  const items: Leeritem[] = []
  for (let i = 0; i < 33; i++) {
    const lang = i % 5 === 0 ? 'een hele lange zin die je moet typen' : `woord${i}`
    items.push({ id: `w${i}-en`, soort: 'woordpaar', bronId: 'b', woordpaarId: `w${i}`, bronversie: 1, oefenrichting: { van: 'en', naar: 'nl' }, vraag: `en${i}`, toegestaneAntwoorden: [lang] })
    if (richtingen === 'beide') items.push({ id: `w${i}-nl`, soort: 'woordpaar', bronId: 'b', woordpaarId: `w${i}`, bronversie: 1, oefenrichting: { van: 'nl', naar: 'en' }, vraag: lang, toegestaneAntwoorden: [`en${i}`] })
  }
  const start = '2026-10-01'
  const toetsdag = telDagenOp(start, 14)
  const pogingen: Poging[] = []
  const geleerd = new Map<string, number>()
  for (let dag = 0; dag < 14; dag++) {
    const vandaag = telDagenOp(start, dag)
    let t = new Date(`${vandaag}T15:00:00Z`).getTime()
    const s = stelSessieSamen(items, pogingen, [{ bronId: 'b', toetsdag, afgerond: false }], vandaag, ins, berekenTempo(pogingen, ins))
    let lijst = [...s.repetitie, ...s.herhalingen, ...s.nieuw]
    if (!lijst.length) continue
    const inT = new Set(s.toetsvorm)
    const toetsI = mengVolgorde(lijst.filter((i) => inT.has(i.id)), `${dag}`)
    const vr = new Set(s.voorrang)
    const rest = lijst.filter((i) => !inT.has(i.id))
    lijst = [...toetsI, ...mengVolgorde(rest.filter((i) => vr.has(i.id)), `${dag}`), ...mengVolgorde(rest.filter((i) => !vr.has(i.id)), `${dag}`)]
    let st = startSessie(`s${dag}`, lijst, pogingen, {}, toetsI.length, { gestart: new Date(t).toISOString(), budgetSec: (s.langer ? Math.min(s.minuten, 15) : minuten) * 60 })
    let n = 0
    while (!isKlaar(st) && n++ < 500) {
      const item = huidigLeeritem(st)
      if (!item) break
      const sterkte = geleerd.get(item.id) ?? 0
      const lengte = item.toegestaneAntwoorden[0].length > 12 ? 3 : 1
      if (raadvraagNodig(st)) {
        const goed = kans() < 0.3
        st = raad(st, goed)
        t += 15000
        st = beantwoord(st, { pogingId: `p${pogingen.length}-${n}`, antwoord: goed ? item.toegestaneAntwoorden[0] : null, tijdstip: new Date(t).toISOString() }).toestand
        t += goed ? 5000 : 60000 // leermoment
      } else {
        const goed = kans() < Math.min(0.9, 0.3 + sterkte * 0.25)
        t += 20000 * lengte
        const uit = beantwoord(st, { pogingId: `p${pogingen.length}-${n}`, antwoord: goed ? item.toegestaneAntwoorden[0] : 'fout', tijdstip: new Date(t).toISOString() })
        st = uit.toestand
        if (!st.afgesloten) { t += 15000; st = beantwoord(st, { pogingId: `q${pogingen.length}-${n}`, antwoord: 'fout', tijdstip: new Date(t).toISOString() }).toestand }
      }
      geleerd.set(item.id, sterkte + 1)
      for (const p of st.pogingen) if (!pogingen.some((q) => q.id === p.id)) pogingen.push(p)
      if (st.toetsUitslagGezien === false || (st.toetsronde && st.huidige + 1 >= st.toetsronde && !st.toetsUitslagGezien)) {}
      const v = volgende(st)
      st = afrondenNodig(v, new Date(t).toISOString(), ins.pauzeGrensSec) ? rondAf(v) : v
      if ((st.toetsronde ?? 0) > 0 && st.huidige >= st.toetsronde! && !st.toetsUitslagGezien) st = { ...st, toetsUitslagGezien: true }
    }
  }
  const nooit = items.filter((i) => !pogingen.some((p) => p.leeritemId === i.id)).map((i) => i.id)
  const laatst = new Map<string, string>()
  for (const p of pogingen) laatst.set(p.leeritemId, kalenderdag(p.tijdstip, 'Europe/Amsterdam'))
  const dagen = new Map<string, Set<string>>()
  for (const p of pogingen) { if (!dagen.has(p.leeritemId)) dagen.set(p.leeritemId, new Set()); dagen.get(p.leeritemId)!.add(kalenderdag(p.tijdstip, 'Europe/Amsterdam')) }
  const grens = telDagenOp(toetsdag, -3)
  const nietRecent = items.filter((i) => !laatst.get(i.id) || laatst.get(i.id)! < grens).length
  const gem = [...dagen.values()].reduce((a, d) => a + d.size, 0) / items.length
  const eenDag = items.filter((i) => (dagen.get(i.id)?.size ?? 0) <= 1).length
  return { nooit, aantalPogingen: pogingen.length, nietRecent, gem: gem.toFixed(1), eenDag }
}

it('elk woord komt vóór de toets langs, ook vlak ervoor en op meer dan één dag', () => {
  for (const r of ['een', 'beide'] as const)
    for (const m of [8, 12])
      for (const z of [1, 2, 3, 4, 5, 6]) {
        const u = simuleer(r, m, z)
        expect(u.nooit, `${r} ${m} min, zaad ${z}`).toEqual([])
        expect(u.nietRecent, `${r} ${m} min, zaad ${z}`).toBe(0)
        expect(u.eenDag, `${r} ${m} min, zaad ${z}`).toBe(0)
      }
})

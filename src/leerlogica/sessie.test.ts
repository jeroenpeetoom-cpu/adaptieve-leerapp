import { describe, expect, it } from 'vitest'
import {
  beantwoord,
  huidigLeeritem,
  isKlaar,
  koppelStrategie,
  mengVolgorde,
  leermomentNodig,
  raad,
  raadvraagNodig,
  kanAntwoordToevoegen,
  nogTeGaan,
  startSessie,
  voegAntwoordToe,
  volgende,
  vraagHulp,
  type Leeritem,
  type Poging,
  type SessieToestand,
} from './index'

const item = (id: string, vraag: string, antwoord: string): Leeritem => ({
  id,
  soort: 'woordpaar',
  bronId: 'b1',
  woordpaarId: `wp-${id}`,
  bronversie: 1,
  oefenrichting: { van: 'en', naar: 'nl' },
  vraag,
  toegestaneAntwoorden: [antwoord],
})

const bridge = item('1', 'bridge', 'brug')
const cloud = item('2', 'cloud', 'wolk')
const t = '2026-10-01T16:00:00.000Z'
let n = 0

/** Een eerdere goede poging, zodat bridge geen nieuw leeritem meer is. */
const eerderGoed: Poging = {
  id: 'eerder',
  sessieId: 's0',
  leeritemId: '1',
  bronversie: 1,
  antwoord: 'brug',
  oordeel: 'goed',
  hulp: 'vrij opgehaald',
  antwoordZelfToegevoegd: false,
  tijdstip: '2026-09-30T16:00:00.000Z',
  regelversie: 1,
}

function antwoord(toestand: SessieToestand, tekst: string | null, pogingId = `p${++n}`) {
  return beantwoord(toestand, { pogingId, antwoord: tekst, tijdstip: t })
}

describe('sessie', () => {
  it('registreert een vrij opgehaald goed antwoord en gaat daarna door', () => {
    const { toestand, poging } = antwoord(startSessie('s1', [bridge, cloud]), 'brug')
    expect(poging).toMatchObject({
      leeritemId: '1',
      oordeel: 'goed',
      hulp: 'vrij opgehaald',
      bronversie: 1,
      tijdstip: t,
      regelversie: 1,
      antwoordZelfToegevoegd: false,
    })
    expect(huidigLeeritem(volgende(toestand))?.id).toBe('2')
  })

  it('geeft bij een bekend leeritem na bijna of fout één nieuwe kans met hulp "met hint"', () => {
    for (const eerste of ['brugg', 'lucht']) {
      const a = antwoord(startSessie('s1', [bridge], [eerderGoed]), eerste)
      expect(a.toestand.afgesloten).toBe(false)
      const b = antwoord(a.toestand, 'brug')
      expect(b.poging).toMatchObject({ oordeel: 'goed', hulp: 'met hint' })
      expect(b.toestand.afgesloten).toBe(true)
    }
  })

  it('sluit het leeritem af na de tweede fout, zodat het voorbeeld volgt', () => {
    const a = antwoord(startSessie('s1', [bridge], [eerderGoed]), 'lucht')
    const b = antwoord(a.toestand, 'fiets')
    expect(b.poging).toMatchObject({ oordeel: 'fout', hulp: 'met hint' })
    expect(b.toestand.afgesloten).toBe(true)
    expect(antwoord(b.toestand, 'brug').poging).toBeNull()
  })

  it('sluit het leeritem meteen af bij niet geweten', () => {
    const { toestand, poging } = antwoord(startSessie('s1', [bridge]), null)
    expect(poging).toMatchObject({ oordeel: 'niet geweten', antwoord: null })
    expect(toestand.afgesloten).toBe(true)
  })

  it('negeert een dubbel verzonden poging', () => {
    const eerste = antwoord(startSessie('s1', [bridge]), 'lucht', 'dubbel')
    const dubbel = antwoord(eerste.toestand, 'lucht', 'dubbel')
    expect(dubbel.poging).toBeNull()
    expect(dubbel.toestand.pogingen).toHaveLength(1)
  })

  it('laat een leeritem dat niet goed ging één keer terugkomen, als meerkeuze', () => {
    let s = startSessie('s1', [bridge, cloud])
    s = volgende(antwoord(s, null).toestand) // bridge niet geweten
    s = volgende(antwoord(s, 'wolk').toestand) // cloud goed
    expect(nogTeGaan(s)).toBe(1)
    expect(huidigLeeritem(s)?.id).toBe('1')
    expect(s.vorm).toBe('meerkeuze')

    const terug = antwoord(s, 'wolk')
    expect(terug.poging).toMatchObject({ leeritemId: '1', hulp: 'herkend', oordeel: 'fout' })
    expect(terug.toestand.afgesloten).toBe(true) // geen tweede kans bij meerkeuze
    expect(isKlaar(volgende(terug.toestand))).toBe(true) // niet nog een keer terug
  })

  it('begint met meerkeuze als de laatste poging van vóór de sessie fout was, en daarna weer typen', () => {
    const eerder: Poging = {
      id: 'oud',
      sessieId: 's0',
      leeritemId: '1',
      bronversie: 1,
      antwoord: 'lucht',
      oordeel: 'fout',
      hulp: 'met hint',
      antwoordZelfToegevoegd: false,
      tijdstip: '2026-09-30T16:00:00.000Z',
      regelversie: 1,
    }
    const s = startSessie('s1', [bridge], [eerder])
    expect(s).toMatchObject({ vorm: 'meerkeuze', hulp: 'herkend' })
    const goed = antwoord(s, 'brug')
    expect(goed.poging).toMatchObject({ oordeel: 'goed', hulp: 'herkend' })
    expect(startSessie('s2', [bridge], [eerder, goed.poging!]).vorm).toBe('typen')
  })

  it('begint met typen bij een nieuw leeritem', () => {
    expect(startSessie('s1', [bridge])).toMatchObject({ vorm: 'typen', hulp: 'vrij opgehaald' })
  })

  it('legt de zwaarste gevraagde hulp vast', () => {
    let s = startSessie('s1', [bridge])
    s = vraagHulp(s, 'met hint')
    expect(antwoord(s, 'brug').poging?.hulp).toBe('met hint')
    s = vraagHulp(vraagHulp(startSessie('s1', [bridge]), 'na voorbeeld'), 'met hint')
    expect(antwoord(s, 'brug').poging?.hulp).toBe('na voorbeeld')
    s = vraagHulp(startSessie('s1', [bridge]), 'herkend')
    expect(s.vorm).toBe('meerkeuze')
    expect(antwoord(s, 'brug').poging?.hulp).toBe('herkend')
  })

  it('geeft na een voorbeeld geen tweede kans bij een fout', () => {
    const s = vraagHulp(startSessie('s1', [bridge]), 'na voorbeeld')
    expect(antwoord(s, 'brg').toestand.afgesloten).toBe(true)
  })

  describe('nieuw leeritem en leermoment', () => {
    it('geeft bij de voorkennischeck geen hint-ronde na een fout, maar een leermoment', () => {
      const { toestand } = antwoord(startSessie('s1', [bridge]), 'lucht')
      expect(toestand.afgesloten).toBe(true)
      expect(leermomentNodig(toestand)).toBe(true)
    })

    it('geeft bij de voorkennischeck wel een nieuwe kans na bijna', () => {
      const brugg = item('9', 'bridge', 'bridge')
      const { toestand } = antwoord(startSessie('s1', [brugg]), 'brigde')
      expect(toestand.afgesloten).toBe(false)
      const tweede = antwoord(toestand, 'fiets')
      expect(leermomentNodig(tweede.toestand)).toBe(true)
    })

    it('geeft een leermoment bij niet geweten, maar niet bij goed', () => {
      expect(leermomentNodig(antwoord(startSessie('s1', [bridge]), null).toestand)).toBe(true)
      expect(leermomentNodig(antwoord(startSessie('s1', [bridge]), 'brug').toestand)).toBe(false)
    })

    it('geeft geen leermoment bij een leeritem dat al eerder geoefend is', () => {
      expect(leermomentNodig(antwoord(startSessie('s1', [bridge], [eerderGoed]), null).toestand)).toBe(false)
    })

    it('geeft geen tweede leermoment als het leeritem aan het eind terugkomt', () => {
      let s = startSessie('s1', [bridge])
      s = volgende(antwoord(s, null).toestand)
      expect(huidigLeeritem(s)?.id).toBe('1')
      expect(leermomentNodig(antwoord(s, 'fiets').toestand)).toBe(false)
    })

    it('legt de strategie vast bij elke poging', () => {
      let s = startSessie('s1', [bridge, cloud], [], { '2': 'beelden koppelen' })
      s = volgende(antwoord(s, null).toestand)
      s = koppelStrategie(s, '1', 'beelden koppelen')
      const wolk = antwoord(s, 'wolk')
      expect(wolk.poging?.strategie).toBe('beelden koppelen')
      expect(antwoord(startSessie('s2', [bridge]), 'brug').poging?.strategie).toBeNull()
    })
  })

  it('laat een leeritem dat niet goed ging een paar vragen later terugkomen, niet meteen', () => {
    const zes = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => item(id, id, `${id}${id}`))
    let s = startSessie('s', zes)
    s = volgende(antwoord(s, null).toestand) // a niet geweten
    expect(s.leeritems.map((i) => i.id)).toEqual(['a', 'b', 'c', 'd', 'a', 'e', 'f'])
  })

  it('zet een teruggezet leeritem nooit vlak naast de andere richting van hetzelfde woord', () => {
    const heen = (id: string) => ({ ...item(`${id}-heen`, id, `${id}${id}`), woordpaarId: id })
    const terug = (id: string) => ({ ...item(`${id}-terug`, id, `${id}${id}`), woordpaarId: id })
    // a-heen gaat fout; op de gewone terugplek zou hij naast a-terug staan.
    let s = startSessie('s', [heen('a'), heen('b'), heen('c'), terug('a'), heen('d'), heen('e')])
    s = volgende(antwoord(s, null).toestand)
    const ids = s.leeritems.map((i) => i.woordpaarId)
    for (let i = 0; i < ids.length - 1; i++) expect(ids[i] === 'a' && ids[i + 1] === 'a').toBe(false)
  })

  it('zet aan het eind terug als er weinig over is', () => {
    let s = startSessie('s', [bridge, cloud])
    s = volgende(antwoord(s, null).toestand)
    expect(s.leeritems.map((i) => i.id)).toEqual(['1', '2', '1'])
  })

  describe('mijn antwoord was ook goed', () => {
    it('voegt het antwoord toe en markeert de poging, zonder vrij opgehaald te tellen', () => {
      const river = item('3', 'river', 'rivier')
      const fout = antwoord(startSessie('s1', [river]), 'stroom', 'p-stroom')
      expect(kanAntwoordToevoegen(fout.toestand)).toBe(true)
      const { toestand, poging } = voegAntwoordToe(fout.toestand)
      expect(poging).toMatchObject({ id: 'p-stroom', oordeel: 'goed', hulp: 'vrij opgehaald', antwoordZelfToegevoegd: true })
      expect(toestand.pogingen).toHaveLength(1)
      expect(toestand.leeritems[0].toegestaneAntwoorden).toEqual(['rivier', 'stroom'])
      expect(toestand.afgesloten).toBe(true)
      expect(isKlaar(volgende(toestand))).toBe(true) // komt niet terug in deze sessie
    })

    it('kan niet bij niet geweten, meerkeuze of een goed antwoord', () => {
      expect(kanAntwoordToevoegen(antwoord(startSessie('s1', [bridge]), null).toestand)).toBe(false)
      expect(kanAntwoordToevoegen(antwoord(startSessie('s1', [bridge]), 'brug').toestand)).toBe(false)
      const mk = vraagHulp(startSessie('s1', [bridge, cloud]), 'herkend')
      expect(kanAntwoordToevoegen(antwoord(mk, 'wolk').toestand)).toBe(false)
    })
  })
})

describe('volgorde van een sessie', () => {
  // Tien plekken, elk met aanwijzen en benoemen, in de volgorde van de plekken.
  const items = Array.from({ length: 10 }, (_, i) => [`p${i}-aanwijzen`, `p${i}-benoemen`].map((id) => ({ id, woordpaarId: `p${i}` }))).flat()

  it('mengt willekeurig, maar vast per zaad', () => {
    const a = mengVolgorde(items, 'sessie-1')
    expect(a.map((i) => i.id).sort()).toEqual(items.map((i) => i.id).sort())
    expect(a).toEqual(mengVolgorde(items, 'sessie-1'))
    expect(a.map((i) => i.id)).not.toEqual(items.map((i) => i.id))
    expect(mengVolgorde(items, 'sessie-2').map((i) => i.id)).not.toEqual(a.map((i) => i.id))
  })

  it('zet twee richtingen van dezelfde plek nooit vlak na elkaar', () => {
    for (const zaad of ['a', 'b', 'c', 'd', 'e']) {
      const volgorde = mengVolgorde(items, zaad).map((i) => i.woordpaarId)
      for (let i = 0; i < volgorde.length; i++) {
        expect(volgorde.slice(i + 1, i + 3)).not.toContain(volgorde[i])
      }
    }
  })

  it('doet het zo goed als het kan als er te weinig verschillende items zijn', () => {
    const twee = [{ id: 'a1', woordpaarId: 'a' }, { id: 'a2', woordpaarId: 'a' }]
    expect(mengVolgorde(twee, 'z')).toHaveLength(2)
  })
})

describe('raadvraag bij een nieuw leeritem', () => {
  const nieuwItem = (id: string): Leeritem => ({
    id,
    soort: 'woordpaar',
    bronId: 'b',
    woordpaarId: `wp-${id}`,
    bronversie: 1,
    oefenrichting: { van: 'en', naar: 'nl' },
    vraag: id,
    toegestaneAntwoorden: [`${id}-nl`],
  })
  const T = '2026-10-01T10:00:00.000Z'

  it('begint een nieuw leeritem met een raadvraag', () => {
    expect(raadvraagNodig(startSessie('s', [nieuwItem('a')]))).toBe(true)
  })

  it('stelt geen raadvraag bij een leeritem dat al eerder geoefend is', () => {
    const eerder: Poging = { id: 'p0', sessieId: 'oud', leeritemId: 'a', bronversie: 1, antwoord: 'x', oordeel: 'fout', hulp: 'vrij opgehaald', antwoordZelfToegevoegd: false, tijdstip: T, regelversie: 1 }
    expect(raadvraagNodig(startSessie('s', [nieuwItem('a')], [eerder]))).toBe(false)
  })

  it('stelt geen raadvraag bij aanwijzen: de eerste tik is de gok', () => {
    const plek: Leeritem = { ...nieuwItem('a'), soort: 'plek', plek: { kaartId: 'k', x: 0, y: 0, soort: 'stad', richting: 'aanwijzen' } }
    expect(raadvraagNodig(startSessie('s', [plek]))).toBe(false)
  })

  it('goed gegokt: geen poging, daarna de typvraag die gewoon telt', () => {
    const t = raad(startSessie('s', [nieuwItem('a')]), true)
    expect(t.pogingen).toEqual([])
    expect(raadvraagNodig(t)).toBe(false)
    const { toestand, poging } = beantwoord(t, { pogingId: 'p1', antwoord: 'a-nl', tijdstip: T })
    expect(poging).toMatchObject({ oordeel: 'goed', hulp: 'vrij opgehaald' })
    expect(leermomentNodig(toestand)).toBe(false)
  })

  it('fout gegokt: niet geweten, en dan het leermoment', () => {
    const t = raad(startSessie('s', [nieuwItem('a')]), false)
    const { toestand, poging } = beantwoord(t, { pogingId: 'p1', antwoord: null, tijdstip: T })
    expect(poging).toMatchObject({ oordeel: 'niet geweten', antwoord: null })
    expect(leermomentNodig(toestand)).toBe(true)
  })
})

import type { Minivraag } from '../schermen/Uitlegstap'

// De gereedschapskist (spec leren-leren, S2): per aanpak wat hij doet, wanneer hij past, welke stappen je
// zet en hoe je controleert of hij geholpen heeft. Ophalen en gespreid herhalen doet de app al bij elke
// vraag; de leerling leert ze hier ook als eigen gereedschap kennen.

export type Gereedschap = 'ophalen' | 'herhalen' | 'beelden koppelen' | 'geheugenroute' | 'schema'

export interface Strategiekaart {
  emoji: string
  naam: string
  wat: string
  wanneer: string
  stappen: string[]
  controle: string
  /** Kort hardop voordoen waarom deze aanpak past. */
  hardop: string
  /** Mini-vragen bij het voordoen: wanneer past hij, en hoe controleer je het. */
  hardopVraag?: Minivraag
  controleVraag?: Minivraag
}

export const STRATEGIEKAARTEN: Record<Gereedschap, Strategiekaart> = {
  ophalen: {
    emoji: '🧠',
    naam: 'Zelf ophalen',
    wat: 'Je haalt het antwoord uit je eigen hoofd voordat je kijkt.',
    wanneer: 'Bij alles wat je moet kennen: woorden, plaatsen, feiten.',
    stappen: ['Kijk niet naar het antwoord.', 'Zeg of schrijf wat je nog weet, ook als je twijfelt.', 'Kijk dan pas en verbeter wat fout was.'],
    controle: 'Weet je het een paar dagen later nog zonder te kijken? Dan zit het erin.',
    hardop: 'Ik moet dit straks zonder boek weten, dus ik oefen nu al zonder te kijken.',
  },
  herhalen: {
    emoji: '📅',
    naam: 'Gespreid herhalen',
    wat: 'Je oefent op verschillende dagen een beetje, in plaats van één keer heel lang.',
    wanneer: 'Als je iets langer moet onthouden, zoals voor een toets over een week of twee.',
    stappen: ['Begin op tijd, niet pas de dag voor de toets.', 'Oefen elke dag kort.', 'Wat je goed weet komt minder vaak terug, wat lastig is vaker.'],
    controle: 'Weet je het na een paar dagen pauze nog? Dan werkt het.',
    hardop: 'De toets is pas over een tijdje, dus ik verdeel het oefenen over de dagen.',
  },
  'beelden koppelen': {
    emoji: '🖼️',
    naam: 'Beelden koppelen',
    wat: 'Je bedenkt een gek plaatje dat het woord aan de betekenis koppelt.',
    wanneer: 'Bij lastige woorden of namen die je steeds vergeet.',
    stappen: ['Zoek iets in het woord dat ergens op lijkt.', 'Maak er een gek plaatje van, met de betekenis erin.', 'Test jezelf daarna zonder aan het plaatje te denken.'],
    controle: 'Weet je het woord ook **zonder het plaatje**? Dan heb je het echt geleerd.',
    hardop: 'Dit zijn losse woorden die ik **steeds vergeet**, dus ik maak er een gek plaatje bij. Daarna test ik mezelf zonder plaatje.',
    hardopVraag: {
      vraag: 'Wanneer maak je een beeld?',
      opties: [
        { tekst: 'Bij elk woord, ook de makkelijke', goed: false },
        { tekst: 'Bij woorden die je steeds vergeet', goed: true },
        { tekst: 'Alleen bij lange woorden', goed: false },
      ],
      hint: 'Kijk naar het gemarkeerde stukje.',
    },
    controleVraag: {
      vraag: 'Wanneer weet je dat het werkt?',
      opties: [
        { tekst: 'Als het plaatje grappig is', goed: false },
        { tekst: 'Als je het één keer goed had', goed: false },
        { tekst: 'Als je het woord ook zonder plaatje weet', goed: true },
      ],
      hint: 'Kijk naar het gemarkeerde stukje.',
    },
  },
  geheugenroute: {
    emoji: '🗺️',
    naam: 'Geheugenroute',
    wat: 'Je legt dingen in gedachten op plekken die je goed kent, in een vaste volgorde.',
    wanneer: 'Bij een rijtje dat je in volgorde moet kennen, of veel woorden tegelijk.',
    stappen: ['Kies een paar plekken in je huis, in een vaste volgorde.', 'Leg op elke plek één woord, met een gek beeld.', 'Loop in gedachten je route langs en noem de woorden.'],
    controle: 'Kun je de woorden ook noemen **zonder de route** te lopen? Dan zitten ze erin.',
    hardop: 'Ik moet een heel **rijtje** onthouden, dus ik maak een route. Daarna test ik mezelf zonder te kijken.',
    hardopVraag: {
      vraag: 'Wanneer is een route handig?',
      opties: [
        { tekst: 'Bij een rijtje of veel woorden tegelijk', goed: true },
        { tekst: 'Bij één heel makkelijk woord', goed: false },
        { tekst: 'Alleen bij rekenen', goed: false },
      ],
      hint: 'Kijk naar het gemarkeerde woord.',
    },
    controleVraag: {
      vraag: 'Wanneer zitten de woorden erin?',
      opties: [
        { tekst: 'Als je de route mooi vindt', goed: false },
        { tekst: 'Als je de woorden ook zonder route kunt noemen', goed: true },
        { tekst: 'Als je veel plekken hebt', goed: false },
      ],
      hint: 'Kijk naar het gemarkeerde stukje.',
    },
  },
  schema: {
    emoji: '📐',
    naam: 'Schema met beslisvragen',
    wat: 'Je zet begrippen die op elkaar lijken in een schema, en kiest met een paar vaste vragen welk begrip past.',
    wanneer: 'Bij een regel met begrippen die je door elkaar haalt, zoals can en have to.',
    stappen: ['Zet de begrippen in een schema met wat ze betekenen.', 'Bedenk een paar vragen die het verschil maken.', 'Stel bij elke nieuwe zin die vragen, en kies dan.'],
    controle: 'Kies je ook in een zin die je nog nooit zag het goede begrip, zonder de vragen? Dan snap je de regel.',
    hardop: 'Deze woorden lijken op elkaar en ik haal ze door elkaar, dus ik maak een schema en stel mezelf steeds dezelfde vragen.',
  },
}

export const GEREEDSCHAP: Gereedschap[] = ['ophalen', 'herhalen', 'beelden koppelen', 'geheugenroute', 'schema']

/** Eén strategiekaart, in te klappen. */
export function StrategieKaart({ id, status, open = false }: { id: Gereedschap; status?: string; open?: boolean }) {
  const k = STRATEGIEKAARTEN[id]
  return (
    <details className="strategiekaart" open={open}>
      <summary>
        <strong>
          {k.emoji} {k.naam}
        </strong>
        <span className="gedempt"> · {k.wanneer}</span>
      </summary>
      <p>{k.wat}</p>
      <ol>
        {k.stappen.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <p>
        <strong>Werkt het?</strong> {k.controle.replaceAll('**', '')}
      </p>
      {status && <p className="gedempt">{status}</p>}
    </details>
  )
}

/** Een reden om een aanpak te kiezen. `soort` zegt of de reden past bij waar de aanpak voor bedoeld is (S3). */
export interface Keuzereden {
  id: string
  tekst: string
  soort: 'past' | 'ervaring' | 'proberen' | 'past-minder'
}

export const KEUZEREDENEN: Record<'beelden koppelen' | 'geheugenroute' | 'geen', Keuzereden[]> = {
  'beelden koppelen': [
    { id: 'lastig', tekst: 'het zijn losse woorden die ik lastig vind', soort: 'past' },
    { id: 'werkte', tekst: 'het werkte de vorige keer goed', soort: 'ervaring' },
    { id: 'proberen', tekst: 'ik wil het eens proberen', soort: 'proberen' },
  ],
  geheugenroute: [
    { id: 'rijtje', tekst: 'ik moet een rijtje in volgorde kennen', soort: 'past' },
    { id: 'veel', tekst: 'het zijn veel woorden tegelijk', soort: 'past' },
    { id: 'werkte', tekst: 'het werkte de vorige keer goed', soort: 'ervaring' },
    { id: 'proberen', tekst: 'ik wil het eens proberen', soort: 'proberen' },
  ],
  geen: [
    { id: 'makkelijk', tekst: 'de woorden zijn makkelijk', soort: 'past' },
    { id: 'eerst-zien', tekst: 'ik wil eerst zien wat ik al weet', soort: 'past' },
    { id: 'geen-zin', tekst: 'ik heb geen zin in een extra stap', soort: 'past-minder' },
  ],
}

/** Korte reactie op de reden, die het kind leert kijken of een aanpak bij het doel past. */
export function reactieOpReden(reden: Keuzereden): string {
  switch (reden.soort) {
    case 'past':
      return 'Goede reden: dat is precies waar deze aanpak bij past.'
    case 'ervaring':
      return 'Slim: je kijkt naar wat bij jou werkt. Straks zie je of het deze keer weer helpt.'
    case 'proberen':
      return 'Prima om uit te proberen. Later zie je in Inzichten of het hielp.'
    case 'past-minder':
      return 'Eerlijk! Let straks wel op welke woorden lastig blijven. Bij die woorden kan een beeld alsnog helpen.'
  }
}

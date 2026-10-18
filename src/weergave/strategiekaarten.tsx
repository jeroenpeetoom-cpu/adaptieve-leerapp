// De gereedschapskist (spec leren-leren, S2): per aanpak wat hij doet, wanneer hij past, welke stappen je
// zet en hoe je controleert of hij geholpen heeft. Ophalen en gespreid herhalen doet de app al bij elke
// vraag; de leerling leert ze hier ook als eigen gereedschap kennen.

export type Gereedschap = 'ophalen' | 'herhalen' | 'beelden koppelen' | 'geheugenroute'

export interface Strategiekaart {
  emoji: string
  naam: string
  wat: string
  wanneer: string
  stappen: string[]
  controle: string
  /** Kort hardop voordoen waarom deze aanpak past. */
  hardop: string
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
    controle: 'Weet je het woord ook zonder het plaatje? Dan heb je het echt geleerd.',
    hardop: 'Dit zijn losse woorden die ik steeds vergeet, dus ik maak er een gek plaatje bij. Daarna test ik mezelf zonder plaatje.',
  },
  geheugenroute: {
    emoji: '🗺️',
    naam: 'Geheugenroute',
    wat: 'Je legt dingen in gedachten op plekken die je goed kent, in een vaste volgorde.',
    wanneer: 'Bij een rijtje dat je in volgorde moet kennen, of veel woorden tegelijk.',
    stappen: ['Kies een paar plekken in je huis, in een vaste volgorde.', 'Leg op elke plek één woord, met een gek beeld.', 'Loop in gedachten je route langs en noem de woorden.'],
    controle: 'Kun je de woorden ook noemen zonder de route te lopen? Dan zitten ze erin.',
    hardop: 'Ik moet een heel rijtje onthouden, dus ik maak een route. Daarna test ik mezelf zonder te kijken.',
  },
}

export const GEREEDSCHAP: Gereedschap[] = ['ophalen', 'herhalen', 'beelden koppelen', 'geheugenroute']

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
        <strong>Werkt het?</strong> {k.controle}
      </p>
      {status && <p className="gedempt">{status}</p>}
    </details>
  )
}

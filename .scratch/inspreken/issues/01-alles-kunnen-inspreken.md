# 01: Alles kunnen inspreken, ook antwoorden

**What to build:** De leerling kan niet alleen zijn geheugenbeeld, maar ook zijn antwoorden inspreken in plaats van typen, zodat oefenen sneller gaat.

**Blocked by:** de eerste versie (woordenschat), `.scratch/eerste-versie/`

**Status:** ready-for-agent (gebouwd; wacht op controle op de S22)

Nu werkt inspreken via de microfoon van het toetsenbord in elk tekstvak; bij het geheugenbeeld staat daar een tip voor. Eerst een korte grill-sessie. Open vragen daarin zijn onder meer:
- Spraakherkenning verbetert spelling vanzelf ("brigde" wordt "bridge"). Geldt inspreken daarom alleen voor de richting waarin spelling niet het doel is, zoals Engels → Nederlands?
- Wanneer telt een ingesproken antwoord als vrij opgehaald, en wat gebeurt er als de herkenning een goed antwoord verkeerd verstaat? Een onterechte fout mag niet als leerfout tellen.
- Privacy: de spraakherkenning van de browser stuurt geluid naar een externe dienst, en het bouwdocument zegt "verzamel geen stemopnames". Kan het op het apparaat zelf, of blijft het bij de toetsenbordmicrofoon?
- Brave schakelt spraakherkenning in websites uit. Moet de app dan in Chrome draaien?
- Kan inspreken ook de uitspraak oefenen (Nederlands → Engels)?

- [x] Grill-sessie gehouden en besluiten vastgelegd
- [x] Besluiten verwerkt in dit ticket (geen aparte specificatie nodig)

## Besluiten

- **Techniek (vraag 37, bevestigd):** inspreken gaat via de microfoon van het toetsenbord, voor antwoorden en voor geheugenbeelden. Een website kan die microfoon niet zelf openen, maar de app selecteert het antwoordveld zodat het toetsenbord openstaat, en controleert een ingesproken antwoord vanzelf: een woord dat in één keer in het veld verschijnt (en niet letter voor letter) wordt direct gecontroleerd. Afgewezen: een eigen microfoonknop met de spraakherkenning van de browser (werkt niet in Brave, geluid gaat meestal naar Google) en spraakherkenning in de app zelf (grote download, onzeker bij losse woorden en kinderstemmen; eventueel later eerst testen).
- **Wanneer roepen mag (vraag 38, bevestigd): opbouw per woord.** Naar het Nederlands mag roepen altijd. Naar het Engels mag roepen zolang het leeritem *nog aan het leren* is; is het *zelf teruggehaald*, dan is de poging die meetelt voor de herhaalplanning (de eerste van de dag) een typvraag, en mogen extra pogingen weer geroepen worden. *Later nog geweten* haalt een woord naar het Engels dus alleen als het ook goed geschreven kan worden. Een ingesproken antwoord telt als vrij opgehaald. Bij een typvraag waarin een ingesproken antwoord binnenkomt, vraagt de app om te typen en maakt het veld leeg. De vraag toont steeds "🎤 Zeg of typ het" of "✍️ Typ het".

## Gebouwd

- [x] Bij elke typvraag staat "🎤 Zeg of typ het" of "✍️ Typ het, letter voor letter", volgens de opbouw per woord
- [x] Een woord dat in één keer binnenkomt, geldt als ingesproken; bij een zeg-vraag wordt het na 0,7 seconde stilte vanzelf gecontroleerd
- [x] Bij een typvraag wordt een ingesproken antwoord geweigerd met de vraag om te typen
- [x] Elke poging legt vast of hij ingesproken is
- [x] Leerlogicatests dekken de opbouw per woord

Bekend: het aantikken van een woordvoorstel van het toetsenbord komt ook in één keer binnen en telt dus als ingesproken. In het antwoordveld staan voorstellen zoveel mogelijk uit.

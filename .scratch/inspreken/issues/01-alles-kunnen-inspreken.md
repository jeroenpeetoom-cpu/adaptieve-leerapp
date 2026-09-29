# 01: Alles kunnen inspreken, ook antwoorden

**What to build:** De leerling kan niet alleen zijn geheugenbeeld, maar ook zijn antwoorden inspreken in plaats van typen, zodat oefenen sneller gaat.

**Blocked by:** de eerste versie (woordenschat), `.scratch/eerste-versie/`

**Status:** needs-triage (grill-sessie bezig)

Nu werkt inspreken via de microfoon van het toetsenbord in elk tekstvak; bij het geheugenbeeld staat daar een tip voor. Eerst een korte grill-sessie. Open vragen daarin zijn onder meer:
- Spraakherkenning verbetert spelling vanzelf ("brigde" wordt "bridge"). Geldt inspreken daarom alleen voor de richting waarin spelling niet het doel is, zoals Engels → Nederlands?
- Wanneer telt een ingesproken antwoord als vrij opgehaald, en wat gebeurt er als de herkenning een goed antwoord verkeerd verstaat? Een onterechte fout mag niet als leerfout tellen.
- Privacy: de spraakherkenning van de browser stuurt geluid naar een externe dienst, en het bouwdocument zegt "verzamel geen stemopnames". Kan het op het apparaat zelf, of blijft het bij de toetsenbordmicrofoon?
- Brave schakelt spraakherkenning in websites uit. Moet de app dan in Chrome draaien?
- Kan inspreken ook de uitspraak oefenen (Nederlands → Engels)?

- [ ] Grill-sessie gehouden en besluiten vastgelegd
- [ ] Specificatie en tickets gemaakt

## Besluiten

- **Techniek (vraag 37, bevestigd):** inspreken gaat via de microfoon van het toetsenbord, voor antwoorden en voor geheugenbeelden. Een website kan die microfoon niet zelf openen, maar de app selecteert het antwoordveld zodat het toetsenbord openstaat, en controleert een ingesproken antwoord vanzelf: een woord dat in één keer in het veld verschijnt (en niet letter voor letter) wordt direct gecontroleerd. Afgewezen: een eigen microfoonknop met de spraakherkenning van de browser (werkt niet in Brave, geluid gaat meestal naar Google) en spraakherkenning in de app zelf (grote download, onzeker bij losse woorden en kinderstemmen; eventueel later eerst testen).

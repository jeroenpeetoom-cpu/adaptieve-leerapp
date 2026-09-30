# 01: Topografie als tweede soort leeritem uitwerken

**What to build:** De leerling kan ook topografie oefenen. Hij fotografeert een blinde kaart met genummerde stippen, zet één keer bij elke stip de naam, en oefent daarna in twee richtingen: de naam ophalen bij een aangewezen stip, en de plek aanwijzen bij een gegeven naam. Herhaalplanning, voortgangsstatus, hulp en oordeel werken hetzelfde als bij woordenschat.

**Blocked by:** de eerste versie (woordenschat), `.scratch/eerste-versie/`

**Status:** needs-triage (grill-sessie bezig)

Eerst een korte grill-sessie. Open vragen daarin zijn onder meer:
- hoe dicht bij de stip een tik als goed telt;
- wat de leerling doet met een kaart zonder nummers;
- hoe de kaart bewaard wordt, want foto's worden na het bevestigen verwijderd (zie de specificatie);
- welke nieuwe begrippen in `CONTEXT.md` komen, zoals kaart en plek.

Daarna volgen een specificatie en tickets.

- [ ] Grill-sessie gehouden en besluiten vastgelegd
- [ ] Specificatie en tickets gemaakt

## Analyse van echt huiswerk (Noordhoff, "België en Luxemburg", 2 pagina's)

- Het werkblad heeft een vak "Wat moet je leren?" met 14 plekken: landen (België, Luxemburg), steden (Luik, Antwerpen, Brussel, Gent, Luxemburg), wateren (Noordzee, Rijn, Schelde, Maas) en gebieden (Ardennen, Vlaanderen, Wallonië). Andere opdrachten noemen extra steden (Amsterdam, Rotterdam, Maastricht; Brugge, Charleroi, Namen, Oostende, Leuven, Bergen, Hasselt, Mechelen, Bastogne) en feiten (aan welk water, wat ligt ertussen, Vlaams of Waals, grenzen, kenmerken).
- De kaart heeft stipjes voor steden en is door de leerling ingevuld met afkortingen (de vetgedrukte eerste letters). Afkortingen zijn niet uniek: "Lu" is Luik en Luxemburg, "Ma" is Maastricht en Maas.
- Drie soorten plekken: punten (steden), lijnen (rivieren) en vlakken (landen, gebieden, zee).
- Test met Tesseract (losse tekst) op een foto van de ingevulde kaart: ongeveer 17 van de 24 afkortingen gevonden met hun positie. Gemist: schuine letters (Wa, Ar, Ri), handschrift (Brugge, Brussel) en enkele kleine labels (An met lage zekerheid, Ha als "fia", Lux, Lu van Luxemburg).

## Besluiten

- **Oefenkaart (vraag 40, bevestigd): de foto van de ingevulde kaart.** De app zoekt de afkortingen en hun plek, koppelt ze met de lijst van het werkblad aan namen, laat de leerling (bij voorkeur met een ouder) de plekken controleren en ontbrekende aantikken, en dekt daarna de afkortingen af zodat een blinde kaart met stipjes overblijft. Een lege kaart kan ook: dan worden alle plekken aangetikt. Afgewezen voor nu: een eigen kaart uit open kaartgegevens (Natural Earth), als reserve als deze aanpak in de praktijk tegenvalt.

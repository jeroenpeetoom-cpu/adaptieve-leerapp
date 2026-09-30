# 01: Topografie als tweede soort leeritem uitwerken

**What to build:** De leerling kan ook topografie oefenen. Hij fotografeert een blinde kaart met genummerde stippen, zet één keer bij elke stip de naam, en oefent daarna in twee richtingen: de naam ophalen bij een aangewezen stip, en de plek aanwijzen bij een gegeven naam. Herhaalplanning, voortgangsstatus, hulp en oordeel werken hetzelfde als bij woordenschat.

**Blocked by:** de eerste versie (woordenschat), `.scratch/eerste-versie/`

**Status:** done

Eerst een korte grill-sessie. Open vragen daarin zijn onder meer:
- hoe dicht bij de stip een tik als goed telt;
- wat de leerling doet met een kaart zonder nummers;
- hoe de kaart bewaard wordt, want foto's worden na het bevestigen verwijderd (zie de specificatie);
- welke nieuwe begrippen in `CONTEXT.md` komen, zoals kaart en plek.

Daarna volgen een specificatie en tickets.

- [x] Grill-sessie gehouden en besluiten vastgelegd
- [x] Tickets gemaakt: `.scratch/eerste-versie/issues/15-tijdsbudget-toetsplanning.md` en `.scratch/topografie/issues/02` t/m `05`

## Analyse van echt huiswerk (Noordhoff, "België en Luxemburg", 2 pagina's)

- Het werkblad heeft een vak "Wat moet je leren?" met 14 plekken: landen (België, Luxemburg), steden (Luik, Antwerpen, Brussel, Gent, Luxemburg), wateren (Noordzee, Rijn, Schelde, Maas) en gebieden (Ardennen, Vlaanderen, Wallonië). Andere opdrachten noemen extra steden (Amsterdam, Rotterdam, Maastricht; Brugge, Charleroi, Namen, Oostende, Leuven, Bergen, Hasselt, Mechelen, Bastogne) en feiten (aan welk water, wat ligt ertussen, Vlaams of Waals, grenzen, kenmerken).
- De kaart heeft stipjes voor steden en is door de leerling ingevuld met afkortingen (de vetgedrukte eerste letters). Afkortingen zijn niet uniek: "Lu" is Luik en Luxemburg, "Ma" is Maastricht en Maas.
- Drie soorten plekken: punten (steden), lijnen (rivieren) en vlakken (landen, gebieden, zee).
- Test met Tesseract (losse tekst) op een foto van de ingevulde kaart: ongeveer 17 van de 24 afkortingen gevonden met hun positie. Gemist: schuine letters (Wa, Ar, Ri), handschrift (Brugge, Brussel) en enkele kleine labels (An met lage zekerheid, Ha als "fia", Lux, Lu van Luxemburg).

## Besluiten

- **Oefenkaart (vraag 40, bevestigd): de foto van de ingevulde kaart.** De app zoekt de afkortingen en hun plek, koppelt ze met de lijst van het werkblad aan namen, laat de leerling (bij voorkeur met een ouder) de plekken controleren en ontbrekende aantikken, en dekt daarna de afkortingen af zodat een blinde kaart met stipjes overblijft. Een lege kaart kan ook: dan worden alle plekken aangetikt. Afgewezen voor nu: een eigen kaart uit open kaartgegevens (Natural Earth), als reserve als deze aanpak in de praktijk tegenvalt.
- **Wat oefenen per plek (vraag 41, bevestigd):** twee richtingen, elk een eigen leeritem met eigen voortgang: "Waar ligt …?" (de leerling tikt op de kaart) en "Wat ligt hier?" (de app laat een plek oplichten, de leerling zegt of typt de naam, met meerkeuze als opstap). Per hoofdstuk te kiezen, net als de oefenrichting bij woordenlijsten; standaard allebei.
- **Planning voor een toets (vraag 42, bevestigd, geldt ook voor woordenlijsten):** zie de specificatie van de eerste versie, onder sessiesamenstelling.
- **Welke plekken (vraag 44, bevestigd):** alle plekken op de kaart, ook de extra plaatsen uit de opdrachten, niet alleen het vak "Wat moet je leren?". Bij dit hoofdstuk 26 plekken (52 leeritems met beide richtingen).
- **Volgorde (vraag 45, bevestigd):** eerst de toetsstof uit "Wat moet je leren?", daarna de extra plekken; bij herhalingen en de generale repetitie heeft de toetsstof voorrang. Binnen de toetsstof de grote dingen eerst: landen en zee, dan gebieden, rivieren en steden.
- **Wanneer een tik goed is (vraag 46, bevestigd):** per soort een andere afstand: een kleine cirkel rond het stipje bij een stad, een grote cirkel rond de plek van de afkorting bij water, gebied of land. Net buiten de cirkel (binnen twee keer de afstand) is *bijna*: "Bijna! Iets meer naar het oosten", met één nieuwe kans met hulp *met hint*. Na het antwoord licht de goede plek altijd op. Extra punten langs rivieren of in gebieden kunnen later, als de benadering onterecht fouten geeft.
- **Leermoment en strategie (vraag 47, bevestigd):** een nieuwe plek licht op de kaart op met de naam, met een geheugenbeeld voor de naam (beelden koppelen of zonder; geen geheugenroute bij topo), en met ankers: de app noemt de windrichting ten opzichte van plekken die de leerling al kent ("Antwerpen ligt ten noorden van Brussel") en gebruikt die ook als hint. De windrichting wordt berekend uit de posities op de kaart.
- **Begrippen (vraag 48, bevestigd):** Kaart, Plek (soort stad, water, gebied of land), Anker, en de oefenrichtingen aanwijzen en benoemen; zie `CONTEXT.md`.
- **Later:** feiten en relaties (aan welk water, wat ligt ertussen, Vlaams of Waals, grenzen, kenmerken).

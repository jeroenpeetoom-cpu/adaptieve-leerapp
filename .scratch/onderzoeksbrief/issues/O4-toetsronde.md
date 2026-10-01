# O4: Toetsronde in schoolvorm

**What to build:** Een oefenronde die lijkt op de toets op school: woorden in beide richtingen door elkaar en zonder hulpknoppen, met de feedback pas aan het eind; plekken op de lege kaart, of op de kaart met alle tekst afgedekt. Goed in toetsvorm geldt als apart bewijs. Zie beslissing 4.

**Blocked by:** O1

**Status:** ready-for-agent (gebouwd; wacht op controle op de S22)

- [x] De generale repetitie (2 dagen voor de toets) is een toetsronde
- [x] Af en toe krijgt een item dat later nog geweten is een vraag in toetsvorm
- [x] In toetsvorm: geen hint, geen meerkeuze, geen voorbeeld; feedback en uitslag pas aan het eind van de ronde
- [x] Topo in toetsvorm gebruikt de lege kaart als die er is, anders de kaart met alle tekst afgedekt
- [x] De poging wordt vastgelegd als toetsvorm; "in toetsvorm geweten" is zichtbaar in de voortgang, los van de voortgangsstatus
- [x] Leerlogicatests dekken wanneer een toetsvraag komt en hoe hij telt

Uitwerking:
- De toetsronde staat aan het begin van de sessie; de rest volgt daarna, elk deel door elkaar.
- "Af en toe": een herhaling die al later nog geweten is komt in toetsvorm als de vorige poging niet in toetsvorm was, zodat het afwisselt.
- Een toetspoging telt gewoon voor herhaalplanning en voortgang: goed zonder hulp is het sterkste bewijs, een fout zet het leeritem terug.
- Wat in de toetsronde niet goed ging, komt na de uitslag terug in het gewone deel (eerst als meerkeuze, zoals altijd na een fout).
- De kaart bij aanwijzen is al de lege of blinde kaart; in toetsvorm vallen hulp en de letterkeuze weg.
- Inzichten toont per bron "In toetsvorm geweten: x van de y".

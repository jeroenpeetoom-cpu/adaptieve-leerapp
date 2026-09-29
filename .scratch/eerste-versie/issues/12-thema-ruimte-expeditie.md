# 12: Thema ruimte-expeditie

**What to build:** De ophaalmissie krijgt de aankleding van een ruimte-expeditie. Een ruimteschip heeft codewoorden nodig om naar de volgende planeet te springen, en elk vrij opgehaald woord is een stap op de sterrenkaart.

**Blocked by:** 02

**Status:** ready-for-agent (gebouwd; wacht op controle op de S22)

- [x] Het thema is een los onderdeel van de weergave; de leerlogica weet niets van het thema
- [x] Een animatie volgt pas na de poging en verraadt het antwoord niet
- [x] Er zijn geen levens, geen aftellende klok en geen verlies bij een fout
- [x] De systeeminstelling "minder beweging" zet animaties uit
- [x] Alle informatie blijft te begrijpen zonder animatie en zonder kleur

Uitwerking: het schip vliegt bij elk afgerond woord verder, ook na een fout (er is nooit verlies). Een vrij opgehaald goed antwoord levert een codewoord op, met een korte sprong van het schip na het antwoord. Het thema staat in een eigen module in de weergave.

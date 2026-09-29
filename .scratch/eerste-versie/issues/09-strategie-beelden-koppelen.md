# 09: Strategie: beelden koppelen

**What to build:** Bij een nieuwe bron probeert de leerling eerst wat hij al weet. Voor de woorden die hij niet kent, kiest hij een strategie. De eerste keer wordt beelden koppelen voorgedaan. Hij maakt per woord een geheugenbeeld, en krijgt later hints die naar zijn eigen beeld verwijzen.

**Blocked by:** 03, 05

**Status:** ready-for-agent (gebouwd; wacht op controle op de S22)

- [x] Een nieuw leeritem begint met een voorkennischeck zonder hulp; vrij opgehaald goed telt als gewone poging, start in fase 1 en slaat het geheugenbeeld over
- [x] Bij een leeritem dat hij niet weet, ziet de leerling woord en betekenis
- [x] Bij een nieuwe bron stelt de app twee strategieën voor (beelden koppelen, geheugenroute), elk met een korte uitleg waarom die past
- [x] De eerste keer wordt beelden koppelen stap voor stap voorgedaan met het voorbeeld van een brug tussen twee kussens voor bridge
- [x] Een geheugenbeeld heeft altijd een korte beschrijving in eigen woorden, en optioneel emoji of een plaatje uit de galerij
- [x] Een hint verwijst naar de beschrijving van het eigen geheugenbeeld
- [x] De ophaalmissie toont het geheugenbeeld niet
- [x] Elke poging registreert de gebruikte strategie

Uitwerking:
- Bij de voorkennischeck krijgt een onbekend woord geen hint-ronde, maar meteen een leermoment (alleen "bijna" geeft nog een nieuwe kans).
- De strategie wordt per bron gekozen bij het eerste leermoment; "liever zonder" kan ook. De geheugenroute staat al in de keuze, maar is uitgeschakeld tot ticket 10.
- Eén geheugenbeeld per leeritem; een nieuw beeld vervangt het oude. Het plaatje wordt verkleind opgeslagen, zodat het in de back-up past.

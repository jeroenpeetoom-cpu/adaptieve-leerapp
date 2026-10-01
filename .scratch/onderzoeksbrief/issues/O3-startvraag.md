# O3: Startvraag vóór de uitleg

**What to build:** Voordat een nieuw woord of een nieuwe plek wordt uitgelegd, raadt de leerling eerst. Bij een woord kiest hij uit 3 à 4 opties, bij een plek tikt hij op de kaart; er is altijd de knop "Geen idee". Daarna volgt het leermoment met het goede antwoord. Zie beslissing 3.

**Blocked by:** geen

**Status:** ready-for-agent (gebouwd; wacht op controle op de S22)

- [x] Elk nieuw leeritem begint met een raadvraag vóór het leermoment
- [x] De opties bij woorden komen uit dezelfde bron; bij plekken dezelfde soort
- [x] De gok telt nooit als poging: geen invloed op voortgang, herhaalplanning of punten
- [x] Vriendelijke reactie: "Goed gegokt!" of "Nu weet je het!", gevolgd door het leermoment
- [x] De raadvraag telt mee in de tijdsinschatting van de sessie

Uitwerking (beslissing 3b):
- Woorden en benoemen: raadvraag met meerkeuze vóór de bestaande voorkennischeck. De gok zelf is geen poging. Fout gegokt wordt "niet geweten", net als "Weet ik niet" bij de typvraag eerder.
- Aanwijzen: de eerste tik is de gok; het label nodigt uit om te raden.
- Met minder dan twee opties (een bron met één woord) slaat de app de raadvraag over.
- De tijd telt vanzelf mee, omdat het tempo per nieuw leeritem gemeten wordt.

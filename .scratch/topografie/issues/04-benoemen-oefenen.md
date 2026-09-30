# 04: Benoemen oefenen

**What to build:** In een sessie laat de app een plek oplichten en vraagt "Wat ligt hier?". De leerling zegt of typt de naam, met meerkeuze als opstap na een fout.

**Blocked by:** 03

**Status:** ready-for-agent (gebouwd; wacht op controle op de S22)

- [x] Benoemen is een oefenrichting van een plek met een eigen leeritem, herhaalplanning en voortgang
- [x] De plek licht op zonder de naam te verklappen
- [x] Zeggen mag altijd (de naam is Nederlands); antwoordcontrole, bijna en hulp werken als bij woorden
- [x] Meerkeuze als opstap gebruikt namen van plekken van dezelfde soort uit dezelfde bron

Uitwerking:
- De plek licht op in een ingezoomde uitsnede van de kaart bovenaan het scherm (dichterbij bij een stad, met meer omgeving bij water, gebied en land), zodat hij ook met het toetsenbord open zichtbaar is.
- Bij plaatsnamen tellen accenten niet mee ("Wallonie" is goed).
- Een nieuwe plek die de leerling niet kent, krijgt een eenvoudig leermoment met de naam in de uitsnede; geheugenbeeld en ankers volgen in ticket 05.
- Aanwijzen en benoemen van dezelfde plek zijn aparte leeritems en mogen in één sessie.


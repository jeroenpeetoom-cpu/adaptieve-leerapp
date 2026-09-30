# 05: Leermoment met ankers

**What to build:** Een nieuwe plek die de leerling niet kent, licht op de kaart op met de naam. De app noemt de ligging ten opzichte van plekken die hij al kent ("Antwerpen ligt ten noorden van Brussel") en de leerling kan een geheugenbeeld voor de naam maken. Hints gebruiken dezelfde ankers.

**Blocked by:** 03

**Status:** ready-for-agent (gebouwd; wacht op controle op de S22)

- [x] Het leermoment toont de plek op de kaart met de naam
- [x] De app kiest een of twee ankers: plekken die de leerling al zelf teruggehaald heeft, dichtbij, en noemt de windrichting (berekend uit de posities)
- [x] De leerling kan een geheugenbeeld voor de naam maken (beelden koppelen of zonder; geen geheugenroute bij topo), met het steuntje zoals bij woorden
- [x] Een hint bij aanwijzen noemt een anker ("Kijk ten noorden van Brussel")
- [x] Strategiestappen tellen mee zoals bij woorden
- [x] Leerlogicatests dekken het kiezen van ankers en de windrichting

Uitwerking:
- Ankers zijn steden op dezelfde kaart die de leerling al zelf heeft teruggehaald (bij aanwijzen of benoemen), de twee dichtstbijzijnde; plekken die er bijna op liggen tellen niet. Kent hij nog geen steden, dan valt de hint terug op de ligging op de kaart.
- Het leermoment gebruikt de ingezoomde uitsnede met de naam en de ankerzin. Per topo-bron kiest de leerling beelden koppelen of zonder; het voordoen gebruikt een topo-voorbeeld (Luik).
- Een geheugenbeeld bij een plek geldt voor aanwijzen én benoemen; bij de tweede richting ziet de leerling zijn beeld terug in plaats van opnieuw een beeld te maken.
- De hint bij aanwijzen noemt het anker en, als dat er is, het eigen beeld.


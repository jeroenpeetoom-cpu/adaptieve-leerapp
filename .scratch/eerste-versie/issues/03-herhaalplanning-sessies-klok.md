# 03: Herhaalplanning, sessies en de instelbare klok

**What to build:** Na een sessie weet de app per leeritem wanneer het weer aan de beurt is. Het startscherm toont hoeveel herhalingen klaarstaan. De begeleider kan in de testfunctie de klok vooruitzetten en zo in minuten zien hoe herhalingen over twee weken verlopen.

**Blocked by:** 02

**Status:** ready-for-agent (gebouwd; wacht op handmatige controle op de S22)

- [x] Intervallen per fase: 1, 3, 7, 14 dagen en daarna telkens ongeveer twee keer zo lang, zonder maximum
- [x] Alleen de eerste poging per leeritem per kalenderdag bepaalt de herhaalplanning
- [x] Vrij opgehaald en goed: één fase verder. Fout of niet geweten: terug naar fase 1. Bijna, of goed met hulp of met een zelf toegevoegd antwoord: de fase blijft gelijk en de volgende herhaling is over 1 dag
- [x] Een sessie bevat eerst herhalingen die aan de beurt zijn (de langst wachtende eerst, maximaal 8), daarna maximaal 4 nieuwe leeritems als er minder dan 8 herhalingen waren
- [x] Een bron met een toetsdatum binnen 7 dagen levert altijd nieuwe leeritems
- [x] Een leeritem dat in de sessie fout ging, komt aan het eind één keer terug
- [x] De sessie toont hoeveel leeritems er nog komen; na afloop kan de leerling "nog een rondje" kiezen
- [x] Een gemiste dag laat herhalingen aan de beurt staan, zonder straf
- [x] Herhalingen kloppen na het sluiten en heropenen van de app
- [x] Een onderbroken sessie is te hervatten
- [x] De testfunctie heeft een instelbare klok die alleen de testgegevens raakt
- [x] Elke herhaalplanning registreert de gebruikte regelversie

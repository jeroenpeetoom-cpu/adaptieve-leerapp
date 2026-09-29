# 10: Strategie: geheugenroute

**What to build:** De leerling legt een route vast van 3 tot 5 plekken die hij goed kent, en maakt per plek een geheugenbeeld voor één woord. Hij loopt de route eerst in gedachten door, en daarna vraagt de app de woorden in wisselende volgorde.

**Blocked by:** 09

**Status:** ready-for-agent (gebouwd; wacht op controle op de S22)

- [x] Een route heeft 3 tot 5 eigen plekken in vaste volgorde; het thema levert geen plekken aan
- [x] Per plek maakt de leerling één geheugenbeeld voor één leeritem
- [x] De eerste keer wordt de geheugenroute stap voor stap voorgedaan
- [x] De app laat de route eerst op volgorde doorlopen, en vraagt de woorden daarna in wisselende volgorde
- [x] Routes hebben een naam en blijven per bron herkenbaar apart
- [x] Een hint kan naar de plek en het geheugenbeeld verwijzen

Uitwerking: elk nieuw woord dat de leerling niet kent, krijgt de eerstvolgende vrije plek van de route van die bron; is de route vol, dan maakt hij een nieuwe. Na elk woord loopt hij de route in gedachten langs met alle woorden die er al liggen. Teruggezette leeritems komen aan het eind van de sessie in wisselende volgorde terug.

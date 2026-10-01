# O1: Eerst de makkelijke richting, dan de moeilijke

**What to build:** Bij een woordpaar of plek wordt de moeilijke richting pas nieuw zodra de leerling de makkelijke richting één keer zelf heeft teruggehaald. Makkelijk is vreemde taal → Nederlands en aanwijzen; moeilijk is Nederlands → vreemde taal en benoemen. Zie beslissing 6.

**Blocked by:** geen

**Status:** ready-for-agent (gebouwd; wacht op controle op de S22)

- [x] Een nieuw leeritem in de moeilijke richting komt pas in een sessie als het broertje in de makkelijke richting een poging "goed, vrij opgehaald" heeft
- [x] Uitzondering: als de toetsdatum zo dichtbij is dat de moeilijke richting anders niet meer op tijd geleerd wordt (minder dan 3 dagen + 1), mogen beide tegelijk nieuw zijn
- [x] Heeft een woordpaar of plek geen makkelijke richting (de leerling oefent alleen de moeilijke), dan hoeft niets te wachten
- [x] Leerlogicatests dekken de volgorde en de toetsuitzondering

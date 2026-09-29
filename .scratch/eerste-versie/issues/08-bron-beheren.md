# 08: Bron beheren na bevestigen

**What to build:** Na het bevestigen kan de leerling een woordpaar nog aanpassen, per bron kiezen in welke richting(en) hij oefent, en een bron afronden als hij die woorden niet meer wil herhalen.

**Blocked by:** 03, 06

**Status:** ready-for-agent (gebouwd; wacht op controle op de S22)

- [x] Een wijziging die alleen hoofdletters, spaties of leestekens raakt, maakt geen nieuwe bronversie en behoudt de voortgang
- [x] Elke andere wijziging maakt een nieuwe bronversie; de leeritems beginnen opnieuw, en oude pogingen blijven in de geschiedenis maar tellen niet mee
- [x] Per bron kiest de leerling Engels → Nederlands, Nederlands → Engels of beide; elke richting is een eigen leeritem met eigen herhaalplanning
- [x] Een bron afronden vraagt bevestiging met de waarschuwing dat woorden later vaak nog nodig zijn; afronden gebeurt nooit automatisch
- [x] Leeritems van een afgeronde bron worden niet ingepland; voortgang en geschiedenis blijven
- [x] Afronden is terug te draaien
- [x] Leerlogicatests dekken de bronversie-regel
- [x] Per bron is de strategie voor nieuwe woorden te wijzigen (beelden koppelen, geheugenroute of zonder); bestaande geheugenbeelden en routes blijven
- [x] Een bevestigd woordpaar is te verwijderen; de pogingen blijven in de geschiedenis
- [x] Naam en toetsdatum van een bron zijn te wijzigen

Uitwerking: bij een inhoudelijke wijziging vervallen ook de zelf toegevoegde antwoorden en geheugenbeelden van dat woordpaar, omdat die bij de oude inhoud hoorden. De herhaalplanning telt alleen pogingen op de huidige bronversie.

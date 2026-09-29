# 08: Bron beheren na bevestigen

**What to build:** Na het bevestigen kan de leerling een woordpaar nog aanpassen, per bron kiezen in welke richting(en) hij oefent, en een bron afronden als hij die woorden niet meer wil herhalen.

**Blocked by:** 03, 06

**Status:** ready-for-agent

- [ ] Een wijziging die alleen hoofdletters, spaties of leestekens raakt, maakt geen nieuwe bronversie en behoudt de voortgang
- [ ] Elke andere wijziging maakt een nieuwe bronversie; de leeritems beginnen opnieuw, en oude pogingen blijven in de geschiedenis maar tellen niet mee
- [ ] Per bron kiest de leerling Engels → Nederlands, Nederlands → Engels of beide; elke richting is een eigen leeritem met eigen herhaalplanning
- [ ] Een bron afronden vraagt bevestiging met de waarschuwing dat woorden later vaak nog nodig zijn; afronden gebeurt nooit automatisch
- [ ] Leeritems van een afgeronde bron worden niet ingepland; voortgang en geschiedenis blijven
- [ ] Afronden is terug te draaien
- [ ] Leerlogicatests dekken de bronversie-regel

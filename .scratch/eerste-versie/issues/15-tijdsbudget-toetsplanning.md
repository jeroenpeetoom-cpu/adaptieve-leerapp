# 15: Tijdsbudget en toetsplanning

**What to build:** Een sessie duurt ongeveer 12 minuten in plaats van een vast aantal woorden. Eerst komen de herhalingen die aan de beurt zijn, daarna vult de app de rest van de tijd met nieuwe woorden. Het tempo past zich aan de leerling aan. Met een toetsdatum leert de app alle nieuwe woorden uiterlijk 3 dagen vóór de toets, en in de laatste 2 dagen komen alle woorden van die bron nog één keer langs.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent (gebouwd; wacht op controle op de S22)

- [x] De sessieduur is een instelling (standaard 12 minuten), te wijzigen onder Profiel en back-up
- [x] Duur per poging begint met een schatting (herhaling 20 s, nieuw leeritem met leermoment 90 s) en wordt aangepast aan het eigen tempo, gemeten tussen opeenvolgende pogingen; pauzes van meer dan 3 minuten tellen niet mee
- [x] Herhalingen die aan de beurt zijn gaan voor, de langst wachtende eerst, zolang ze in de tijd passen; wat niet past blijft zonder straf aan de beurt
- [x] De overgebleven tijd wordt gevuld met nieuwe leeritems
- [x] Met een toetsdatum worden de nieuwe leeritems van die bron verdeeld over de dagen tot 3 dagen vóór de toets; is er te weinig tijd, dan worden ze toch ingepland en duurt de sessie langer
- [x] In de laatste 2 dagen vóór de toets komen alle leeritems van die bron één keer langs (generale repetitie), verdeeld over die 2 dagen, ook als ze nog niet aan de beurt zijn
- [x] Duurt een sessie langer dan het budget, dan meldt de app dat vooraf met een schatting in minuten
- [x] Het startscherm toont per sessie een geschatte duur
- [x] Tempo wordt nooit getoond als oordeel over de leerling
- [x] Leerlogicatests dekken tempo, budget, toetsplanning en generale repetitie met de instelbare klok

Uitwerking: het tempo wordt gemeten als de tijd tussen twee opeenvolgende pogingen in dezelfde sessie en hoort bij de eerste van die twee; de allereerste poging op een leeritem telt als nieuw (inclusief leermoment). Met minder dan 5 metingen geldt de schatting. Veiligheidsgrens: hoogstens 30 nieuwe leeritems per sessie.

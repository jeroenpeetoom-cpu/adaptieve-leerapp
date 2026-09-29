# 02: Eerste oefenroute met de testfunctie

**What to build:** De begeleider opent de testfunctie. Daarin staat een vaste testbron (bridge = brug, cloud = wolk, key = sleutel, river = rivier) die al bevestigd is. Hij start een sessie, krijgt de leeritems één voor één (Engels → Nederlands), typt een antwoord of tikt op "niet geweten", en ziet het oordeel. Pogingen worden opgeslagen. De testfunctie is duidelijk herkenbaar als test en gebruikt een aparte database.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Antwoordcontrole volgt de specificatie: normaliseren (hoofdletters, spaties, leestekens, lidwoord aan het begin), en de oordelen goed, bijna, fout en niet geweten
- [ ] "Bijna" geldt alleen bij toegestane antwoorden van vijf letters of meer en precies één bewerking (vervangen, toevoegen, weglaten of twee naast elkaar liggende letters omdraaien)
- [ ] Na "bijna" volgt meteen een nieuwe poging, met hulp "met hint"
- [ ] Elke poging heeft een unieke id; dubbel verzenden geeft geen dubbele poging
- [ ] Een technische storing wordt nooit als poging opgeslagen
- [ ] De testfunctie leest en schrijft nooit in de echte database
- [ ] Leerlogicatests via de naad "pogingen en tijd in, uitkomst uit" dekken alle oordelen

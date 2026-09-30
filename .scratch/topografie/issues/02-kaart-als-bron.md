# 02: Kaart als bron

**What to build:** De leerling maakt een bron van een topo-hoofdstuk: een foto van de ingevulde kaart en een foto van het werkblad. De app vindt de afkortingen op de kaart en hun plek, koppelt ze met de lijsten van het werkblad aan namen en soorten, en laat de leerling op de kaart controleren: bevestigen, verbeteren, ontbrekende plekken aantikken, dubbele afkortingen oplossen en aangeven wat toetsstof is. Daarna dekt de app de afkortingen af, zodat een blinde kaart met stipjes overblijft.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Een bron kan een topo-bron zijn, met een kaart en de plekken daarop
- [ ] De tekstherkenning vindt afkortingen op de kaart met hun positie
- [ ] Het werkblad levert de namen, de soort (stad, water, gebied, land) en of een plek toetsstof is (het vak "Wat moet je leren?"); de afkorting is het begin van de naam
- [ ] Afkortingen die bij meerdere namen passen (zoals Lu voor Luik en Luxemburg) legt de app aan de leerling voor
- [ ] In de controle ziet de leerling elke plek op de kaart met naam en soort, en kan hij bevestigen, verbeteren, verwijderen of een plek aantikken die de app niet vond
- [ ] Na bevestigen worden de afkortingen afgedekt met de kleur eromheen; de stipjes blijven
- [ ] De controle raadt aan dat een ouder meekijkt, omdat de kaart door de leerling is ingevuld
- [ ] Met een lege kaart werkt het ook: dan worden alle plekken aangetikt
- [ ] Per bron is te kiezen: aanwijzen, benoemen of allebei (standaard allebei)
- [ ] Tests dekken het koppelen van afkortingen aan namen, inclusief dubbele afkortingen

# 02: Kaart als bron

**What to build:** De leerling maakt een bron van een topo-hoofdstuk: een foto van de ingevulde kaart en een foto van het werkblad. De app vindt de afkortingen op de kaart en hun plek, koppelt ze met de lijsten van het werkblad aan namen en soorten, en laat de leerling op de kaart controleren: bevestigen, verbeteren, ontbrekende plekken aantikken, dubbele afkortingen oplossen en aangeven wat toetsstof is. Daarna dekt de app de afkortingen af, zodat een blinde kaart met stipjes overblijft.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent (gebouwd; wacht op controle op de S22)

- [x] Een bron kan een topo-bron zijn, met een kaart en de plekken daarop
- [x] De tekstherkenning vindt afkortingen op de kaart met hun positie
- [x] Het werkblad levert de namen, de soort (stad, water, gebied, land) en of een plek toetsstof is (het vak "Wat moet je leren?"); de afkorting is het begin van de naam
- [x] Afkortingen die bij meerdere namen passen (zoals Lu voor Luik en Luxemburg) legt de app aan de leerling voor
- [x] In de controle ziet de leerling elke plek op de kaart met naam en soort, en kan hij bevestigen, verbeteren, verwijderen of een plek aantikken die de app niet vond
- [x] Na bevestigen worden de afkortingen afgedekt met de kleur eromheen; de stipjes blijven
- [x] De controle raadt aan dat een ouder meekijkt, omdat de kaart door de leerling is ingevuld
- [x] Met een lege kaart werkt het ook: dan worden alle plekken aangetikt
- [x] Per bron is te kiezen: aanwijzen, benoemen of allebei (standaard allebei)
- [x] Tests dekken het koppelen van afkortingen aan namen, inclusief dubbele afkortingen

Uitwerking:
- Elke foto wordt twee keer herkend: gewoon en voorbewerkt (twee keer zo groot, zwart-wit, meer contrast). Het werkblad als kolom (PSM 4), de kaart als losse tekst (PSM 11). Zonder voorbewerking werd het gele vak "Wat moet je leren?" niet gelezen.
- Op de echte kaart en het echte werkblad: 22 van de 25 plekken automatisch gevonden; Luxemburg (land en stad) en de Rijn moeten worden aangetikt.
- Een aangetikte plek krijgt een afdekvak zo groot als een gewone afkorting. Tekst die de herkenning niet zag (zoals een bijgeschreven naam), kan met "Afdekken" worden weggetikt.
- De controle toont de plekken met nummers op de kaart; na bevestigen is alleen de blinde kaart te zien.

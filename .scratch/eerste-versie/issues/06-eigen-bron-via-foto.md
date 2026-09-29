# 06: Eigen bron via een foto

**What to build:** De leerling maakt een nieuwe bron aan (naam, vak, optionele toetsdatum) of kiest een bestaande. Hij fotografeert een pagina met een woordenlijst. De app herkent de tekst op het apparaat en stelt woordparen voor. In het controlescherm ziet hij twijfelwoorden gemarkeerd, verbetert wat nodig is en bevestigt. Daarna oefent hij met zijn eigen woorden.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Tekstherkenning gebeurt op het apparaat met Tesseract (Engels + Nederlands); de taalbestanden zitten in de app zelf en er gaat niets naar een externe dienst
- [ ] De bronverwerking herkent vorm 1: één paar per regel met =, -, –, —, :, tab of meerdere spaties ertussen
- [ ] Woorden met een zekerheid onder 80 zijn gemarkeerd als twijfel, onder 60 als grote twijfel, ook zonder kleur herkenbaar
- [ ] De leerling kan een woordpaar verbeteren, verwijderen en handmatig toevoegen
- [ ] Bevestigen kan pas als elk twijfelwoord is bekeken
- [ ] Zonder bevestiging start er geen sessie met die bron
- [ ] Na het bevestigen wordt de foto verwijderd; tekst en woordparen blijven
- [ ] Elk leeritem bewaart de verwijzing naar zijn bron en bronpagina
- [ ] Bestandstype en bestandsgrootte worden gecontroleerd vóór de herkenning
- [ ] Bronverwerkingstests dekken vorm 1, lege invoer en een onzekere herkenning zoals "brldge"

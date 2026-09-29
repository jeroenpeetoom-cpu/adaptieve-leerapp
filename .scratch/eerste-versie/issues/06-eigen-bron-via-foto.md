# 06: Eigen bron via een foto

**What to build:** De leerling maakt een nieuwe bron aan (naam, vak, optionele toetsdatum) of kiest een bestaande. Hij fotografeert een pagina met een woordenlijst. De app herkent de tekst op het apparaat en stelt woordparen voor. In het controlescherm ziet hij twijfelwoorden gemarkeerd, verbetert wat nodig is en bevestigt. Daarna oefent hij met zijn eigen woorden.

**Blocked by:** 02

**Status:** ready-for-agent (gebouwd; wacht op controle op de S22 met een echte woordenlijst)

- [x] Tekstherkenning gebeurt op het apparaat met Tesseract (Engels + Nederlands); de taalbestanden zitten in de app zelf en er gaat niets naar een externe dienst
- [x] De bronverwerking herkent vorm 1: één paar per regel met =, -, –, —, :, tab of meerdere spaties ertussen
- [x] Woorden met een zekerheid onder 80 zijn gemarkeerd als twijfel, onder 60 als grote twijfel, ook zonder kleur herkenbaar
- [x] De leerling kan een woordpaar verbeteren, verwijderen en handmatig toevoegen
- [x] Bevestigen kan pas als elk twijfelwoord is bekeken
- [x] Zonder bevestiging start er geen sessie met die bron
- [x] Na het bevestigen wordt de foto verwijderd; tekst en woordparen blijven
- [x] Elk leeritem bewaart de verwijzing naar zijn bron en bronpagina
- [x] Bestandstype en bestandsgrootte worden gecontroleerd vóór de herkenning
- [x] Bronverwerkingstests dekken vorm 1, lege invoer en een onzekere herkenning zoals "brldge"

Bekend: een kop met een streepje, zoals "Unit 3 - Words", wordt als woordpaar voorgesteld en moet in de controle verwijderd worden. Herkennen van koppen kan in ticket 07.

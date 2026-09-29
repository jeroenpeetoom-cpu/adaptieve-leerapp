# 07: Moeilijke foto's en meerdere pagina's

**What to build:** Ook een lijst in twee kolommen, of een bron met meerdere pagina's, wordt goed verwerkt. Als herkennen niet lukt, krijgt de leerling een duidelijke melding en een herstelroute.

**Blocked by:** 06

**Status:** ready-for-agent (gebouwd; wacht op controle op de S22)

- [x] De bronverwerking herkent vorm 2 (kolommen, ook twee tabellen naast elkaar) op basis van de positie van woorden
- [x] De leerling kan woordparen koppelen, splitsen en samenvoegen
- [x] Vóór het fotograferen staat de grens van maximaal 10 pagina's per keer; er wordt nooit ongemerkt iets afgekapt
- [x] Bronpagina's zijn te verplaatsen, draaien, verwijderen en opnieuw te herkennen (zolang de foto er nog is)
- [x] Elke bronpagina toont zijn status: wachtend, verwerkt, onzeker, mislukt of bevestigd
- [x] Het originele paginanummer wordt bewaard naast de volgorde in de bron
- [x] Een mislukte bronpagina blijft zichtbaar in de dekkingslijst van de bron
- [x] Bij een onleesbare foto biedt de app opnieuw fotograferen, tekst plakken of handmatig invoeren
- [x] Bij een pagina zonder woordparen (zoals een rekensom) meldt de app dat dit nog niet ondersteund wordt, en maakt er geen woordenlijst van
- [x] Bronverwerkingstests dekken vorm 2 en een pagina zonder woordparen

Vorm 2 is naar voren gehaald omdat de woordenlijsten van de leerling in kolommen staan (vier kolommen naast elkaar, zonder scheidingsteken). De herkenner gebruikt daarvoor de modus "losse tekst" (PSM 11), die bij zo'n pagina veel beter leest dan de standaardmodus.

Uitwerking: splitsen kiest opnieuw waar de betekenis begint (over woord en betekenis samen); samenvoegen zet alles van de volgende regel bij de betekenis. Losse regels kunnen alsnog als woordpaar worden toegevoegd. Tekst plakken werkt met = of - per regel en met tabs als kolommen. Koppen als "Unit 3 - Words" worden nog niet apart herkend; op een pagina met vooral kolommen krijgen ze een twijfelmarkering.

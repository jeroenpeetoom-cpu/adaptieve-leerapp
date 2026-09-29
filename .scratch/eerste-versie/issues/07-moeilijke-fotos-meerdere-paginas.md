# 07: Moeilijke foto's en meerdere pagina's

**What to build:** Ook een lijst in twee kolommen, of een bron met meerdere pagina's, wordt goed verwerkt. Als herkennen niet lukt, krijgt de leerling een duidelijke melding en een herstelroute.

**Blocked by:** 06

**Status:** ready-for-agent

- [x] De bronverwerking herkent vorm 2 (kolommen, ook twee tabellen naast elkaar) op basis van de positie van woorden
- [ ] De leerling kan woordparen koppelen, splitsen en samenvoegen
- [ ] Vóór het fotograferen staat de grens van maximaal 10 pagina's per keer; er wordt nooit ongemerkt iets afgekapt
- [ ] Bronpagina's zijn te verplaatsen, draaien, verwijderen en opnieuw te herkennen (zolang de foto er nog is)
- [ ] Elke bronpagina toont zijn status: wachtend, verwerkt, onzeker, mislukt of bevestigd
- [ ] Het originele paginanummer wordt bewaard naast de volgorde in de bron
- [ ] Een mislukte bronpagina blijft zichtbaar in de dekkingslijst van de bron
- [ ] Bij een onleesbare foto biedt de app opnieuw fotograferen, tekst plakken of handmatig invoeren
- [ ] Bij een pagina zonder woordparen (zoals een rekensom) meldt de app dat dit nog niet ondersteund wordt, en maakt er geen woordenlijst van
- [x] Bronverwerkingstests dekken vorm 2 en een pagina zonder woordparen

Vorm 2 is naar voren gehaald omdat de woordenlijsten van de leerling in kolommen staan (vier kolommen naast elkaar, zonder scheidingsteken). De herkenner gebruikt daarvoor de modus "losse tekst" (PSM 11), die bij zo'n pagina veel beter leest dan de standaardmodus.

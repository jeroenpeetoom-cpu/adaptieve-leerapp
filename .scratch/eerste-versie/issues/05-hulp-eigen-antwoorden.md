# 05: Hulp en eigen antwoorden

**What to build:** Tijdens een poging kan de leerling om hulp vragen: een hint, kiezen uit opties, of een voorbeeld. Is zijn antwoord goed maar staat het niet op de lijst, dan kan hij het als toegestaan antwoord toevoegen.

**Blocked by:** 02

**Status:** ready-for-agent (gebouwd; wacht op handmatige controle op de S22)

- [x] Het hulpmenu biedt hint (eerste letter en aantal letters), kies uit opties (vier opties uit dezelfde bron) en laat voorbeeld zien
- [x] Elke poging registreert de hulp: vrij opgehaald, met hint, herkend of na voorbeeld
- [x] Na twee fouten op hetzelfde leeritem in één sessie toont de app het voorbeeld
- [x] Feedback is één of twee korte zinnen uit vaste sjablonen; meer uitleg is op te vragen
- [x] "Mijn antwoord was ook goed" voegt het antwoord toe als toegestaan antwoord; die poging krijgt de markering antwoordZelfToegevoegd en telt niet als vrij opgehaald
- [x] Het juiste antwoord is niet zichtbaar voordat de leerling een poging heeft gedaan of om een voorbeeld heeft gevraagd
- [x] Meerkeuze als opstap: na een fout of niet geweten komt de volgende poging op dat leeritem als meerkeuze (hulp herkend); na een goede meerkeuze is de volgende poging weer een typvraag; de allereerste poging is altijd een typvraag

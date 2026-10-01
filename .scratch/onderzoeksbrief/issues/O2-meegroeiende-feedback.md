# O2: Feedback die meegroeit met het woord

**What to build:** Na "bijna" of "fout" zegt de feedback wat klopt, waar het misgaat en wat de leerling nu kan proberen. Bij een nieuw woord is de hulp duidelijk, bij een bekend woord eerst licht. Na de laatste poging staat het goede antwoord naast wat de leerling typte, met het verschil gemarkeerd. Zie beslissing 2.

**Blocked by:** geen

**Status:** ready-for-agent (gebouwd; wacht op controle op de S22)

- [x] Een pure functie vergelijkt antwoord en toegestaan antwoord en beschrijft het verschil: welk begin klopt, ontbrekende of extra letters, twee letters omgedraaid, verkeerde letter
- [x] Nieuw woord (nog aan het leren, nog nooit zelf teruggehaald): de feedback noemt wat klopt en waar het misgaat
- [x] Bekend woord (eerder zelf teruggehaald): de feedback geeft eerst alleen een lichte aanwijzing, zoals "er staan twee letters verkeerd om"
- [x] Na de laatste poging: het eigen antwoord en het goede antwoord onder elkaar, met de verschillende letters gemarkeerd
- [x] Bij topografie blijft de windrichting-hint zoals hij is
- [x] Leerlogicatests dekken de verschilbeschrijving

Uitwerking:
- Bekend betekent: het leeritem is eerder al eens goed en zonder hulp opgehaald.
- Bij "fout" komt de verschilzin vóór de bestaande hint; bij een heel ander antwoord noemt de app alleen een begin van minstens twee letters dat klopt.
- Na de laatste poging staat "Jij:" met de foute letters rood doorgestreept, en "Goed:" met de gemiste letters groen.

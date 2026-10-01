# O2: Feedback die meegroeit met het woord

**What to build:** Na "bijna" of "fout" zegt de feedback wat klopt, waar het misgaat en wat de leerling nu kan proberen. Bij een nieuw woord is de hulp duidelijk, bij een bekend woord eerst licht. Na de laatste poging staat het goede antwoord naast wat de leerling typte, met het verschil gemarkeerd. Zie beslissing 2.

**Blocked by:** geen

**Status:** ready-for-agent

- [ ] Een pure functie vergelijkt antwoord en toegestaan antwoord en beschrijft het verschil: welk begin klopt, ontbrekende of extra letters, twee letters omgedraaid, verkeerde letter
- [ ] Nieuw woord (nog aan het leren, nog nooit zelf teruggehaald): de feedback noemt wat klopt en waar het misgaat
- [ ] Bekend woord (eerder zelf teruggehaald): de feedback geeft eerst alleen een lichte aanwijzing, zoals "er staan twee letters verkeerd om"
- [ ] Na de laatste poging: het eigen antwoord en het goede antwoord onder elkaar, met de verschillende letters gemarkeerd
- [ ] Bij topografie blijft de windrichting-hint zoals hij is
- [ ] Leerlogicatests dekken de verschilbeschrijving

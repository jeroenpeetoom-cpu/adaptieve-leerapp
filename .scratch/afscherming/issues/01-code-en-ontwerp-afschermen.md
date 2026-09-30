# 01: Code en ontwerp afschermen voordat de app breder gedeeld wordt

**What to build:** De broncode en het ontwerp (specificatie, ADR's, begrippenlijst, tickets) zijn niet meer openbaar, zodat andere ouders de app kunnen testen maar niet kunnen kopiëren en zelf verder ontwikkelen.

**Blocked by:** besluit van de opdrachtgever (vraag 50)

**Status:** needs-triage (de opdrachtgever denkt na; later terugkomen)

Opties uit vraag 50:
- A: openbaar laten met "alle rechten voorbehouden" (alleen een juridische drempel).
- B: repository privé en GitHub Pro (ongeveer $4 per maand); het adres blijft hetzelfde, dus geen verhuizing van gegevens.
- C (advies als gratis belangrijk is): repository privé en alleen de gebouwde app gratis op Netlify of Cloudflare Pages. Nieuw adres: de leerling moet een back-up maken en die op het nieuwe adres terugzetten, omdat gegevens aan het adres gekoppeld zijn.

Altijd: de werkende app zelf kan iemand met kennis uit de browser halen; afschermen gaat over de broncode en het ontwerp. Delen om te testen kan nu al met de link; elk gezin heeft zijn eigen gegevens op zijn eigen telefoon.

- [ ] Besluit genomen en ADR-0005 bijgewerkt

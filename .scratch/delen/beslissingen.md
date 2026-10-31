# Bronnen delen met een groep

## Beslissingen

1. **Delen via de beheerder, zonder server (route D, testfase).** De begeleider zet een bron in de app, controleert hem en downloadt hem als bestand ("Bron downloaden om te delen"). Het bestand gaat naar de beheerder (Claude in de ontwikkelsessie), die het versleuteld bij de app zet. De app van een kind met de groepscode haalt nieuwe en bijgewerkte bronnen bij het openen vanzelf binnen.
2. **Alleen leerstof.** Gedeeld worden de bevestigde woordparen, de regels, de plekken en de (blinde) kaart. Nooit pogingen, geheugenbeelden, routes, namen of instellingen. De voortgang blijft op de telefoon van het kind.
3. **Versleuteld met de groepscode.** De repository en de site zijn openbaar; daarom zijn de gedeelde bestanden versleuteld (AES-GCM, sleutel uit de groepscode). De map is afgeleid van een hash van de code. De code zelf staat nergens online; zonder code zijn de bestanden onleesbaar. Dit beperkt ook de openbaarheid van lesmateriaal van uitgevers.
4. **Bijwerken behoudt de voortgang.** Een gedeelde bron houdt de ids van de begeleider; een nieuwere versie vervangt de leerstof, maar afronden en de reflectie na de toets blijven staan. Een eigen bron met hetzelfde id wordt nooit overschreven.

Later, als meer ouders zelf willen plaatsen: online opslag met een ouder- en kindcode (zie de vragen in het gesprek van 31 oktober).

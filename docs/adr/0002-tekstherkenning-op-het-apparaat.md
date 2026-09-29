# Tekstherkenning op het apparaat, zonder AI-dienst

Het bouwdocument gaat uit van AI voor fotoherkenning, maar de eerste versie moet gratis zijn. Daarom zet de app huiswerkfoto's op het apparaat zelf om in tekst, met Tesseract (Engels en Nederlands). Er is geen API, geen sleutel en geen server nodig, en de foto verlaat het apparaat niet. Een test met een echte woordenlijst van school op een iPhone gaf "bijna alles goed". Omdat herkenning nooit foutloos is, bevestigt de begeleider of de zelfstandige leerling de woordenlijst voordat er geoefend wordt; twijfelwoorden worden gemarkeerd. Kopiëren en plakken of handmatig verbeteren blijft als herstelroute.

## Considered Options

- Kopiëren en plakken met Live Text: gratis, maar de gebruiker wilde geen extra stappen.
- Ingebouwde herkenning van iOS in een echte app: betere kwaliteit, maar niet gratis (Apple Developer-account).
- Gratis tegoed van een AI-dienst: gegevens mogen daar vaak gebruikt worden om te trainen, en dat past niet bij huiswerk van kinderen.
- Claude API: beste kwaliteit, maar kost geld en vraagt een server voor de sleutel.

## Consequences

De invoer is zo gebouwd dat een AI-dienst later als andere herkenningsbron kan worden aangesloten, zonder de leerlogica te veranderen.

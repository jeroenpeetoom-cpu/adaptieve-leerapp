# TypeScript, Vite en React als PWA, gehost op GitHub Pages

De app wordt gebouwd met TypeScript, Vite en React, met IndexedDB voor opslag op het apparaat, een PWA-plugin voor installeren en offline werken, en Vitest voor tests. De leerlogica (oordelen, herhaalplanning, voortgangsstatus, strategiestap) is een losse module zonder schermcode, zodat die met een instelbare klok te testen is. De taalbestanden voor de tekstherkenning zitten in de app zelf, zodat herkenning zonder internet en zonder externe partij werkt. Een installeerbare PWA vraagt een https-adres; dat komt gratis van GitHub Pages, dat ook de back-up en geschiedenis van de code verzorgt.

## Considered Options

- Gewone HTML en JavaScript zonder bouwgereedschap: te rommelig voor deze omvang, en tests en offline werken zijn lastiger.
- Next.js of een ander serverframework: onnodig zwaar, want er is bewust geen server (ADR-0001).
- Firebase Hosting of Netlify: ook gratis, maar zonder back-up van de code.

## Consequences

Met een gratis GitHub-account werkt Pages alleen voor een openbare repository, dus de code is openbaar. Er staan geen leerlinggegevens in de code. Het bouwdocument, echte huiswerkfoto's en andere persoonlijke bestanden komen nooit in de repository, en documenten spreken neutraal over "de leerling".

# 01: Lege app online en installeerbaar

**What to build:** Een lege app met de bouwopzet uit ADR-0005 (TypeScript, Vite, React, IndexedDB, PWA-plugin, Vitest) staat op een GitHub Pages-adres. De leerling installeert hem via Chrome op de Samsung Galaxy S22, en hij opent ook zonder internet. Het startscherm meldt dat alle gegevens alleen op dit apparaat staan.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] De app is bereikbaar op een https-adres van GitHub Pages en wordt bijgewerkt met één opdracht (`npm run deploy`, die eerst de tests draait)
- [x] Chrome op Android biedt aan de app te installeren; na installatie opent hij als losse app
- [x] De geïnstalleerde app opent in vliegtuigmodus
- [x] Het startscherm toont dat gegevens alleen op dit apparaat staan
- [x] De testopzet draait, met minstens één voorbeeldtest die slaagt
- [x] De leerlogica is een aparte module die geen schermcode, opslag of systeemklok gebruikt
- [x] Het bouwdocument, foto's en andere persoonlijke bestanden staan niet in de repository

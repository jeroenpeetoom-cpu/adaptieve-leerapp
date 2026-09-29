## Agent skills

### Issue tracker

Issues and specs live as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Uses the five default triage labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), recorded as a `Status:` line in each issue file. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Werkvoorraad

Alle to-do's staan als tickets in `.scratch/<onderwerp>/issues/`, met een `Status:`-regel. Begin een nieuwe sessie door die map te bekijken: open tickets zijn `ready-for-agent` of `needs-triage`, en de volgorde volgt de `Blocked by:`-regels. Het volgende open punt staat in `.scratch/eerste-versie/issues/`; uitbreidingen staan klaar in `.scratch/topografie/` en `.scratch/inspreken/`.

## Productrichting

Lees `docs/achtergrond/onderscheidend-vermogen.md` voordat je aan een nieuwe functie begint: het onderscheid van deze app zit niet in huiswerk omzetten in een quiz, maar in het zelfstandig leren kiezen en gebruiken van leerstrategieën. Bewaak bij elke functie dat kennisontwikkeling en strategieontwikkeling apart gevolgd worden.

## Ontwikkelen

- Node staat in `~/.local/node/bin` en `gh` in `~/.local/bin` (via `~/.zprofile` op het PATH). Homebrew compileert Node op deze Mac vanaf de broncode; installeer Node dus niet via `brew`.
- `npm test` draait de tests (Vitest), `npm run dev` start de app lokaal, `npm run lint` controleert de code.
- `npm run deploy` draait de tests, bouwt de app en zet hem op GitHub Pages (https://jeroenpeetoom-cpu.github.io/adaptieve-leerapp/). GitHub heeft daarna een paar minuten nodig: meld een nieuwe versie pas als de live site de versie onderaan het scherm echt toont.
- De app draait op de telefoon van de leerling (Samsung Galaxy S22, als geïnstalleerde web-app). Gegevens staan alleen daar; de repository is openbaar en bevat nooit persoonlijke bestanden (zie `.gitignore`).

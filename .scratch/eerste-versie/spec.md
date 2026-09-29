# Specificatie: eerste versie adaptieve leerapp (woordenschat)

Status: ready-for-agent

Begrippen volgen `CONTEXT.md`. Architectuurkeuzes staan in `docs/adr/0001` t/m `0005`. Het bouwdocument is startmateriaal; waar deze specificatie afwijkt, geldt deze specificatie.

## Problem Statement

Een leerling van ongeveer 10 jaar krijgt woordenlijsten als huiswerk, vaak verspreid over meerdere pagina's. Overhoren en herhalen gebeurt nu onregelmatig: vlak voor de toets veel, daarna niets. Er is geen zicht op welke woorden hij echt zelfstandig kan ophalen, en hij leert geen bewuste strategie om woorden te onthouden. De begeleider wil een gratis hulpmiddel dat op de eigen Android-telefoon van de leerling werkt, zonder account, zonder AI-kosten en zonder dat leerlinggegevens het apparaat verlaten.

## Solution

Een installeerbare website (PWA) op de Samsung Galaxy S22 van de leerling. De leerling fotografeert zelf zijn huiswerkpagina's. De app herkent de tekst op het apparaat, maakt er woordparen van en laat de leerling die controleren en bevestigen. Daarna oefent hij in korte sessies met een ruimte-expeditie als thema: hij leert een strategie (beelden koppelen of een geheugenroute), maakt eigen geheugenbeelden en haalt de woorden later zonder steun op. Vaste, uitlegbare regels bepalen het oordeel over elke poging, de herhaalplanning over dagen en weken, en de zichtbare voortgang. Alleen vrij opgehaalde antwoorden leveren langere herhaalintervallen op. Alle gegevens blijven op het apparaat, met een exportknop als back-up.

## User Stories

### Starten en instellen

1. Als leerling wil ik de app vanuit Chrome op mijn beginscherm installeren, zodat ik hem als een gewone app open.
2. Als leerling wil ik dat de app zonder internet werkt, zodat ik ook in de bus kan oefenen.
3. Als leerling wil ik bij de eerste start alleen een bijnaam, leerjaar en onderwijsniveau invullen, zodat ik snel kan beginnen zonder persoonlijke gegevens te geven.
4. Als leerling wil ik een korte uitleg bij de eerste start over hoe de app werkt, zodat ik weet wat ik kan verwachten.
5. Als begeleider wil ik dat de app vraagt om blijvende opslag, zodat de browser de voortgang niet zomaar wist.
6. Als leerling wil ik geluid, voorlezen en beweging kunnen uitzetten, zodat de app ook in een stille of drukke omgeving prettig is.

### Een bron toevoegen

7. Als leerling wil ik een nieuwe bron aanmaken met een naam (bijvoorbeeld "Engels H3"), een vak en een optionele toetsdatum, zodat mijn oefenen bij een toets hoort.
8. Als leerling wil ik bij het fotograferen kiezen tussen "nieuwe bron" en "toevoegen aan een bestaande bron", zodat een pagina die later komt bij het juiste hoofdstuk hoort.
9. Als leerling wil ik vooraf zien hoeveel pagina's ik per keer kan toevoegen (maximaal 10), zodat er nooit ongemerkt pagina's wegvallen.
10. Als leerling wil ik tips zien voor een goede foto (licht, recht erboven, alleen de lijst in beeld), zodat de herkenning beter lukt.
11. Als leerling wil ik per bronpagina de status zien (wachtend, verwerkt, onzeker, mislukt, bevestigd), zodat ik weet welke pagina's nog aandacht nodig hebben.
12. Als leerling wil ik bronpagina's kunnen verplaatsen, draaien, verwijderen, toevoegen en opnieuw laten herkennen, zodat de volgorde en de herkenning kloppen.
13. Als leerling wil ik dat de app het originele paginanummer naast de volgorde in de bron bewaart, zodat ik woorden kan terugvinden in mijn boek.
14. Als leerling wil ik bij een onleesbare foto een duidelijke melding en keuzes krijgen (opnieuw fotograferen, tekst plakken of handmatig invoeren), zodat ik niet vastloop.
15. Als leerling wil ik bij een pagina die geen woordenlijst is (bijvoorbeeld een rekensom) een melding dat dit nog niet ondersteund wordt, zodat de app er geen willekeurige woordenlijst van maakt.

### De bron controleren en bevestigen

16. Als leerling wil ik de herkende woordparen per bronpagina zien, zodat ik kan controleren wat de app heeft gelezen.
17. Als leerling wil ik dat woorden waar de herkenning aan twijfelt geel of rood gemarkeerd zijn, met ook een niet-kleurgebonden aanduiding, zodat ik weet waar ik moet kijken.
18. Als leerling wil ik een woordpaar kunnen verbeteren, verwijderen, splitsen, samenvoegen of handmatig koppelen, zodat de lijst klopt, ook als de opmaak ongebruikelijk is.
19. Als leerling wil ik handmatig een woordpaar kunnen toevoegen, zodat een gemist woord alsnog meedoet.
20. Als leerling wil ik per bron de oefenrichting kiezen (bijvoorbeeld Engels → Nederlands, Nederlands → Engels, of beide), zodat ik oefen wat de toets vraagt.
21. Als leerling wil ik pas kunnen bevestigen als ik elk twijfelwoord heb bekeken, zodat een fout herkend woord niet ongemerkt in mijn oefenlijst komt.
22. Als leerling wil ik dat een mislukte bronpagina zichtbaar blijft in de dekkingslijst van de bron, zodat ik weet dat daar nog woorden ontbreken.
23. Als leerling wil ik dat de foto na het bevestigen verdwijnt, zodat er geen onnodige gegevens op mijn telefoon blijven staan.
24. Als leerling wil ik een woordpaar na het bevestigen nog kunnen aanpassen, zodat ik een fout later kan herstellen.
25. Als leerling wil ik dat een kleine verbetering (alleen hoofdletters, spaties of leestekens) mijn voortgang behoudt, zodat ik niet gestraft word voor netjes maken.
26. Als leerling wil ik dat een echte wijziging van een woord of betekenis een nieuwe bronversie maakt, zodat mijn voortgang eerlijk blijft.

### Een sessie starten

27. Als leerling wil ik op het startscherm zien hoeveel herhalingen er klaarstaan en hoe lang de sessie is ("8 woorden"), zodat ik weet waar ik aan begin.
28. Als leerling wil ik dat herhalingen die aan de beurt zijn voorgaan, met de langst wachtende eerst, zodat er geen achterstand opstapelt.
29. Als leerling wil ik na een gemiste dag of een vakantie geen straf, zodat ik gewoon verder kan.
30. Als leerling wil ik dat een toets binnen 7 dagen nieuwe woorden van die bron naar voren haalt, zodat ik op tijd klaar ben.
31. Als leerling wil ik tijdens de sessie zien hoeveel woorden er nog komen, zodat het eindpunt duidelijk is zonder tijdsdruk.
32. Als leerling wil ik na afloop "nog een rondje" kunnen kiezen, zodat ik door kan als ik zin heb.
33. Als leerling wil ik op elk moment kunnen pauzeren en later verdergaan, zodat een onderbreking geen probleem is.

### Nieuwe woorden leren

34. Als leerling wil ik bij een nieuw leeritem eerst kort proberen of ik het al weet, zodat ik geen tijd kwijt ben aan woorden die ik ken.
35. Als leerling wil ik op "niet geweten" kunnen tikken, zodat ik eerlijk kan zijn zonder dat het als fout voelt.
36. Als leerling wil ik dat een woord dat ik meteen goed heb, geen geheugenbeeld hoeft, zodat ik snel verder kan.
37. Als leerling wil ik bij een woord dat ik niet ken het woord en de betekenis te zien krijgen, met een 🔊-knop voor de uitspraak, zodat ik het goed leer.
38. Als leerling wil ik bij een nieuwe bron kiezen tussen twee strategieën (beelden koppelen of geheugenroute), met een korte uitleg waarom ze passen, zodat ik bewust leer kiezen.
39. Als leerling wil ik dat een strategie die ik nog nooit gebruikt heb eerst wordt voorgedaan met een uitgewerkt voorbeeld (een brug tussen twee kussens voor *bridge*), zodat ik snap hoe het werkt.
40. Als leerling wil ik bij beelden koppelen per woord in een paar eigen woorden beschrijven wat ik voor me zie, zodat ik een geheugenbeeld maak.
41. Als leerling wil ik aan een geheugenbeeld optioneel emoji of een plaatje uit mijn galerij (bijvoorbeeld een tekening op papier) toevoegen, zodat het beeld sterker wordt.
42. Als leerling wil ik bij de geheugenroute 3 tot 5 bekende plekken in vaste volgorde vastleggen, en per plek een geheugenbeeld maken voor één woord, zodat ik de woorden langs een route kan onthouden.
43. Als leerling wil ik mijn routes herkenbaar apart kunnen houden, zodat routes voor verschillende bronnen niet door elkaar gaan.
44. Als leerling wil ik dat de app me de route eerst in gedachten laat doorlopen en daarna de woorden in wisselende volgorde vraagt, zodat ik ze niet alleen op volgorde ken.

### Ophalen en feedback

45. Als leerling wil ik in de ophaalmissie een ruimteschip helpen dat codewoorden nodig heeft om naar de volgende planeet te springen, zodat oefenen leuk is.
46. Als leerling wil ik dat de ophaalmissie het woord vraagt zonder mijn eerdere geheugenbeeld te tonen, zodat ik echt zelf ophaal.
47. Als leerling wil ik mijn antwoord typen, zodat ik vrij ophaal en niet alleen herken.
48. Als leerling wil ik dat hoofdletters, extra spaties, leestekens en lidwoorden niet meetellen, zodat "de sleutel" gewoon goed is.
49. Als leerling wil ik bij een kleine spelfout in een woord van vijf letters of meer "bijna" horen en meteen een nieuwe kans krijgen, zodat ik mijn spelling verbeter zonder dat het als fout telt.
50. Als leerling wil ik om hulp kunnen vragen (een hint, kiezen uit opties, of een voorbeeld), zodat ik niet vastloop.
51. Als leerling wil ik dat een hint verwijst naar mijn eigen geheugenbeeld ("denk aan je beeld bij de kapstok"), zodat ik mijn beeld leer gebruiken.
52. Als leerling wil ik na een fout eerst erkenning en één gerichte aanwijzing, en na herhaald vastlopen een voorbeeld, zodat hulp klein begint.
53. Als leerling wil ik korte feedback van één of twee zinnen, met meer uitleg op verzoek, zodat ik niet hoef te lezen als ik dat niet nodig heb.
54. Als leerling wil ik dat een woord dat ik fout had later in de sessie terugkomt, zodat ik het nog een keer zelf kan proberen.
55. Als leerling wil ik kunnen zeggen "mijn antwoord was ook goed", waarna het als toegestaan antwoord wordt toegevoegd, zodat een goed synoniem de volgende keer meteen telt.
56. Als leerling wil ik na mijn antwoord het juiste woord kunnen laten voorlezen, zodat ik de uitspraak leer.
57. Als leerling wil ik geen levens, geen aftellende klok en geen verlies bij een fout, zodat ik rustig kan nadenken.
58. Als leerling wil ik dat een animatie pas na mijn antwoord komt en het antwoord niet verraadt, zodat het spel het leren niet ondermijnt.
59. Als leerling wil ik dat een storing (bijvoorbeeld de app loopt vast of een knop reageert twee keer) nooit als fout telt, zodat mijn voortgang eerlijk blijft.

### Terugblik en voortgang

60. Als leerling wil ik aan het eind van een sessie zien wat zelf lukte en wat later terugkomt, zodat ik weet waar ik sta.
61. Als leerling wil ik één reflectievraag met tikbare antwoorden krijgen ("Wat hielp je vandaag het meest?"), die ik kan overslaan, zodat ik leer merken wat werkt.
62. Als leerling wil ik bij een volgende strategiekeuze mijn eerdere reflectie terugzien ("vorige keer zei je dat de route hielp"), zodat ik beter kies.
63. Als leerling wil ik per leeritem de voortgangsstatus zien (nog aan het leren, zelf teruggehaald, later nog geweten), zodat ik weet wat ik echt ken.
64. Als leerling wil ik bij een woord dat terug is naar "nog aan het leren" zien dat ik het eerder al wist, zodat een fout niet voelt als alles kwijt.
65. Als leerling wil ik per bron zien hoeveel woorden op elke status staan, en welke pagina's mislukt of overgeslagen zijn, zodat ik weet of ik klaar ben voor de toets.
66. Als leerling wil ik per strategie mijn strategiestap zien (voorgedaan, zelf gekozen, zelfstandig toegepast), zodat ik zie dat ik ook leer hoe ik leer.
67. Als leerling wil ik zien wanneer mijn volgende herhalingen zijn, zodat ik kan plannen.
68. Als leerling wil ik een bron kunnen afronden (met een waarschuwing dat woorden later vaak nog nodig zijn) en dat weer kunnen terugdraaien, zodat ik zelf bepaal wat blijft terugkomen.

### Gegevensbeheer

69. Als begeleider wil ik alle gegevens kunnen exporteren als back-upbestand, zodat de voortgang niet verloren gaat als de telefoon kapot gaat.
70. Als begeleider wil ik een back-upbestand kunnen terugzetten, zodat ik de voortgang op een nieuwe telefoon kan voortzetten.
71. Als leerling wil ik alle gegevens kunnen verwijderen met een dubbele bevestiging (bevestigen en een woord overtypen), zodat dat niet per ongeluk gebeurt.
72. Als begeleider wil ik dat de app zichtbaar maakt dat alle gegevens alleen op dit apparaat staan, zodat ik weet waar ze zijn.

### Testfunctie

73. Als begeleider wil ik een testfunctie met een voorbeeldbron (bridge, cloud, key, river, met een bewust onzekere herkenning "brldge"), zodat ik de route kan doorlopen zonder echt huiswerk.
74. Als begeleider wil ik in de testfunctie een instelbare klok, zodat ik twee weken herhaalplanning in een paar minuten kan controleren.
75. Als begeleider wil ik dat de testfunctie duidelijk als test herkenbaar is en volledig gescheiden van de echte gegevens, zodat de leerling nooit herhalingen van testwoorden krijgt.

## Implementation Decisions

### Modules

- **Leerlogica**: een pure module zonder schermcode, opslag of systeemklok. Bevat antwoordcontrole, oordeel, herhaalplanning, voortgangsstatus, strategiestap, sessiesamenstelling en de bronversie-regel. Krijgt de huidige tijd altijd als invoer. Alle aantallen en intervallen komen uit een versioneerd instellingenobject; elke poging en herhaalplanning registreert de gebruikte regelversie.
- **Bronverwerking**: zet herkende tekst (regels met woorden en zekerheid) om in voorgestelde woordparen met twijfelmarkeringen. Kent vorm 1 (één paar per regel met `=`, `-`, `–`, `—`, `:`, tab of meerdere spaties ertussen) en vorm 2 (twee kolommen, op basis van de horizontale positie van woorden). Pure module.
- **Herkenner**: een smalle interface "afbeelding in, regels met woorden, positie en zekerheid uit". De echte implementatie gebruikt Tesseract (Engels + Nederlands) met de taalbestanden in de app zelf. Tests gebruiken een nep-herkenner.
- **Opslag**: een repository-interface voor leerling, bronnen, bronpagina's, woordparen, leeritems, geheugenbeelden, routes, pogingen, herhaalplanning, sessies en reflecties. De echte implementatie gebruikt IndexedDB; tests en de testfunctie gebruiken een aparte database. Export en import zijn één versioneerd JSON-bestand.
- **Weergave**: React-schermen en het thema ruimte-expeditie. De weergave leest de uitkomsten van de leerlogica en neemt zelf geen leerbeslissingen. Voorlezen gebruikt de ingebouwde spraak van de browser; de 🔊-knop verdwijnt als er geen stem voor die taal is.

### Datamodel (kern)

- **Leerling**: id, stand (in de eerste versie altijd zelfstandig), begeleiderId optioneel, bijnaam, leeftijdsgroep, onderwijsniveau, leerjaar, talen, leesondersteuning, interesses. Het model laat meerdere leerlingen en een begeleider toe, maar de schermen kennen er één.
- **Bron**: id, leerlingId, naam, vak, optionele toetsdatum, oefenrichtingen, afgerond (ja/nee), bevestigdOp.
- **Bronpagina**: id, bronId, origineelNummer, volgorde, verwerkingsstatus (wachtend, verwerkt, onzeker, mislukt, bevestigd), herkende tekst. De foto staat alleen tijdelijk bij de bronpagina, tot het bevestigen.
- **Woordpaar**: id, bronId, bronpaginaId, woord, betekenis, bronversie.
- **Leeritem**: id, soort (in de eerste versie alleen woordpaar; topografie volgt, zie `.scratch/topografie/`), woordpaarId, bronversie, oefenrichting, toegestane antwoorden.
- **Geheugenbeeld**: id, leeritemId, beschrijving (verplicht), emoji (optioneel), plaatje (optioneel), routeId en plek (optioneel).
- **Route**: id, leerlingId, naam, geordende plekken (3 tot 5).
- **Poging**: id (uniek, zodat dubbel verzenden geen dubbele voortgang geeft), sessieId, leeritemId, bronversie, antwoord, oordeel, hulp, antwoordZelfToegevoegd, strategie, tijdstip, regelversie.
- **Herhaalplanning**: leeritemId, fase, volgendeDatum, laatstVrijOpgehaald, regelversie.
- **Sessie**: id, leerlingId, geplande leeritems, start, einde, onderbroken, reflectie.

### Antwoordcontrole

- **Normaliseren**: kleine letters, spaties aan begin en eind weg, meerdere spaties worden één, leestekens weg, en een lidwoord aan het begin weg (de, het, een, the, a, an). Dit geldt voor het antwoord en voor elk toegestaan antwoord.
- **Goed**: het genormaliseerde antwoord is gelijk aan een genormaliseerd toegestaan antwoord.
- **Bijna**: het genormaliseerde toegestane antwoord heeft vijf letters of meer, en het verschil is precies één bewerking: één letter vervangen, toegevoegd of weggelaten, of twee naast elkaar liggende letters omgedraaid. Na "bijna" volgt meteen een nieuwe poging met hulp *met hint*.
- **Niet geweten**: de leerling tikte op "niet geweten". Daarop volgt een voorbeeld.
- **Fout**: al het andere.
- **Antwoord zelf toegevoegd**: het antwoord wordt een toegestaan antwoord voor volgende pogingen. Deze poging houdt hulp en oordeel, maar krijgt de markering antwoordZelfToegevoegd en telt niet als vrij opgehaald.

### Hulp en hints (zonder AI)

- Het hulpmenu biedt *hint*, *kies uit opties* (vier opties uit dezelfde bron) en *laat voorbeeld zien*.
- **Meerkeuze als opstap (bevestigd):** was de laatste poging op een leeritem *fout* of *niet geweten*, dan komt de volgende poging als meerkeuze (vier opties uit dezelfde bron, hulp *herkend*). Is die meerkeuze goed, dan is de poging daarna weer een typvraag. De allereerste poging op een leeritem is altijd een typvraag, de voorkennischeck. Zo bouwt de hulp vanzelf af, en telt herkennen nooit als vrij opgehaald.
- Een hint is de beschrijving van het eigen geheugenbeeld. Is er geen geheugenbeeld, dan is de hint de eerste letter plus het aantal letters.
- Na een fout volgt één aanwijzing. Na twee fouten op hetzelfde leeritem in één sessie volgt het voorbeeld.
- Feedbackteksten komen uit vaste sjablonen per oordeel en hulp, in korte Nederlandse zinnen.

### Herhaalplanning

- Intervallen per fase: 1, 3, 7 en 14 dagen, daarna telkens ongeveer twee keer zo lang (30, 60, 120, ...). Het interval rekent vanaf de meest recente vrij opgehaalde goede poging.
- Alleen de eerste poging op een leeritem per kalenderdag bepaalt de herhaalplanning. Latere pogingen op dezelfde dag zijn oefening. Een direct verbeterd antwoord is geen bewijs van langdurige herinnering.
  - *Vrij opgehaald* en *goed*, zonder antwoordZelfToegevoegd: één fase verder.
  - *Fout* of *niet geweten*: terug naar fase 1 (1 dag).
  - *Bijna*, of goed met hulp *met hint*, *herkend* of *na voorbeeld*, of met antwoordZelfToegevoegd: de fase blijft gelijk en de volgende herhaling is over 1 dag.
- Een nieuw leeritem dat bij de voorkennischeck vrij opgehaald goed is, start in fase 1.
- Een gemiste herhaling blijft aan de beurt, zonder straf.
- Leeritems van een afgeronde bron worden niet ingepland.

### Voortgangsstatus

- De status wordt berekend uit de pogingen op de huidige bronversie sinds de laatste *fout* of *niet geweten*:
  - *Nog aan het leren*: er is nog geen vrij opgehaalde goede poging.
  - *Zelf teruggehaald*: minstens één vrij opgehaalde goede poging (zonder antwoordZelfToegevoegd).
  - *Later nog geweten*: vrij opgehaald goed op minstens twee verschillende kalenderdagen, waarbij de laatste minstens 7 dagen na de allereerste poging op dit leeritem valt.
- *Bijna* en goede antwoorden met hulp zijn geen bewijs, maar zetten de status ook niet terug.
- Eerder bereikte statussen worden in de geschiedenis bewaard en in de terugblik getoond.

### Sessiesamenstelling

- Eerst herhalingen die aan de beurt zijn, de langst wachtende eerst, tot maximaal 8.
- Nieuwe leeritems, maximaal 4, komen alleen als er minder dan 8 herhalingen waren. Uitzondering: een bron met een toetsdatum binnen 7 dagen levert altijd nieuwe leeritems, tot het maximum.
- Een leeritem dat in de sessie fout ging, komt aan het eind van de sessie één keer terug.
- Na het eindpunt kan de leerling "nog een rondje" kiezen; dat stelt een nieuwe sessie samen met dezelfde regels.
- Een sessie blijft na onderbreking hervatbaar.

### Strategiestap

- Bij de eerste keer dat een strategie gebruikt wordt, staat die op *voorgedaan*: een stap-voor-stap uitleg met het vaste voorbeeld.
- Kiest de leerling bij een latere nieuwe bron zelf een strategie uit de twee voorstellen, dan gaat die naar *zelf gekozen*.
- *Zelfstandig toegepast*: de strategie is zelf gekozen bij een nieuwe bron, en daarna staat meer dan de helft van de daarmee geleerde leeritems op *later nog geweten*.
- Een reflectie verandert nooit een strategiestap of voortgangsstatus.

### Bronversie

- Een wijziging in een woordpaar maakt alleen een nieuwe bronversie als de genormaliseerde inhoud verandert (dezelfde normalisatie als bij de antwoordcontrole).
- Een nieuwe bronversie geeft de leeritems een nieuwe herhaalplanning, die begint als nieuw leeritem. Oude pogingen blijven in de geschiedenis.

### Privacy en veiligheid

- Er worden alleen een bijnaam en onderwijsinstellingen gevraagd.
- Geen enkel leerlinggegeven verlaat het apparaat. De app laadt na installatie geen code of data van derden; de taalbestanden voor de herkenning zitten in de app zelf.
- Herkende tekst is altijd leerstof en nooit een instructie aan de app. Er is geen AI en geen vrij gesprek, dus tekst op een foto kan het gedrag van de app niet veranderen.
- De app valideert bestandstype en bestandsgrootte vóór de herkenning.

### Toegankelijkheid

- Ontworpen voor een telefoonscherm, met grote bedieningsvlakken en voldoende contrast.
- Informatie blijkt nooit alleen uit kleur of geluid.
- De app respecteert de systeeminstelling "minder beweging", en werkt volledig zonder audio en zonder animatie.

## Testing Decisions

**Testnaden (bevestigd):**

- **Naad 1: de leerlogica.** Een test geeft een begintoestand, een reeks gebeurtenissen (pogingen, verstreken tijd, bronwijzigingen) en een tijdstip, en controleert daarna de uitkomst: het oordeel, de herhaalplanning, de voortgangsstatus, de strategiestap en de sessiesamenstelling. Dit is de belangrijkste naad. Hier worden alle acceptatiecriteria over hints, intervallen, gemiste dagen en bronversies aangetoond, met een instelbare klok.
- **Naad 2: de bronverwerking.** Een test geeft herkende regels (met zekerheid en positie) en controleert de voorgestelde woordparen en twijfelmarkeringen. Voorbeelden: vorm 1, vorm 2, lege invoer, een pagina zonder woordparen, en "brldge" met lage zekerheid.

Goede tests controleren alleen extern gedrag via deze twee naden, en niet hoe het intern werkt. Tesseract, IndexedDB en de schermen worden niet los getest. De volledige gebruikersroute wordt handmatig gecontroleerd op de S22, met de testfunctie. Er is nog geen bestaande testcode om op voort te bouwen; Vitest wordt de testopzet (ADR-0005).

**Minimaal aan te tonen:**

- Zonder bevestiging start er geen sessie met die bron.
- Bevestigen kan pas als alle twijfelwoorden bekeken zijn.
- Een goed antwoord na een hint wordt anders opgeslagen dan een vrij opgehaald antwoord, en verhoogt het interval niet.
- De herhaalplanning werkt na sluiten en heropenen.
- Een gemiste dag verdwijnt niet en levert geen straf op.
- Een wijziging in de bron maakt een nieuwe bronversie. Alleen hoofdletters, spaties of leestekens doen dat niet.
- Oude pogingen maken een nieuwe bronversie niet "later nog geweten".
- Dubbel verzonden pogingen geven geen dubbele voortgang.
- Een storing wordt nooit als poging opgeslagen.
- Een mislukte bronpagina blijft zichtbaar in de dekkingslijst.
- Elk leeritem houdt zijn verwijzing naar bron en bronpagina.
- Export gevolgd door import geeft dezelfde toestand terug.
- De testfunctie raakt nooit de echte gegevens.

## Out of Scope

- Begeleide stand, pincode of ouderslot, meerdere leerlingen in de schermen, en de strategiestap *samen gekozen*.
- Accounts, een server, synchronisatie tussen apparaten, en delen met andere gezinnen of een school.
- Elke vorm van AI: herkenning, feedback, hints en het maken van plaatjes.
- De voortgangsstatus *ook anders gebruikt*, en eigen zinnen schrijven bij een woord.
- Een speelse en een rustige weergave naast elkaar, en meer dan één thema.
- Lijstvormen met uitspraak, woordsoort of voorbeeldzin (vorm 3), en lijsten met alle woorden eerst en alle betekenissen daarna (vorm 4). Deze gaan via handmatig koppelen.
- Andere vakken en leerdoelen dan woordenschat, zoals rekenen, begrijpend lezen en spelling als apart doel.
- Foto's bewaren na het bevestigen.
- Inspreken met een eigen knop in de app, tekenen in de app, en voorlezen dat vanzelf start. Inspreken kan wel via de microfoon van het toetsenbord; bij het geheugenbeeld staat daar een tip voor. Alles kunnen inspreken, ook antwoorden, staat als uitbreiding in `.scratch/inspreken/`.
- Ondersteuning specifiek voor iPhone of Safari.

## Further Notes

- **Aanvullende regels (bevestigd):** na *bijna* of een goed antwoord met hulp blijft de fase gelijk en komt het leeritem over 1 dag terug; alleen de eerste poging per dag bepaalt de herhaalplanning; meer dan de helft *later nog geweten* is de drempel voor *zelfstandig toegepast*; na twee fouten in één sessie volgt het voorbeeld; de intervallen na 14 dagen hebben geen maximum. Allemaal instellingen, bij te stellen na de eerste weken gebruik.
- **Route en thema:** bij het kiezen van het thema noemde ik de planeten als mogelijke plekken voor een route. Het onderzoek naar de methode van loci werkt juist met plekken die de leerling al goed kent, zoals voordeur, kapstok en bank. Deze specificatie laat de leerling daarom eigen bekende plekken kiezen. Het thema levert geen plekken aan.
- **Nog te controleren:** de herkenning is getest op een iPhone, maar nog niet op de S22. Hoe de woordenlijsten van de leerling eruitzien, is ook nog niet bekend. Wijkt de opmaak af van vorm 1 of 2, dan komt er een aanvulling op de bronverwerking.
- **Pilot:** het bouwdocument stelt een pilot van twee weken voor, met een latere controle zonder de oorspronkelijke beelden en minstens één overhoring op papier of in gesprek. Dat hoort bij het gebruik, niet bij deze bouw.

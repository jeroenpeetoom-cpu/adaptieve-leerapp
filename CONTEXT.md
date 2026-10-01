# Adaptieve leerapp

Een Nederlandstalige leerapp waarin een leerling huiswerk fotografeert en daarmee oefent. De app ontwikkelt twee dingen apart: kennis van de leerstof, en het vermogen om zelfstandig een leerstrategie te kiezen en toe te passen.

## Language

**Leerling**:
De persoon die oefent, van elke leeftijd en elk onderwijsniveau.
_Avoid_: kind, leerder, scholier, lerende

**Bron**:
De leerstof voor één toets of hoofdstuk, zoals "Engels H3", opgebouwd uit een of meer bronpagina's waar later pagina's bij kunnen komen.
_Avoid_: huiswerk, huiswerkbron, import, les, woordenlijst

**Afgeronde bron**:
Een bron waarvan de leeritems niet meer herhaald worden, maar die zijn voortgang en geschiedenis houdt. Alleen de leerling rondt af, nooit automatisch, en het is terug te draaien.
_Avoid_: gearchiveerd, klaar, verlopen

**Bronpagina**:
Eén gefotografeerde pagina van een bron, met zowel het originele paginanummer als de plek in de bron.
_Avoid_: foto, upload, scan

**Woordpaar**:
Een woord en zijn betekenis zoals ze samen in de bron staan, zoals *bridge = brug*.
_Avoid_: woordje, vertaling

**Kaart**:
Een bronpagina met een topografische kaart waarop de plekken van een bron zijn vastgelegd.
_Avoid_: plattegrond, atlas

**Plek**:
Iets met een naam en een positie op een kaart, van één soort: *stad*, *rivier*, *zee*, *gebied*, *gebergte*, *land* of *ander water* (zoals een meer of kanaal), bijvoorbeeld Antwerpen, de Maas of de Ardennen.
_Avoid_: locatie, topo-item, punt

**Anker**:
Een plek die de leerling al kent en die de app gebruikt om een andere plek te beschrijven, zoals "ten noorden van Brussel".
_Avoid_: referentiepunt, oriëntatiepunt

**Leeritem**:
Eén ding dat de leerling zonder steun moet kunnen ophalen, met een eigen herhaalplanning en voortgang, zoals "bridge → ?" of "Waar ligt Antwerpen?". Uit een woordpaar of een plek ontstaan één of twee leeritems, één per oefenrichting.
_Avoid_: kaart, vraag, item, opgave

**Bronversie**:
Een vastgelegde stand van de inhoud van een woordpaar. Pogingen op een eerdere bronversie blijven in de geschiedenis, maar tellen niet als bewijs dat de leerling de nieuwe versie beheerst.
_Avoid_: revisie, editie

**Toegestaan antwoord**:
Een antwoord dat bij een leeritem als goed geldt. Een leeritem heeft er een of meer, en de leerling kan er zelf een toevoegen.
_Avoid_: juiste antwoord, antwoordmodel

**Oefenrichting**:
Wat een leeritem vraagt en wat het als antwoord verwacht. Bij een woordpaar een taalrichting, zoals Engels → Nederlands; bij een plek *aanwijzen* ("Waar ligt Antwerpen?", de leerling tikt op de kaart) of *benoemen* ("Wat ligt hier?", de leerling zegt of typt de naam).
_Avoid_: modus, kant

**Poging**:
Eén antwoord van de leerling op een leeritem, samen met de hulp die hij daarbij kreeg en het oordeel. Een technische storing is nooit een poging.
_Avoid_: beurt, antwoord (voor het geheel)

**Oordeel**:
Hoe de app een poging beoordeelt: *goed*, *bijna* (een kleine spelfout die een nieuwe kans geeft maar niet als goed telt), *fout* of *niet geweten* (de leerling gaf aan het niet te weten).
_Avoid_: score, resultaat, beoordeling

**Hulp**:
Wat de leerling kreeg vóór zijn antwoord, van meest naar minst zelfstandig: *vrij opgehaald* (zonder hulp, zelf getypt), *met hint* (zelf getypt na een aanwijzing), *herkend* (gekozen uit opties) of *na voorbeeld* (het antwoord of een uitgewerkt voorbeeld was getoond).
_Avoid_: ondersteuning, scaffolding, hulpniveau, geholpen

**Voortgangsstatus**:
De zichtbare samenvatting van wat het laatste bewijs over een leeritem aantoont: *nog aan het leren*, *zelf teruggehaald* of *later nog geweten*. Na een fout staat een leeritem weer op nog aan het leren; eerder bereikte statussen blijven in de geschiedenis.
_Avoid_: niveau, score, beheersing, herhaalstatus

**Herhaalplanning**:
Wanneer een leeritem weer aan de beurt is, en in welke fase van de herhaalintervallen het zit. Staat los van de voortgangsstatus.
_Avoid_: herhaalstatus, schema

**Sessie**:
Eén afgeronde oefenbeurt met een vooraf vastgestelde set leeritems en een zichtbaar eindpunt. Herhalingen die aan de beurt zijn gaan voor nieuwe leeritems.
_Avoid_: les, ronde, oefening

**Raadvraag**:
Een korte gok vóór de uitleg van een nieuw leeritem, om de aandacht te richten. De gok zelf is nooit een poging.
_Avoid_: pretest, voorkennistoets

**Toetsronde**:
Het begin van een sessie waarin leeritems in schoolvorm komen: zonder hulp, zonder nieuwe kans en met de uitslag pas aan het eind. Wat de leerling zo weet, heet *in toetsvorm geweten* en staat naast de voortgangsstatus.
_Avoid_: proeftoets, examen

**Reflectie**:
Het korte antwoord van de leerling aan het eind van een sessie over wat hielp. Het is zijn eigen ervaring en telt nooit als bewijs voor voortgang.
_Avoid_: evaluatie, feedback

**Strategie**:
Een leeraanpak die de leerling leert kiezen en zelfstandig gebruiken, ook buiten de app, zoals beeldassociatie of geheugenroute.
_Avoid_: aanpak, methode, leerstijl

**Geheugenbeeld**:
Een voorstelling die de leerling zelf bedenkt en aan één leeritem koppelt om het later terug te halen, zoals een wolk die aan een jas hangt voor *cloud*. Bestaat altijd uit een korte beschrijving in eigen woorden, eventueel aangevuld met emoji of een plaatje.
_Avoid_: associatie, ezelsbruggetje, geheugensteun

**Route**:
Een vaste reeks van enkele bekende plekken, met per plek één geheugenbeeld.
_Avoid_: geheugenpaleis, geheugenroute (dat is de strategie)

**Strategiestap**:
Hoe ver de leerling is met het zelfstandig kiezen en gebruiken van één strategie: *voorgedaan*, *met hulp gemaakt* (een beeld of route gemaakt met een steuntje van de app), *zelf gemaakt* (zonder dat steuntje), *zelf gekozen* (bij een latere bron zelf voor de strategie gekozen) of *zelfstandig toegepast* (zelf gekozen bij een nieuwe bron, en het werkte). Wordt per strategie gevolgd, los van de voortgangsstatus van leeritems; of de kennis later zonder hulpmiddel blijft, meet de voortgangsstatus.
_Avoid_: strategieniveau, zelfstandigheidsniveau

**Oefenvorm**:
Een vaste set leerregels voor hoe de app het oefenen met leerstof regelt en wat als poging telt. Er zijn er drie: beelden koppelen en geheugenroute (die elk een strategie oefenen) en ophaalmissie (die alleen controleert of de leerstof zonder steun wordt opgehaald).
_Avoid_: spelvorm, spel, game

**Thema**:
De verwisselbare aankleding van een oefenvorm, zoals ruimte of voetbal. Een thema verandert nooit wat er geleerd, beoordeeld of als voortgang geteld wordt.
_Avoid_: spelvorm, skin

**Begeleider**:
Iemand die voor een leerling in de begeleide stand de bron bevestigt en de instellingen beheert, zoals een ouder. Bestaat in het model, maar wordt in de eerste versie niet gebouwd.
_Avoid_: ouder, beheerder, accounthouder

**Stand**:
Wie bij een leerling de bron mag bevestigen en de instellingen beheert: *begeleid* (een begeleider) of *zelfstandig* (de leerling zelf).
_Avoid_: modus, niveau

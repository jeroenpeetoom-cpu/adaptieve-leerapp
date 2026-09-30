# 03: Aanwijzen oefenen

**What to build:** In een sessie vraagt de app "Waar ligt Antwerpen?" en de leerling tikt op de blinde kaart. Een tik dichtbij is goed, net ernaast is bijna met een richtingshint, en daarna licht de goede plek op. Toetsstof komt eerst, en binnen de toetsstof de grote dingen.

**Blocked by:** 15, 02

**Status:** ready-for-agent (gebouwd; wacht op controle op de S22)

- [x] Aanwijzen is een oefenrichting van een plek met een eigen leeritem, herhaalplanning en voortgang
- [x] Een tik is goed binnen een kleine cirkel rond het stipje (stad) of een grote cirkel rond de plek van de afkorting (water, gebied, land)
- [x] Binnen twee keer de afstand is het bijna: "Bijna! Iets meer naar het oosten" met één nieuwe kans met hulp met hint
- [x] Na het antwoord licht de goede plek op
- [x] Nieuwe plekken komen in de volgorde: toetsstof eerst (landen en zee, gebieden, rivieren, steden), daarna de extra plekken; bij herhalingen en de generale repetitie heeft de toetsstof voorrang
- [x] De kaart is in te zoomen
- [x] Leerlogicatests dekken de beoordeling van een tik en de richtingshint

Uitwerking:
- Straal: stad 3,5% van de kaartbreedte, water, gebied en land 9%; bijna tot twee keer de straal. De hoogte telt mee met de verhouding van de kaart.
- Hint (na een fout, of via Hulp): de ligging op de kaart in woorden ("in het zuidoosten van de kaart"); ankers volgen in ticket 05.
- Hulp: kiezen uit vier plekken (letters A tot D op de kaart, bij voorkeur van dezelfde soort) of laten zien waar het ligt.
- Een nieuwe plek die de leerling niet weet, krijgt een eenvoudig leermoment (de plek licht op); geheugenbeeld en ankers volgen in ticket 05.
- Benoemen-leeritems worden nog niet gemaakt (ticket 04).
- Op verzoek: nooit vanzelf inzoomen. Bij aanwijzen past de hele kaart onder de vraag en de knoppen in het scherm (vak van 56% van de schermhoogte); inzoomen met − en + schuift binnen dat vak, zodat de bovenkant altijd zichtbaar blijft. De uitsnede bij benoemen en het leermoment begint ook met de hele kaart.

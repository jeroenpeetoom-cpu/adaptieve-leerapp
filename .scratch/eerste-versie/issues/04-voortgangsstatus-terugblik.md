# 04: Voortgangsstatus en terugblik

**What to build:** De leerling ziet per leeritem of hij het nog aan het leren is, het zelf heeft teruggehaald, of het later nog wist. Aan het eind van een sessie toont het terugblikscherm wat zelf lukte en wat later terugkomt.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] De voortgangsstatus wordt berekend uit de pogingen op de huidige bronversie sinds de laatste fout of niet geweten, volgens de specificatie
- [ ] Later nog geweten: vrij opgehaald goed op minstens twee verschillende dagen, de laatste minstens 7 dagen na de allereerste poging
- [ ] Bijna en goede antwoorden met hulp zijn geen bewijs, en zetten de status ook niet terug
- [ ] Na een fout staat het leeritem op nog aan het leren; de terugblik toont dat het eerder al een hogere status had
- [ ] Leerlogicatests dekken de statusovergangen met de instelbare klok

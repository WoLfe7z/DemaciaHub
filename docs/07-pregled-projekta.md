# Pregled projekta DemaciaHub

## 1. Implementirane funkcionalnosti za MVP

| Št. | Funkcionalnost | Stanje | Opomba |
| --- | -------------- | ------ | ------ |
| 1 | Registracija in prijava uporabnikov | Implementirano | Express session, pomanjkljivosti (napisane spodaj) |
| 2 | Ustvarjanje ekip in povabila soigralcem | Implementirano | Povabilo je mogoče samo sprejeti, zavrnitve ni. |
| 3 | Ustvarjanje turnirjev | Implementirano | Validacija polj, datuma in števila ekip. |
| 4 | Prijavljanje ekip na turnirje | Implementirano | Samo kapetan, natanko 5 članov, brez dvojne prijave. |
| 5 | Potrjevanje pripravljenosti (lock-in) | Implementirano | Okno 2 uri pred začetkom turnirja. |
| 6 | Samodejno generiranje bracketa | Implementirano | Single elimination, 2 do 8 potrjenih ekip, prosti prehodi (bye). |
| 7 | Beleženje rezultatov in posodobitev bracketa | Implementirano | Zmagovalec napreduje, finale zaključi turnir. |
| 13 | Iskanje turnirjev po imenu | **Ni implementirano** | Iskalno polje obstaja v `tournaments.html`, vendar ni povezano z logiko (niti na frontendu niti v API-ju). |

Funkcionalnosti 8–12 in 14–16 niso del MVP. Socket.IO je naveden v ADR-ju 0006 le kot načrt za prihodnost in ni uporabljen.

## 2. Ali implementirane funkcionalnosti zadoščajo uporabniškim zgodbam

### US-01: Registracija in prijava uporabnikov: delno zadošča

- Registracija z uporabniškim imenom, e-pošto in geslom deluje.
- Podvojeno uporabniško ime ali e-pošta je prepreženo z unikatnim indeksom v bazi, vendar uporabnik dobi napako 500 z internim sporočilom namesto razumljivega obvestila. Rezultat preverjanja obstoječega uporabnika v kodi ni uporabljen.
- Prijava ustvari sejo, napačni podatki vrnejo sporočilo o napaki (401).
- Varnostna pomanjkljivost: gesla so v bazi shranjena in primerjana v navadnem besedilu
- Odgovori ob manjkajočih poljih so nedosledni (status 200 z navadnim besedilom).

### US-02: Ustvarjanje ekip in povabila soigralcem: delno zadošča

- Ustvarjalec ekipe samodejno postane kapetan.
- Uporabnik, ki je že član ekipe, ne more ustvariti nove ekipe.
- Povabilo lahko pošlje samo kapetan in samo uporabniku, ki še nima ekipe.
- Manjka: ob pošiljanju in sprejemu povabila se ne preveri, da ekipa še nima 5 članov, kar zahteva četrti kriterij.

### US-04: Prijavljanje ekip na turnirje: zadošča

- Prijavi lahko samo kapetan, ekipa mora imeti natanko 5 članov.
- Dvojna prijava je preprečena (pregled in unikatni indeks), prav tako prijava na že zapolnjen turnir.
- Prijave se zaprejo 2 uri pred začetkom turnirja. To je razumna odločitev v skladu z lock-in fazo, vendar zgodba tega ne omenja.

### US-05: Potrjevanje pripravljenosti ekip (lock-in): zadošča

- Potrditev je mogoča samo v zadnjih 2 urah pred začetkom turnirja.
- Potrdi jo lahko samo kapetan prijavljene ekipe, status prijave se spremeni v `confirmed`.
- V bracket se vključijo samo ekipe s statusom `confirmed`.

### US-07: Beleženje rezultatov in samodejna posodobitev bracketa: zadošča

- Rezultat lahko vnese organizator ali administrator turnirja.
- Zmagovalec mora biti ena od ekip v tekmi, tekma se označi kot zaključena.
- Zmagovalec se samodejno vpiše v ustrezno mesto naslednje tekme (`nextMatchId`, `nextMatchSlot`).
- Ob zaključku finalne tekme se turnir označi kot `completed`.

## 3. Povzetek

Jedro MVP (US-01 do US-07) je delujoče in pokriva potek od registracije do zmagovalca turnirja. Manjka edino: zgoščevanje gesel (US-01), sporočilo ob podvojeni registraciji (US-01), zavrnitev povabila in omejitev na 5 članov (US-02) ter implementirati iskanje turnirjev (US-13).
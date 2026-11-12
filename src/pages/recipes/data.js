/*
 * Przepisy podpowiadane w zakładce „Przepisy”.
 *
 * Jeden przepis to jedna linia:  posiłek | cechy | minuty | nazwa | składniki | wykonanie
 *   posiłek:    b – śniadanie, d – obiad, s – kolacja, n – na szybko
 *   cechy:      kod kuchni (patrz CUISINES) i/lub „v” dla dań bez mięsa i ryb, po przecinku
 *   składniki:  „Nazwa do listy zakupów:ilość”, rozdzielone średnikami
 */
import { plain } from '../../core/format.js';

export const MEALS = [
  { id: 'b', question: 'Co zjeść na śniadanie?', title: 'Na śniadanie' },
  { id: 'd', question: 'Co zjeść na obiad?', title: 'Na obiad' },
  { id: 's', question: 'Co zjeść na kolację?', title: 'Na kolację' },
  { id: 'n', question: 'Co zjeść na szybko?', title: 'Na szybko' },
];

export const CUISINES = {
  pl: 'kuchnia polska', it: 'włoska', az: 'azjatycka', in: 'indyjska', mx: 'meksykańska',
  sr: 'śródziemnomorska', am: 'amerykańska', fr: 'francuska',
};

const LINES = `
b|pl,v|10|Jajecznica na maśle z pomidorami|Jajka:3 szt.;Masło:1 łyżka;Pomidory:1 szt.;Chleb:2 kromki;Szczypiorek:do posypania|Rozpuść masło na patelni, wbij jajka i mieszaj na małym ogniu, aż się zetną. Podaj z pomidorem, chlebem i szczypiorkiem.
b|v|10|Owsianka z bananem i orzechami|Płatki owsiane:50 g;Mleko:250 ml;Banany:1 szt.;Orzechy:garść;Miód:1 łyżeczka|Gotuj płatki w mleku około 5 minut, mieszając. Dodaj pokrojonego banana, orzechy i miód.
b|pl,v|10|Kanapki z twarożkiem i rzodkiewką|Chleb:3 kromki;Twaróg:150 g;Jogurt naturalny:2 łyżki;Rzodkiewka:pół pęczka;Szczypiorek:do smaku|Rozgnieć twaróg z jogurtem, dodaj pokrojoną rzodkiewkę i szczypiorek, dopraw solą i pieprzem. Nałóż na chleb.
b||10|Omlet z serem i szynką|Jajka:3 szt.;Ser żółty:2 plastry;Szynka:2 plastry;Masło:1 łyżeczka;Papryka:pół sztuki|Roztrzep jajka i wylej na rozgrzane masło. Gdy się zetną, połóż ser, szynkę i paprykę, złóż omlet na pół.
b|v|5|Jogurt z owocami i płatkami|Jogurt naturalny:200 g;Płatki owsiane:3 łyżki;Jabłka:1 szt.;Banany:1 szt.;Miód:1 łyżeczka|Pokrój owoce, wymieszaj z jogurtem i płatkami, polej miodem.
b|v|15|Tosty z awokado i jajkiem|Chleb:2 kromki;Awokado:1 szt.;Jajka:2 szt.;Cytryna:kilka kropel;Pomidory:1 szt.|Opiecz chleb, rozgnieć awokado z sokiem z cytryny i rozsmaruj. Na wierzch połóż jajko sadzone i plasterki pomidora.
b|pl|15|Jajka sadzone na boczku|Jajka:3 szt.;Boczek:4 plastry;Chleb:2 kromki;Pomidory:1 szt.|Wysmaż boczek na chrupko, wbij obok jajka i smaż, aż białko się zetnie. Podaj z chlebem i pomidorem.
b|sr,v|25|Szakszuka|Jajka:3 szt.;Pomidory krojone w puszce:1 puszka;Papryka:1 szt.;Cebula:1 szt.;Czosnek:2 ząbki;Chleb:do podania|Podsmaż cebulę, czosnek i paprykę, dodaj pomidory i duś 10 minut z kuminem i papryką. Zrób wgłębienia, wbij jajka i trzymaj pod przykryciem, aż się zetną.
b|am,v|20|Pancakes z borówkami i syropem klonowym|Mąka:1 szklanka;Mleko:1 szklanka;Jajka:1 szt.;Proszek do pieczenia:1 łyżeczka;Borówki:garść;Syrop klonowy:do polania|Wymieszaj mąkę, proszek, mleko i jajko na gęste ciasto. Smaż małe, grube placki z obu stron, podaj z borówkami i syropem.
b|fr,v|15|Tosty francuskie z cynamonem|Chałka:4 kromki;Jajka:2 szt.;Mleko:100 ml;Masło:1 łyżka;Cynamon:szczypta;Dżem:do podania|Roztrzep jajka z mlekiem i cynamonem, namocz w tym kromki chałki i usmaż na maśle na złoto. Podaj z dżemem.
b|pl,v|20|Racuchy z jabłkami|Mąka:1,5 szklanki;Kefir:1 szklanka;Jajka:1 szt.;Jabłka:2 szt.;Proszek do pieczenia:1 łyżeczka;Cukier:do posypania|Wymieszaj mąkę, kefir, jajko i proszek, dodaj pokrojone jabłka. Smaż nieduże placki na oleju, posyp cukrem.
b|v|5|Pudding chia z malinami|Nasiona chia:3 łyżki;Mleko kokosowe:200 ml;Maliny:garść;Miód:1 łyżeczka|Wymieszaj chia z mlekiem i miodem, odstaw na noc do lodówki. Rano dodaj maliny.
b|v|5|Granola z jogurtem i borówkami|Granola:4 łyżki;Jogurt naturalny:200 g;Borówki:garść;Miód:1 łyżeczka|Przełóż jogurt do miski, posyp granolą i borówkami, polej miodem.
b|pl,v|15|Pasta jajeczna ze szczypiorkiem|Jajka:4 szt.;Majonez:2 łyżki;Szczypiorek:pół pęczka;Chleb:3 kromki|Ugotuj jajka na twardo, posiekaj i wymieszaj z majonezem i szczypiorkiem. Dopraw i nałóż na chleb.
b|am|10|Bajgiel z łososiem i serkiem|Bajgle:1 szt.;Łosoś wędzony:60 g;Serek śmietankowy:2 łyżki;Ogórki:kilka plastrów;Koperek:do posypania|Przekrój i opiecz bajgla, posmaruj serkiem, ułóż łososia, ogórek i koperek.
b|v|10|Smoothie bowl z malinami|Banany:1 szt.;Maliny:100 g;Jogurt naturalny:150 g;Granola:2 łyżki;Nasiona chia:1 łyżeczka|Zmiksuj banana, maliny i jogurt na gęsty mus. Przelej do miski, posyp granolą i chia.
b|mx|15|Burrito śniadaniowe|Tortille:1 szt.;Jajka:2 szt.;Fasola czerwona:pół puszki;Ser żółty:2 plastry;Awokado:pół sztuki;Salsa:2 łyżki|Usmaż jajecznicę, podgrzej fasolę. Ułóż wszystko na tortilli z serem, awokado i salsą, ciasno zwiń.
b|pl|10|Kanapki z pastą z makreli|Makrela wędzona:1 szt.;Twaróg:100 g;Cebula:pół sztuki;Chleb:3 kromki;Ogórki kiszone:2 szt.|Rozdrobnij makrelę widelcem, wymieszaj z twarogiem i drobno posiekaną cebulą. Nałóż na chleb, podaj z ogórkiem.
b|it,v|10|Tost caprese|Chleb:2 kromki;Mozzarella:1 kulka;Pomidory:1 szt.;Bazylia:kilka listków;Oliwa:1 łyżka|Opiecz chleb, ułóż plastry mozzarelli i pomidora, dodaj bazylię i skrop oliwą.
b|v|15|Omlet ze szpinakiem i fetą|Jajka:3 szt.;Szpinak:garść;Ser feta:50 g;Masło:1 łyżeczka|Podsmaż szpinak na maśle, wlej roztrzepane jajka. Gdy się zetną, posyp fetą i złóż na pół.
b|pl,v|15|Kasza manna z malinami|Kasza manna:4 łyżki;Mleko:400 ml;Maliny:garść;Masło:1 łyżeczka;Cukier:1 łyżka|Zagotuj mleko, wsyp kaszę i mieszaj 3–4 minuty, aż zgęstnieje. Dodaj masło i cukier, podaj z malinami.
b|sr,v|15|Jajka po turecku z jogurtem|Jajka:2 szt.;Jogurt naturalny:200 g;Czosnek:1 ząbek;Masło:1 łyżka;Papryka słodka mielona:pół łyżeczki;Chleb:do podania|Wymieszaj jogurt z czosnkiem. Ułóż na nim jajka w koszulkach i polej masłem roztopionym z papryką.
b|v|10|Tost z masłem orzechowym i bananem|Chleb tostowy:2 kromki;Masło orzechowe:2 łyżki;Banany:1 szt.;Miód:1 łyżeczka|Opiecz chleb, posmaruj masłem orzechowym, ułóż plasterki banana i polej miodem.
b|v|20|Jaglanka z jabłkiem i cynamonem|Kasza jaglana:60 g;Mleko:300 ml;Jabłka:1 szt.;Cynamon:szczypta;Orzechy:garść|Przepłucz kaszę wrzątkiem i gotuj w mleku 15 minut. Dodaj starte jabłko, cynamon i orzechy.
b|az,v|15|Tamagoyaki – japoński omlet z ryżem|Jajka:3 szt.;Sos sojowy:1 łyżeczka;Cukier:1 łyżeczka;Ryż:100 g;Szczypiorek:do posypania|Roztrzep jajka z sosem sojowym i cukrem. Smaż cienkimi warstwami, każdą zwijając w rulon. Pokrój i podaj z ryżem.
b|pl,v|5|Twarożek na słodko z miodem i orzechami|Twaróg:200 g;Jogurt naturalny:3 łyżki;Miód:1 łyżka;Orzechy:garść;Chleb:2 kromki|Rozetrzyj twaróg z jogurtem i miodem, posyp orzechami. Zjedz z chlebem lub samo.
b|mx,v|15|Huevos rancheros|Tortille:2 szt.;Jajka:2 szt.;Fasola czerwona:pół puszki;Salsa:3 łyżki;Awokado:pół sztuki;Kolendra:do posypania|Podgrzej tortille i fasolę. Na tortilli ułóż fasolę, jajko sadzone, salsę i awokado, posyp kolendrą.
b|mx,v|10|Quesadilla z jajkiem i serem|Tortille:1 szt.;Jajka:2 szt.;Ser żółty:3 plastry;Szczypiorek:do posypania|Usmaż jajecznicę, rozłóż z serem na połowie tortilli, złóż i podpiecz na suchej patelni z obu stron.
d||30|Kurczak z ryżem i warzywami|Pierś z kurczaka:400 g;Ryż:200 g;Papryka:1 szt.;Cukinia:1 szt.;Cebula:1 szt.;Czosnek:2 ząbki|Ugotuj ryż. Pokrojonego kurczaka podsmaż z cebulą i czosnkiem, dodaj paprykę i cukinię, duś 10 minut. Podaj z ryżem.
d|it,v|20|Makaron z sosem pomidorowym|Makaron:250 g;Pomidory krojone w puszce:1 puszka;Cebula:1 szt.;Czosnek:2 ząbki;Parmezan:do posypania;Oliwa:2 łyżki|Zeszklij cebulę i czosnek na oliwie, dodaj pomidory i gotuj 10 minut. Wymieszaj z makaronem i posyp parmezanem.
d|pl|40|Zupa pomidorowa z makaronem|Kurczak:300 g;Marchew:2 szt.;Pietruszka:1 szt.;Koncentrat pomidorowy:3 łyżki;Makaron:150 g;Śmietana:3 łyżki|Ugotuj wywar z kurczaka, marchwi i pietruszki (30 minut). Dodaj koncentrat, zabiel śmietaną i podaj z makaronem.
d|pl|45|Kotlety mielone z ziemniakami i surówką|Mięso mielone:500 g;Jajka:1 szt.;Bułka tarta:4 łyżki;Cebula:1 szt.;Ziemniaki:1 kg;Kapusta:ćwiartka;Marchew:1 szt.|Wymieszaj mięso z jajkiem, startą cebulą i połową bułki, uformuj kotlety, obtocz w bułce i usmaż. Podaj z ziemniakami i surówką.
d||30|Łosoś z piekarnika z ziemniakami i brokułem|Łosoś:2 filety;Ziemniaki:600 g;Brokuł:1 szt.;Cytryna:pół sztuki;Masło:1 łyżka|Łososia skrop cytryną i piecz 15 minut w 190°C. W tym czasie ugotuj ziemniaki i brokuł, podaj z masłem.
d|pl|30|Leczo z kiełbasą|Kiełbasa:300 g;Papryka:3 szt.;Cukinia:1 szt.;Cebula:2 szt.;Pomidory krojone w puszce:1 puszka;Chleb:do podania|Podsmaż kiełbasę z cebulą, dodaj paprykę i cukinię, po 5 minutach pomidory. Duś 15 minut pod przykryciem.
d|az|20|Makaron udon z kurczakiem i warzywami|Makaron udon:400 g;Pierś z kurczaka:250 g;Kapusta pekińska:ćwiartka;Marchew:1 szt.;Sos sojowy:3 łyżki;Imbir:kawałek 2 cm;Czosnek:2 ząbki;Szczypiorek:do posypania|Podsmaż kurczaka z czosnkiem i imbirem na mocnym ogniu, dodaj marchew i kapustę. Wrzuć ugotowany udon, polej sosem sojowym i smaż 2 minuty.
d|az|25|Pad thai z krewetkami|Makaron ryżowy:200 g;Krewetki:200 g;Jajka:2 szt.;Marchew:1 szt.;Orzeszki ziemne:garść;Sos sojowy:3 łyżki;Limonka:1 szt.;Szczypiorek:do posypania|Namocz makaron. Podsmaż krewetki, odsuń na bok i zetnij jajka. Dodaj makaron, marchew, sos sojowy i sok z limonki, posyp orzeszkami.
d|in|35|Curry z kurczakiem i mlekiem kokosowym|Pierś z kurczaka:400 g;Mleko kokosowe:1 puszka;Pasta curry:2 łyżki;Cebula:1 szt.;Papryka:1 szt.;Ryż:200 g;Kolendra:do posypania|Podsmaż cebulę z pastą curry, dodaj kurczaka i paprykę. Wlej mleko kokosowe i gotuj 15 minut. Podaj z ryżem i kolendrą.
d|in,v|30|Dal z czerwonej soczewicy|Soczewica czerwona:200 g;Mleko kokosowe:1 puszka;Pomidory krojone w puszce:1 puszka;Cebula:1 szt.;Czosnek:2 ząbki;Imbir:kawałek 2 cm;Ryż:200 g|Podsmaż cebulę, czosnek i imbir z kurkumą i kuminem. Dodaj soczewicę, pomidory i mleko kokosowe, gotuj 20 minut. Podaj z ryżem.
d|it|25|Spaghetti carbonara|Makaron spaghetti:250 g;Boczek:150 g;Jajka:3 szt.;Parmezan:50 g|Wysmaż boczek. Wymieszaj żółtka z parmezanem i pieprzem. Gorący makaron połącz z boczkiem, zdejmij z ognia i szybko wmieszaj jajka.
d|it|35|Spaghetti bolognese|Makaron spaghetti:250 g;Mięso mielone:400 g;Pomidory krojone w puszce:1 puszka;Cebula:1 szt.;Marchew:1 szt.;Czosnek:2 ząbki;Parmezan:do posypania|Podsmaż cebulę, marchew i czosnek, dodaj mięso i zrumień. Wlej pomidory i duś 20 minut. Podaj z makaronem i parmezanem.
d|it,v|30|Risotto z pieczarkami|Ryż arborio:200 g;Pieczarki:300 g;Cebula:1 szt.;Bulion warzywny:750 ml;Parmezan:40 g;Masło:1 łyżka|Podsmaż cebulę i pieczarki, dodaj ryż. Dolewaj po trochu gorący bulion, mieszając, aż ryż zmięknie. Na koniec wmieszaj masło i parmezan.
d|it,v|15|Gnocchi z pesto i pomidorkami|Gnocchi:500 g;Pesto:3 łyżki;Pomidorki koktajlowe:200 g;Parmezan:do posypania|Ugotuj gnocchi, aż wypłyną. Wymieszaj z pesto i przekrojonymi pomidorkami, posyp parmezanem.
d|pl|50|Schabowy z ziemniakami i mizerią|Schab:4 plastry;Jajka:1 szt.;Bułka tarta:5 łyżek;Ziemniaki:800 g;Ogórki:2 szt.;Śmietana:3 łyżki;Koperek:do posypania|Rozbij schab, obtocz w jajku i bułce, usmaż na złoto. Podaj z ziemniakami i mizerią z ogórków ze śmietaną i koperkiem.
d|pl,v|15|Pierogi ruskie z cebulką|Pierogi ruskie:500 g;Cebula:1 szt.;Masło:1 łyżka;Śmietana:do podania|Ugotuj pierogi. Cebulę pokrój w kostkę i zeszklij na maśle, polej pierogi. Podaj ze śmietaną.
d|pl|90|Gulasz wieprzowy z kaszą gryczaną|Łopatka wieprzowa:500 g;Cebula:2 szt.;Papryka:1 szt.;Koncentrat pomidorowy:2 łyżki;Kasza gryczana:200 g;Ogórki kiszone:do podania|Obsmaż mięso w kostce, dodaj cebulę, paprykę, koncentrat i wodę. Duś ponad godzinę, aż mięso zmięknie. Podaj z kaszą i ogórkiem.
d|pl|60|Rosół z makaronem|Kurczak:600 g;Marchew:2 szt.;Pietruszka:1 szt.;Seler:kawałek;Por:1 szt.;Makaron:200 g|Zalej mięso i warzywa zimną wodą, gotuj na małym ogniu godzinę, nie dopuszczając do wrzenia. Podaj z makaronem i natką.
d|pl,v|35|Placki ziemniaczane ze śmietaną|Ziemniaki:1 kg;Cebula:1 szt.;Jajka:1 szt.;Mąka:2 łyżki;Śmietana:do podania|Zetrzyj ziemniaki i cebulę, odciśnij, wymieszaj z jajkiem i mąką. Smaż cienkie placki na złoto, podaj ze śmietaną.
d|pl|45|Żurek z kiełbasą i jajkiem|Zakwas na żurek:500 ml;Kiełbasa:300 g;Ziemniaki:3 szt.;Jajka:2 szt.;Czosnek:2 ząbki;Śmietana:2 łyżki;Chleb:do podania|Ugotuj ziemniaki z kiełbasą, wlej zakwas, dodaj czosnek i majeranek, gotuj 10 minut. Zabiel śmietaną, podaj z jajkiem na twardo.
d|pl,v|45|Kopytka z sosem pieczarkowym|Ziemniaki:700 g;Mąka:200 g;Jajka:1 szt.;Pieczarki:300 g;Cebula:1 szt.;Śmietana:150 ml|Ugotowane ziemniaki przeciśnij, zagnieć z mąką i jajkiem, uformuj kopytka i ugotuj. Podaj z pieczarkami duszonymi z cebulą i śmietaną.
d|mx|30|Chili con carne|Mięso mielone:400 g;Fasola czerwona:1 puszka;Kukurydza:pół puszki;Pomidory krojone w puszce:1 puszka;Cebula:1 szt.;Papryka:1 szt.;Ryż:200 g|Podsmaż mięso z cebulą i papryką, dopraw chili i kuminem. Dodaj pomidory, fasolę i kukurydzę, gotuj 15 minut. Podaj z ryżem.
d|mx|25|Tacos z kurczakiem|Tortille:6 szt.;Pierś z kurczaka:300 g;Awokado:1 szt.;Pomidory:2 szt.;Cebula:pół sztuki;Limonka:1 szt.;Kolendra:do posypania;Ser żółty:50 g|Usmaż kurczaka w przyprawach i pokrój. Podawaj w podgrzanych tortillach z awokado, pomidorem, cebulą, kolendrą i sokiem z limonki.
d|am|30|Burgery wołowe z frytkami|Wołowina mielona:400 g;Bułki do burgerów:2 szt.;Ser żółty:2 plastry;Sałata:kilka liści;Pomidory:1 szt.;Cebula:pół sztuki;Frytki:300 g;Ketchup:do podania|Uformuj z mięsa dwa kotlety, usmaż po 3–4 minuty z każdej strony i połóż ser. Złóż burgery z warzywami, podaj z upieczonymi frytkami.
d|az|25|Kurczak teriyaki z ryżem i brokułem|Pierś z kurczaka:400 g;Sos teriyaki:4 łyżki;Ryż:200 g;Brokuł:1 szt.;Sezam:do posypania|Usmaż kurczaka, wlej sos teriyaki i redukuj, aż oblepi mięso. Podaj z ryżem i ugotowanym brokułem, posyp sezamem.
d|az,v|20|Smażony ryż z jajkiem i warzywami|Ryż:200 g;Jajka:2 szt.;Marchew:1 szt.;Groszek mrożony:100 g;Sos sojowy:2 łyżki;Czosnek:2 ząbki;Szczypiorek:do posypania|Na mocnym ogniu podsmaż czosnek, marchew i groszek. Dodaj ugotowany, wystudzony ryż, odsuń na bok i zetnij jajka. Wymieszaj z sosem sojowym.
d|az|30|Ramen z kurczakiem i jajkiem|Makaron ramen:200 g;Bulion drobiowy:1 l;Pierś z kurczaka:250 g;Jajka:2 szt.;Pieczarki:150 g;Sos sojowy:2 łyżki;Szczypiorek:do posypania|Zagotuj bulion z sosem sojowym i pieczarkami. Ugotuj w nim kurczaka i pokrój. Podaj z makaronem, jajkiem na miękko i szczypiorkiem.
d|az,v|25|Tofu w sosie słodko-kwaśnym z ryżem|Tofu:200 g;Papryka:1 szt.;Ananas w puszce:pół puszki;Sos słodko-kwaśny:150 ml;Cebula:1 szt.;Ryż:200 g|Obsmaż tofu w kostce na chrupko. Podsmaż cebulę i paprykę, dodaj ananasa, sos i tofu. Podaj z ryżem.
d|sr|50|Kurczak pieczony z ziemniakami i cytryną|Udka z kurczaka:4 szt.;Ziemniaki:800 g;Cytryna:1 szt.;Czosnek:4 ząbki;Oliwa:3 łyżki;Oregano:1 łyżeczka|Ułóż udka i ziemniaki w naczyniu, polej oliwą i sokiem z cytryny, dodaj czosnek i oregano. Piecz 45 minut w 200°C.
d|it,v|45|Zapiekanka z bakłażana i mozzarelli|Bakłażan:2 szt.;Passata pomidorowa:500 ml;Mozzarella:2 kulki;Parmezan:40 g;Bazylia:kilka listków|Plastry bakłażana obsmaż lub upiecz. Układaj warstwami z passatą, mozzarellą i bazylią, posyp parmezanem. Piecz 25 minut w 190°C.
d|v|30|Krem z dyni z mlekiem kokosowym|Dynia:800 g;Mleko kokosowe:pół puszki;Cebula:1 szt.;Imbir:kawałek 2 cm;Bulion warzywny:500 ml;Pestki dyni:do posypania|Podsmaż cebulę i imbir, dodaj dynię w kostce i bulion, gotuj 20 minut. Zmiksuj z mlekiem kokosowym, posyp pestkami.
d|fr,v|40|Ratatouille z ryżem|Bakłażan:1 szt.;Cukinia:1 szt.;Papryka:2 szt.;Pomidory krojone w puszce:1 puszka;Cebula:1 szt.;Czosnek:3 ząbki;Ryż:200 g|Podsmaż cebulę i czosnek, dodaj pokrojone warzywa i pomidory. Duś 25 minut z ziołami prowansalskimi. Podaj z ryżem.
d|pl|35|Dorsz smażony z ziemniakami i surówką|Dorsz:2 filety;Mąka:2 łyżki;Ziemniaki:600 g;Kapusta kiszona:300 g;Marchew:1 szt.;Cytryna:pół sztuki|Obtocz dorsza w mące i usmaż po 3 minuty z każdej strony. Podaj z ziemniakami i surówką z kapusty kiszonej z marchewką.
d|it|60|Lasagne bolognese|Makaron lasagne:9 płatów;Mięso mielone:500 g;Passata pomidorowa:500 ml;Mleko:500 ml;Masło:2 łyżki;Mąka:2 łyżki;Mozzarella:1 kulka|Usmaż mięso i duś z passatą 15 minut. Zrób beszamel z masła, mąki i mleka. Układaj warstwami z płatami, przykryj mozzarellą, piecz 35 minut w 180°C.
d|sr,v|25|Kuskus z pieczonymi warzywami i fetą|Kuskus:200 g;Cukinia:1 szt.;Papryka:1 szt.;Cebula:1 szt.;Ser feta:100 g;Oliwa:2 łyżki;Cytryna:pół sztuki|Upiecz warzywa w kostce z oliwą (20 minut, 200°C). Zalej kuskus wrzątkiem, wymieszaj z warzywami, fetą i sokiem z cytryny.
d|az|30|Wołowina z brokułem po chińsku|Wołowina:300 g;Brokuł:1 szt.;Sos sojowy:3 łyżki;Czosnek:2 ząbki;Imbir:kawałek 2 cm;Ryż:200 g|Cienko pokrojoną wołowinę obsmaż na mocnym ogniu z czosnkiem i imbirem. Dodaj podgotowany brokuł i sos sojowy. Podaj z ryżem.
d|in,v|30|Curry z ciecierzycą i szpinakiem|Ciecierzyca w puszce:1 puszka;Szpinak:200 g;Pomidory krojone w puszce:1 puszka;Cebula:1 szt.;Pasta curry:2 łyżki;Ryż:200 g|Podsmaż cebulę z pastą curry, dodaj pomidory i ciecierzycę, gotuj 15 minut. Na koniec wmieszaj szpinak. Podaj z ryżem.
s|sr,v|10|Sałatka grecka|Pomidory:2 szt.;Ogórki:1 szt.;Papryka:1 szt.;Ser feta:150 g;Oliwki:garść;Cebula:pół sztuki;Oliwa:2 łyżki|Pokrój warzywa w grubą kostkę, dodaj oliwki i fetę, polej oliwą i dopraw oregano.
s|mx|20|Tortilla z kurczakiem i warzywami|Tortille:2 szt.;Pierś z kurczaka:200 g;Sałata:kilka liści;Pomidory:1 szt.;Jogurt naturalny:3 łyżki;Ser żółty:2 plastry|Usmaż pokrojonego kurczaka. Na tortilli rozłóż sałatę, pomidora, ser i mięso, polej jogurtem z przyprawami i zwiń.
s|pl,v|20|Zapiekanki z pieczarkami|Bagietka:1 szt.;Pieczarki:250 g;Cebula:1 szt.;Ser żółty:100 g;Ketchup:do polania|Podsmaż pieczarki z cebulą, nałóż na przekrojoną bagietkę, posyp serem i zapiekaj 10 minut w 200°C. Polej ketchupem.
s|pl,v|30|Naleśniki z twarogiem|Mąka:1 szklanka;Mleko:1,5 szklanki;Jajka:2 szt.;Twaróg:250 g;Dżem:do podania|Zmiksuj mąkę, mleko i jajka, usmaż cienkie naleśniki. Posmaruj twarogiem roztartym z odrobiną cukru, zwiń i podaj z dżemem.
s||15|Kanapki na ciepło z tuńczykiem|Chleb tostowy:4 kromki;Tuńczyk:1 puszka;Ser żółty:4 plastry;Kukurydza:pół puszki;Majonez:1 łyżka|Wymieszaj tuńczyka z kukurydzą i majonezem, nałóż na chleb, przykryj serem i zapiekaj, aż ser się roztopi.
s|v|30|Krem z brokułów z grzankami|Brokuł:1 szt.;Ziemniaki:2 szt.;Cebula:1 szt.;Śmietana:3 łyżki;Chleb:2 kromki|Ugotuj warzywa w osolonej wodzie do miękkości, zmiksuj i dodaj śmietanę. Podaj z grzankami z podsmażonego chleba.
s|it,v|15|Bruschetta z pomidorami|Bagietka:pół sztuki;Pomidory:3 szt.;Czosnek:1 ząbek;Bazylia:kilka listków;Oliwa:2 łyżki|Opiecz kromki bagietki i natrzyj czosnkiem. Nałóż pokrojone pomidory wymieszane z oliwą i bazylią.
s|it,v|10|Sałatka caprese z pesto|Mozzarella:2 kulki;Pomidory:3 szt.;Pesto:2 łyżki;Bazylia:kilka listków;Bagietka:do podania|Ułóż na przemian plastry mozzarelli i pomidora, polej pesto i udekoruj bazylią. Podaj z pieczywem.
s||20|Sałatka cezar z kurczakiem|Sałata rzymska:1 szt.;Pierś z kurczaka:250 g;Parmezan:30 g;Grzanki:garść;Sos cezar:3 łyżki|Usmaż i pokrój kurczaka. Wymieszaj porwaną sałatę z sosem, dodaj mięso, grzanki i płatki parmezanu.
s|mx,v|15|Quesadilla z serem i fasolą|Tortille:2 szt.;Ser żółty:100 g;Fasola czerwona:pół puszki;Kukurydza:3 łyżki;Salsa:do podania|Na tortilli rozłóż ser, fasolę i kukurydzę, przykryj drugą. Podpiecz na suchej patelni z obu stron, pokrój w trójkąty.
s|sr,v|15|Pita z falafelem i warzywami|Chleb pita:2 szt.;Falafel:6 szt.;Hummus:3 łyżki;Pomidory:1 szt.;Ogórki:1 szt.;Sałata:kilka liści|Podgrzej falafele i pity. Posmaruj wnętrze pity hummusem, włóż falafele i pokrojone warzywa.
s|az,v|15|Zupa miso z tofu|Pasta miso:2 łyżki;Tofu:150 g;Makaron ryżowy:100 g;Wodorosty wakame:1 łyżka;Szczypiorek:do posypania|Zagotuj wodę, zdejmij z ognia i rozpuść w niej pastę miso. Dodaj tofu w kostce, wakame i ugotowany makaron, posyp szczypiorkiem.
s|pl|25|Śledź w śmietanie z ziemniakami|Śledzie:4 płaty;Śmietana:200 ml;Cebula:1 szt.;Jabłka:1 szt.;Ziemniaki:500 g|Pokrój śledzie, wymieszaj ze śmietaną, cebulą i startym jabłkiem. Podaj z ziemniakami ugotowanymi w mundurkach.
s|it,v|15|Pizza na tortilli|Tortille:2 szt.;Passata pomidorowa:4 łyżki;Mozzarella:1 kulka;Pieczarki:4 szt.;Oregano:szczypta|Posmaruj tortille passatą, ułóż mozzarellę i plasterki pieczarek, posyp oregano. Piecz 8 minut w 220°C.
s|sr,v|15|Tabbouleh z kuskusem|Kuskus:150 g;Pomidory:2 szt.;Ogórki:1 szt.;Natka pietruszki:pęczek;Cytryna:1 szt.;Oliwa:2 łyżki|Zalej kuskus wrzątkiem i odstaw na 5 minut. Wymieszaj z drobno pokrojonymi warzywami, natką, sokiem z cytryny i oliwą.
s|az|20|Sałatka z makaronem ryżowym i krewetkami|Makaron ryżowy:150 g;Krewetki:200 g;Marchew:1 szt.;Ogórki:1 szt.;Limonka:1 szt.;Sos sojowy:2 łyżki;Orzeszki ziemne:garść|Namocz makaron, usmaż krewetki. Wymieszaj z warzywami pokrojonymi w paski, polej sosem sojowym z sokiem z limonki, posyp orzeszkami.
s|pl,v|30|Ziemniaki z gzikiem|Ziemniaki:600 g;Twaróg:250 g;Śmietana:3 łyżki;Szczypiorek:pół pęczka;Rzodkiewka:pół pęczka|Ugotuj ziemniaki w mundurkach. Rozetrzyj twaróg ze śmietaną, dodaj szczypiorek i rzodkiewkę, dopraw. Podaj razem.
s|fr|15|Croque monsieur|Chleb tostowy:4 kromki;Szynka:4 plastry;Ser żółty:4 plastry;Masło:1 łyżka;Musztarda:1 łyżeczka|Złóż kanapki z szynką, serem i musztardą, posmaruj z wierzchu masłem i zapiecz lub usmaż z obu stron na złoto.
s|it,v|25|Frittata z cukinią i papryką|Jajka:5 szt.;Cukinia:1 szt.;Papryka:1 szt.;Cebula:1 szt.;Ser feta:80 g|Podsmaż warzywa, zalej roztrzepanymi jajkami, posyp fetą. Smaż pod przykryciem na małym ogniu, aż wierzch się zetnie.
s|sr|10|Sałatka z tuńczykiem i białą fasolą|Tuńczyk:1 puszka;Fasola biała:1 puszka;Cebula:pół sztuki;Pomidorki koktajlowe:150 g;Oliwa:2 łyżki;Cytryna:pół sztuki|Wymieszaj odsączoną fasolę i tuńczyka z cebulą i pomidorkami. Polej oliwą i sokiem z cytryny.
s|pl,v|25|Leniwe pierogi|Twaróg:500 g;Mąka:150 g;Jajka:1 szt.;Masło:2 łyżki;Bułka tarta:2 łyżki|Zagnieć twaróg z mąką i jajkiem, uformuj wałki, pokrój ukośnie i gotuj do wypłynięcia. Polej masłem z zarumienioną bułką tartą.
s|az,v|15|Makaron w sosie orzechowym|Makaron ryżowy:200 g;Masło orzechowe:2 łyżki;Sos sojowy:2 łyżki;Limonka:1 szt.;Ogórki:1 szt.;Sezam:do posypania|Wymieszaj masło orzechowe z sosem sojowym, sokiem z limonki i odrobiną wody. Połącz z makaronem, dodaj paski ogórka i sezam.
s|am|15|Hot dogi z prażoną cebulką|Bułki do hot dogów:2 szt.;Parówki:2 szt.;Ogórki kiszone:1 szt.;Prażona cebulka:2 łyżki;Ketchup:do polania;Musztarda:do polania|Podgrzej parówki i bułki. Włóż parówki, dodaj pokrojony ogórek, cebulkę, ketchup i musztardę.
s|v|40|Pieczone bataty z jogurtem i fetą|Bataty:2 szt.;Jogurt naturalny:4 łyżki;Ser feta:80 g;Szczypiorek:do posypania|Nakłuj bataty i piecz 35 minut w 200°C. Przekrój, nałóż jogurt, pokruszoną fetę i szczypiorek.
s|pl,v|15|Chłodnik z buraków|Buraki:2 szt. gotowane;Kefir:500 ml;Ogórki:1 szt.;Rzodkiewka:pół pęczka;Koperek:pół pęczka;Jajka:2 szt.|Zetrzyj buraki i ogórka, wymieszaj z kefirem, rzodkiewką i koperkiem. Schłodź i podaj z jajkiem na twardo.
s|in|20|Wrap z kurczakiem curry|Tortille:2 szt.;Pierś z kurczaka:250 g;Jogurt naturalny:3 łyżki;Pasta curry:1 łyżka;Sałata:kilka liści;Ogórki:1 szt.|Usmaż kurczaka z pastą curry. Zawiń w tortillę z sałatą, ogórkiem i jogurtem.
n|sr,v|5|Hummus z warzywami|Hummus:1 opakowanie;Marchew:2 szt.;Ogórki:1 szt.;Papryka:1 szt.|Pokrój warzywa w słupki i maczaj w hummusie.
n|v|5|Koktajl bananowy|Banany:2 szt.;Mleko:200 ml;Jogurt naturalny:150 g;Miód:1 łyżeczka|Zmiksuj wszystkie składniki na gładko.
n|pl,v|5|Serek wiejski z pomidorem|Serek wiejski:1 opakowanie;Pomidory:1 szt.;Szczypiorek:do posypania;Chleb:1 kromka|Pokrój pomidora, wymieszaj z serkiem, posyp szczypiorkiem i zjedz z chlebem.
n|v|3|Jabłko z masłem orzechowym|Jabłka:1 szt.;Masło orzechowe:2 łyżki|Pokrój jabłko w ósemki i posmaruj masłem orzechowym.
n||5|Wrap z serkiem i szynką|Tortille:1 szt.;Serek śmietankowy:2 łyżki;Szynka:2 plastry;Sałata:kilka liści|Posmaruj tortillę serkiem, ułóż szynkę i sałatę, ciasno zwiń i przekrój na pół.
n|mx,v|10|Guacamole z nachosami|Awokado:2 szt.;Pomidory:1 szt.;Cebula:ćwiartka;Limonka:1 szt.;Nachosy:1 opakowanie|Rozgnieć awokado widelcem, dodaj drobno pokrojonego pomidora i cebulę, sok z limonki i sól. Podaj z nachosami.
n|v|5|Popcorn z patelni|Kukurydza na popcorn:50 g;Masło:1 łyżka|Rozgrzej tłuszcz w garnku z pokrywką, wsyp kukurydzę i potrząsaj, aż przestanie strzelać. Posól.
n|v|10|Kulki mocy z daktyli|Daktyle:150 g;Orzechy:100 g;Kakao:1 łyżka;Wiórki kokosowe:do obtoczenia|Zmiksuj daktyle z orzechami i kakao na lepką masę. Uformuj kulki i obtocz w wiórkach.
n|it,v|5|Szaszłyki caprese|Pomidorki koktajlowe:150 g;Mozzarella:1 kulka;Bazylia:kilka listków|Nabijaj na wykałaczki pomidorka, kawałek mozzarelli i listek bazylii. Skrop oliwą.
n|v|5|Wafle ryżowe z twarożkiem|Wafle ryżowe:3 szt.;Twaróg:100 g;Rzodkiewka:kilka sztuk|Posmaruj wafle twarogiem i ułóż plasterki rzodkiewki, dopraw solą i pieprzem.
n|az,v|10|Edamame z solą|Edamame mrożone:200 g|Gotuj strączki 4–5 minut w osolonej wodzie, odcedź i posyp grubą solą. Je się tylko ziarna ze środka.
n|pl,v|10|Jajka na twardo z majonezem|Jajka:2 szt.;Majonez:1 łyżka;Szczypiorek:do posypania|Ugotuj jajka na twardo (9 minut), przekrój, nałóż majonez i posyp szczypiorkiem.
n|v|5|Jogurt grecki z malinami i miodem|Jogurt grecki:200 g;Maliny:garść;Miód:1 łyżeczka|Przełóż jogurt do miseczki, dodaj maliny i polej miodem.
n|pl|5|Kabanosy z ogórkiem kiszonym|Kabanosy:2 szt.;Ogórki kiszone:2 szt.;Chleb:1 kromka|Pokrój kabanosy i ogórki, zjedz z chlebem.
n|am,v|10|Tost z serem z patelni|Chleb tostowy:2 kromki;Ser żółty:2 plastry;Masło:1 łyżeczka|Włóż ser między kromki, posmaruj z zewnątrz masłem i smaż z obu stron, aż ser się roztopi.
n|sr,v|25|Chrupiąca pieczona ciecierzyca|Ciecierzyca w puszce:1 puszka;Oliwa:1 łyżka;Papryka słodka mielona:1 łyżeczka|Osusz ciecierzycę, wymieszaj z oliwą, papryką i solą. Piecz 20 minut w 200°C, aż będzie chrupiąca.
n|v|5|Zielone smoothie|Szpinak:garść;Banany:1 szt.;Jabłka:1 szt.;Sok pomarańczowy:200 ml|Zmiksuj wszystkie składniki na gładko.
n|v|10|Sałatka owocowa|Jabłka:1 szt.;Banany:1 szt.;Pomarańcze:1 szt.;Winogrona:garść;Jogurt naturalny:3 łyżki|Pokrój owoce, wymieszaj i polej jogurtem.
`;

export const RECIPES = LINES.trim().split('\n').map((line) => {
  const [meal, traits, minutes, name, items, steps] = line.split('|');
  const tags = traits.split(',');
  return {
    id: plain(name).replace(/[^a-z0-9]+/g, '-'),
    meal, name, steps,
    minutes: Number(minutes),
    vegetarian: tags.includes('v'),
    cuisine: tags.find((tag) => CUISINES[tag]) || '',
    items: items.split(';').map((item) => item.split(':')),
  };
});

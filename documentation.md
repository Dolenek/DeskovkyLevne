# Dokumentace zmen

## React + Vite frontend
- Postavena nova React aplikace (Vite + TypeScript + Tailwind) v cerno-modrem vizualu.
- Pridany SEO landing pages `/levne-deskovky` a `/deskove-hry` s vlastnim copy a internimi odkazy na produkty; pridan generátor sitemap (`scripts/generate-sitemap.mjs`) a `public/robots.txt`, sitemap se vytvari pri buildu a obsahuje home/landing routes + vsechny slugy z `product_catalog_index`.
- Pridany prerender script (`scripts/prerender.mjs`) s Playwright, ktery po buildu vygeneruje staticke HTML pro `/`, landing pages a top N produktu podle posledniho scrape; limit lze zmenit pres `VITE_PRERENDER_LIMIT` a je potreba mit nainstalovany Playwright browsery.
- Pro prerender je nutne na build machine spustit `npx playwright install chromium` (nebo mit kompatibilni systemovy Chrome) a pocitat s tim, ze build bude delsi o renderovani HTML stranek.
- Pridana komponenta `Seo`, ktera nastavuje slugove canonical linky, Open Graph/Twitter meta a JSON-LD; domovska stranka publikuje schema.org `WebSite`, detail produktu `Product` s nabidkami pro kazdeho prodejce a obrazky preferuje hero snimek. Index.html ma predvyplneny popis, theme-color a jazyk `cs`.
- Supabase klient + hook useProductPricing převádějí tabulku `product_price_snapshots` na časové řady podle `product_name_normalized` (slug). Slug je nově hlavním identifikátorem produktů i pro routing, takže více prodejců se stejným slagem sdílí jednu kartu/detail. Volitelný filtr `VITE_SUPABASE_FILTER_CODES` dál omezuje jen zdrojová product_code.
- Pridany komponenty pro lokalizaci (CZ/EN), prepinac jazyka, karty s grafem (Recharts) a stavove obrazovky (nacitani/chyba/prazdno).
- Popsane formatovani dat/cen a moznost snadno rozsirit UI o dalsi produkty.
- Branding prejmenovan na „Deskovky Levně (DeskovkyLevne)“ – hlavicka, HTML titulek i README nesou nove jmeno a lokalni ukladani jazyka pouziva novy prefix s fallbackem na predchozi klic.
- Hlavni stranka nabizi fulltext product_name/product_code (debounce 400 ms) a filtr "Zobrazit pouze skladem". Sekci "Nedavno zlevnene" nahradil cenovy filtr s duplikovanym sliderem a poli "Cena od / Cena do", ktery okamzite filtruje dataset, ukazuje max. 10 karet na stranku a nabizi strankovani.
- Pro rychlejsi prvni nacitani se dataset cenovych rad nacita po postupnych davkach (Supabase range) pres novy hook `useChunkedProductCatalog`; sekce s cenovym filtrem automaticky vyzaduje dalsi davku podle aktualni stranky, misto aby se cele historie produktu stahovaly hned pri vstupu na web.
- Postranni panel filtru na vyhledavaci strance zabira celou vysku okna a vdaka sticky pozici zustava viditelny pri scrollovani.
- Vyhledavaci filtr nově nabízí výpis všech dostupných „Herních kategorií“ (sbíraných z doplňkových parametrů) s možností vícenásobného výběru; jak sekce rychlého vyhledávání, tak paginovaný seznam respektují zvolené checkboxy, navíc je tu mini vyhledávací pole pro bleskové filtrování kategorií a decentní vlastní scrollbar, aby byl seznam přehledný.
- Sekce dostupnosti ve filtrech kromě původního přepínače „Zobrazit pouze skladem“ nově nabízí tlačítko „Zobrazit předprodej“, které omezuje rychlé vyhledávání i cenový přehled pouze na produkty s availability_label obsahujícím text „Předprodej“.
- V databázi vznikl materializovaný pohled `product_catalog_index`, který pro každý `product_name_normalized` drží jednu agregovanou řádku (nejnovější snapshot + historické body `price_points`). Nad pohledem jsou indexy na slug (`product_name_normalized`, unikátní) i původní `product_name_original` (GIN + trgm), takže Supabase dokáže rychle stránkovat i fulltextově filtrovat celý katalog bez načítání 300k raw záznamů. Nezapomeňte spouštět `REFRESH MATERIALIZED VIEW CONCURRENTLY public.product_catalog_index;` po každém scrappingu.
- Hook `useChunkedProductCatalog` teď čte přímo z tohoto pohledu: stáhne malý úvodní balíček (`VITE_SUPABASE_INITIAL_CHUNK`, default 400), okamžitě jej zobrazí a následně s drobným zpožděním (`VITE_SUPABASE_CATALOG_PREFETCH_DELAY`) streamuje další dávky (`VITE_SUPABASE_CATALOG_CHUNK`, default 2000). Každá řádka už obsahuje kompletní historii produktu, takže na klientovi se pouze převádí připravené hodnoty do `ProductSeries` bez další agregace – paměť i CPU tak rostou jen s počtem unikátních titulů. Výsledek navíc eviduje celkový počet (`series.length` se nikdy nepřelévá a odpovídá pohledu), aby UI mohlo zobrazit přesný počet sledovaných produktů.
- Pagínovaná sekce s cenovými filtry už nefiltruje lokálně nad dílčím datasetem – nově ji obsluhuje hook `useFilteredCatalogIndex`, který si přes `fetchFilteredCatalogIndex` vyžádá hospodárně stránkovaná data z `product_catalog_index` už se zapracovanými filtry (dostupnost, cenové rozpětí, vybrané kategorie). Díky sjednocení nad slagem se nikdy neobjeví duplicity jednoho titulu od různých prodejců.
- `ProductSeries` si drží pole `sellers`, takže graf i statistiky mohou reagovat na víc zdrojů. Vizuály (název, popis, hero, galerie) se snaží vždy použít variantu z tlamagames/tlamagase a pouze pokud tam chybí, přebírají obsah od jiného prodejce (aktuálně planetaher).
- Loading stavy už pouze zobrazují decentní spinner místo textu „Načítám produkty…“, aby UI působilo svižněji a nerušilo při krátkých dotazech.
- Lokalizace pro cestinu byla opravena tak, aby obsahovala spravne diakriticke znaky a prirozene formulace.
- Header s vyhledavacim polem je znovu pouzity i na detailu produktu a pri zadavani vyhledavani se cely podklad rozmaze a nad aktualnim produktem se objevi jednoduchy seznam max. 6 relevantnich titulu; klik mimo seznam zavre overlay, ale ponecha zadany text.
- Hlavni vyhledavaci pole ted spousti stejny rozmazany overlay s vysledky jako na detailu; pokud nejsou zadane aspon dva znaky, overlay se vubec neukaze a zmizela i hlaska "Start typing at least 2 characters.".
- V overlays vyhledavani na detailu produktu ted kazdy vysledek zobrazuje i miniaturu hry (hero image), aby bylo snadnejsi vizualne identifikovat titul.
- Mobilni overlay vyhledavani se uz posouva v ramci obrazovky a radky vysledku se lami tak, aby se dostupnost s cenou neprekryvaly.
- Hlavicka je na mobilu kompaktnejsi (logo + jazyk v jednom radku, mensi vyhledavaci pole) a overlay vyhledavani ma vetsi top offset, aby se vysledky neprekryvaly se search barem.
- Mobilni filtry jsou schovane pod hamburgerem hned pod vyhledavanim: na malych obrazovkach se oteviraji jako bocni panel s vlastnim zaviracim tlacitkem a vyhledavani ma tlacitko pro rychle vymazani dotazu.
- Klik na logotyp/napis „DESKOVKY LEVNĚ“ v hlavicce kdykoliv presune uzivatele zpet na hlavni vyhledavaci stranku.
- Rychle vyhledavani (overlay) uz necita raw snapshoty, ale primo katalogovy index: novy hook `useCatalogSearch` taha pouze nezbytne sloupce, cachuje vysledky (LRU + TTL) a chrani se proti zastaralym requestum, takze vysledky naskakuji okamzite bez narustu pameti.
- Databaze dostala GIN trgm index `product_catalog_index_product_code_trgm_idx`, aby substring search pres `product_code` zustal rychly i pri uzkych dotazech; `product_name` uz pouziva trgm index z drivejska.
- Transformace katalogu byly rozdeleny do `catalogTransforms` a sdilenych helperu (`productTransformPrimitives`), aby se product transformy drzelly pod limitem 500 radku a zustaly citelne.
- Materializovany pohled `product_catalog_index` ted nese `product_name_normalized` a `product_name_search` (unaccent + lower), takze slugy v overlayi jdou vzdy pres kanonicky slug a hledani funguje i pri vynechane diakritice (napr. \"Loood\").
- K tomu pribyl trgm index `product_catalog_index_product_name_search_trgm_idx` a btree na `product_name_normalized`, aby i unaccent dotazy zustaly rychle.

## Detail produktu /deskove-hry/:slug
- Layout hlavni stranky presunut do pages/SearchPage.tsx, doplnen lehky router (usePathNavigation + App.tsx) pro URL / a /deskove-hry/:slug.
- Karty ve vysledcich jsou skutecne odkazy na slug produktu; hover/slash focus stale aktualizuje pravou cast, klik prechazi na detail.
- Hook `useProductDetail` + dotaz `fetchProductSnapshotsBySlug` obstarávají data pro jeden produkt. ProductDetailPage má hero s obrázkem, dostupnost, CTA do obchodu, souhrn cen, graf a tabulku posledních záznamů, nové texty jsou v translations. Pokud Supabase vrátí `gallery_image_urls`, detail ukáže galeriový slider (velký náhled + klikatelné náhledy) s fallbackem na hlavní hero obrázek.
- Graf historie z komponenty `ProductChart` kombinuje všechny dostupné prodejce daného slugu (aktuálně tlamagames + planetaher). Každý prodejce má vlastní barvu, legendu i hodnoty v tooltipu, takže je na první pohled vidět cenová strategie obou obchodů.
- Rychlá vyhledávání (overlay na detailu i hlavní stránce) vracejí `product_name_normalized` a používají jej pro navigaci, jmenné i cenové výsledky jsou tedy konzistentní.
- Zpracovani availability_label v productTransforms ted preferuje nejcerstvejsi scrape, aby se na detailu i ve zbytku UI ukazoval skutecny aktualni stav skladu.
- Overlay rychleho vyhledavani na detailu produktu vypisuje dostupnost hned vlevo od ceny, takze je na prvni pohled jasne, zda je produkt skladem nez uzivatel klikne na detail.
- Galerie na detailu ma zmensenou vysku, obrazek je posazeny vys a nahledy sedi hned pod hlavnim snimkem; hlavni slider je horizontalne posuvny (snap + scroll) pro rychle listovani vice snimky.
- Scrollbary v galerii detailu pouzivaji stejny custom styl jako filtry/kategorie, aby vizualne ladily s ostatnimi castmi webu.
- Popisek produktu (short_description) se zobrazuje primo pod nazvem v pravem panelu, ktery ma max-height=100vh a ceny jsou zarovnane ke spodku, aby CTA byla vzdy ve stejnem miste.
- Detail produktu je na mobilu pohodlnejsi (bez vnoreneho scrollu v pravem panelu, mensi paddings, adaptivni velikosti nadpisu/cen a nizsi graf), aby se obsah nelepil pod hlavicku.
- Spodni cast sekce „Historie ceny" uz nezobrazuje tabulku dat/datumů – misto toho se sem natahnou `supplementary_parameters` z databaze a prehledne se vypisou jako klic-hodnota; pokud dodatecne informace chybi, uzivatel dostane odpovidajici hlasku.
- Build overen (npm run build), varovani o velikosti bundlu zatim ponechano.
- Odstranen postranni panel "Detail produktu" na vyhledavaci strance, protoze kompletni detail zije na dedikovanem route.
- Odstranen cenový souhrn (Lowest/Highest/Average) z detailu produktu, aby stranka zduraznila historii cen a doplnkove parametry misto statickych karet.

## DB + backend optimalizace (Go API + read modely)
- Pridany implementacni plan v `PLAN.md` a SQL migrace `infra/db/migrations/20260217_db_backend_optimization.sql`.
- V databazi pribyly indexy nad `product_price_snapshots` pro hlavni read patterny: slug+cas, slug+seller+cas, recent cas a trigramy na `product_name_original` + `product_code`.
- Pridany helper funkce `seller_priority` a `extract_category_tags`, plus nove materializovane pohledy:
  - `catalog_slug_seller_summary` (slug + seller, price_points per seller),
  - `catalog_slug_summary` (1 radka na slug, seller-priority projekce pro katalog/search).
- Pridana DB funkce `refresh_catalog_aggregates()` pro obnovu obou read modelu.
- Frontend runtime uz nepouziva browser-side Supabase dotazy v `productService`; misto toho vola backend API (`VITE_API_BASE_URL`, endpointy `/api/v1/catalog`, `/api/v1/search/suggest`, `/api/v1/products/:slug`, `/api/v1/snapshots/recent`, `/api/v1/meta/categories`).
- Build-time skripty `generate-sitemap` a `prerender` ctou slugy z `catalog_slug_summary` (misto stareho `product_catalog_index`), aby sitemap/prerender jely nad canonical slug read modelem.
- Build-time skripty zaroven umi fallback URL pres `SUPABASE_URL`/`DATABASE_URL`, pokud neni nastavene `VITE_SUPABASE_URL`.
- Pridana nova sluzba `apps/api-go` (Go + chi + pgx + optional Redis cache), Dockerfile a compose soubor `infra/rewrite/docker-compose.api-go.yml`.
- K API nasazeni je pripraven helper script `infra/rewrite/deploy-api-go.sh` (docker compose build/up, vyzaduje `DATABASE_URL`).

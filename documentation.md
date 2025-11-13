# Dokumentace zmen

## React + Vite frontend
- Postavena nova React aplikace (Vite + TypeScript + Tailwind) v cerno-modrem vizualu.
- Supabase klient + hook useProductPricing prevadi tabulku product_price_snapshots na casove rady dle product_code, vcetne volitelneho filtru VITE_SUPABASE_FILTER_CODES.
- Pridany komponenty pro lokalizaci (CZ/EN), prepinac jazyka, karty s grafem (Recharts) a stavove obrazovky (nacitani/chyba/prazdno).
- Popsane formatovani dat/cen a moznost snadno rozsirit UI o dalsi produkty.
- Hlavni stranka nabizi fulltext product_name/product_code (debounce 400 ms) a filtr "Zobrazit pouze skladem". Sekci "Nedavno zlevnene" nahradil cenovy filtr s duplikovanym sliderem a poli "Cena od / Cena do", ktery okamzite filtruje dataset, ukazuje max. 10 karet na stranku a nabizi strankovani.
- Pro rychlejsi prvni nacitani se dataset cenovych rad nacita po postupnych davkach (Supabase range) pres novy hook `useChunkedProductCatalog`; sekce s cenovym filtrem automaticky vyzaduje dalsi davku podle aktualni stranky, misto aby se cele historie produktu stahovaly hned pri vstupu na web.
- Postranni panel filtru na vyhledavaci strance zabira celou vysku okna a vdaka sticky pozici zustava viditelny pri scrollovani.
- Lokalizace pro cestinu byla opravena tak, aby obsahovala spravne diakriticke znaky a prirozene formulace.
- Header s vyhledavacim polem je znovu pouzity i na detailu produktu a pri zadavani vyhledavani se cely podklad rozmaze a nad aktualnim produktem se objevi jednoduchy seznam max. 6 relevantnich titulu; klik mimo seznam zavre overlay, ale ponecha zadany text.
- V overlays vyhledavani na detailu produktu ted kazdy vysledek zobrazuje i miniaturu hry (hero image), aby bylo snadnejsi vizualne identifikovat titul.
- Klik na logotyp/napis „TLAMA PRICES“ v hlavicce kdykoliv presune uzivatele zpet na hlavni vyhledavaci stranku.

## Detail produktu /deskove-hry/:code
- Layout hlavni stranky presunut do pages/SearchPage.tsx, doplnen lehky router (usePathNavigation + App.tsx) pro URL / a /deskove-hry/:code.
- Karty ve vysledcich jsou skutecne odkazy na kod produktu; hover/slash focus stale aktualizuje pravou cast, klik prechazi na detail.
- Hook useProductDetail + dotaz fetchProductSnapshotsByCode obstarava data pro jeden produkt. ProductDetailPage ma hero s obrazkem, dostupnost, CTA do obchodu, souhrn cen, graf a tabulku poslednich zaznamu, nove texty jsou v translations. Pokud Supabase vrati gallery_image_urls, detail ukaze galeriovy slider (velky nahled + klikatelne nahledy) s fallbackem na hlavni hero obrazek.
- Zpracovani availability_label v productTransforms ted preferuje nejcerstvejsi scrape, aby se na detailu i ve zbytku UI ukazoval skutecny aktualni stav skladu.
- Overlay rychleho vyhledavani na detailu produktu vypisuje dostupnost hned vlevo od ceny, takze je na prvni pohled jasne, zda je produkt skladem nez uzivatel klikne na detail.
- Galerie na detailu ma zmensenou vysku, obrazek je posazeny vys a nahledy sedi hned pod hlavnim snimkem; hlavni slider je horizontalne posuvny (snap + scroll) pro rychle listovani vice snimky.
- Popisek produktu (short_description) se zobrazuje primo pod nazvem v pravem panelu, ktery ma max-height=100vh a ceny jsou zarovnane ke spodku, aby CTA byla vzdy ve stejnem miste.
- Build overen (npm run build), varovani o velikosti bundlu zatim ponechano.
- Odstranen postranni panel "Detail produktu" na vyhledavaci strance, protoze kompletni detail zije na dedikovanem route.

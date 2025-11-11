# Dokumentace zmen

## React + Vite frontend
- Postavena nova React aplikace (Vite + TypeScript + Tailwind) v cerno-modrem vizualu.
- Supabase klient + hook useProductPricing prevadi tabulku product_price_snapshots na casove rady dle product_code, vcetne volitelneho filtru VITE_SUPABASE_FILTER_CODES.
- Pridany komponenty pro lokalizaci (CZ/EN), prepinac jazyka, karty s grafem (Recharts) a stavove obrazovky (nacitani/chyba/prazdno).
- Popsane formatovani dat/cen a moznost snadno rozsirit UI o dalsi produkty.
- Hlavni stranka nabizi fulltext product_name/product_code (debounce 400 ms) a filtr "Zobrazit pouze skladem". Sekci "Nedavno zlevnene" nahradil cenovy filtr s duplikovanym sliderem a poli "Cena od / Cena do", ktery okamzite filtruje dataset, ukazuje max. 10 karet na stranku a nabizi strankovani.

## Detail produktu /deskove-hry/:code
- Layout hlavni stranky presunut do pages/SearchPage.tsx, doplnen lehky router (usePathNavigation + App.tsx) pro URL / a /deskove-hry/:code.
- Karty ve vysledcich jsou skutecne odkazy na kod produktu; hover/slash focus stale aktualizuje pravou cast, klik prechazi na detail.
- Hook useProductDetail + dotaz fetchProductSnapshotsByCode obstarava data pro jeden produkt. ProductDetailPage ma hero s obrazkem, dostupnost, CTA do obchodu, souhrn cen, graf a tabulku poslednich zaznamu, nove texty jsou v translations. Pokud Supabase vrati gallery_image_urls, detail ukaze galeriovy slider (velky nahled + klikatelne nahledy) s fallbackem na hlavni hero obrazek.
- Build overen (npm run build), varovani o velikosti bundlu zatim ponechano.
- Odstranen postranni panel "Detail produktu" na vyhledavaci strance, protoze kompletni detail zije na dedikovanem route.

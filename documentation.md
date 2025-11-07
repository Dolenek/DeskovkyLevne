# Dokumentace změn

## 2025-11-07 – React + Vite frontend
- Přidána nová React aplikace (Vite + TypeScript + Tailwind) s černo-modrým vzhledem.
- Implementován Supabase klient a hook `useProductPricing`, který načítá záznamy z tabulky `product_price_snapshots` (lze změnit pomocí `VITE_SUPABASE_PRODUCTS_TABLE`) a převádí je na časové řady podle `product_code`. Volitelný seznam sledovaných kódů lze zadat přes `VITE_SUPABASE_FILTER_CODES` (čárkami oddělené hodnoty).
- Přidány komponenty pro lokalizaci (CZ/EN), přepínač jazyka, karty produktů s grafem (Recharts) a stavové obrazovky (načítání, chyba, prázdný stav).
- Zavedena dokumentace formátování dat (den/měsíc/rok), formátování cen a možnost snadno rozšířit UI o další produkty.
- Hlavní stránka nově nabízí fulltextové vyhledávání podle `product_name`/`product_code` (se zpožděním 400 ms), přepínač „Zobrazit pouze skladem“ (filtruje podle `availability_label` obsahujícího `Skladem`) a sekci „Nedávno zlevněné“, která z limitu nejnovějších snapshotů (ovladatelné přes `VITE_RECENT_DISCOUNT_LOOKBACK`/`VITE_RECENT_DISCOUNT_RESULTS`) skládá seznam posledních poklesů cen; pokud v posledních datech není doložen reálný pokles, doplní se položkami s rozdílem `list_price_with_vat` vs `price_with_vat`. UI bylo přepracováno – klasická černá hlavička (sticky) s názvem, středovým vyhledáváním a přepínačem jazyka, vlevo panel filtrů a výsledky ve formě horizontálních karet s náhledovým obrázkem, aktuální/poslední cenou a detailem s grafem po kliknutí.

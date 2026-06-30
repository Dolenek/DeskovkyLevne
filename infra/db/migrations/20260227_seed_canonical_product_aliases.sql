-- Reviewed aliases that are safe to expose in public read models.
-- General discovery stays in canonical_product_alias_candidates until reviewed.

insert into public.canonical_products (
  canonical_product_id,
  display_name,
  source
) values
  ('obrozeni-rebirth', 'Obrozeni / Rebirth', 'manual'),
  ('vybusna-kotatka-deskova-hra', 'Vybusna kotatka: Deskova hra', 'manual'),
  ('implozivni-kotatka', 'Implozivni kotatka', 'manual')
on conflict (canonical_product_id) do update
set
  display_name = excluded.display_name,
  source = excluded.source,
  updated_at = timezone('utc', now());

insert into public.canonical_product_aliases (
  canonical_product_id,
  seller,
  product_code,
  product_name_normalized,
  source,
  confidence,
  notes
) values
  (
    'obrozeni-rebirth',
    'hras',
    '6039374',
    'obrozeni',
    'manual',
    1,
    'Known cross-seller match'
  ),
  (
    'obrozeni-rebirth',
    'imago',
    '75404',
    'obrozeni-deskova-hra-rebirth',
    'manual',
    1,
    'Known cross-seller match'
  ),
  (
    'obrozeni-rebirth',
    'tlamagames',
    '108574',
    'obrozeni-rebirth',
    'manual',
    1,
    'Known cross-seller match'
  ),
  (
    'vybusna-kotatka-deskova-hra',
    'albi',
    '12514',
    'vybusna-kotatka-deskova-hra',
    'manual',
    1,
    'Keep the board game edition separate from the base card game'
  ),
  (
    'vybusna-kotatka-deskova-hra',
    'ludopolis',
    'vybusna-kotatka-deskova-hra',
    'vybusna-kotatka-deskova-hra',
    'manual',
    1,
    'Keep the board game edition separate from the base card game'
  ),
  (
    'implozivni-kotatka',
    'tlamagames',
    '10372',
    'implozivni-kotatka',
    'manual',
    1,
    'Reviewed Implozivni kotatka expansion match'
  ),
  (
    'implozivni-kotatka',
    'albi',
    '31027',
    'implozivni-kotatka-rozsireni',
    'manual',
    1,
    'Reviewed Implozivni kotatka expansion match'
  ),
  (
    'implozivni-kotatka',
    'hras',
    '6039974',
    'vybusna-kotatka-1-rozsireni-party-hry-implozivni-kotatka',
    'manual',
    1,
    'Reviewed Implozivni kotatka expansion match'
  ),
  (
    'implozivni-kotatka',
    'imago',
    '44818',
    'vybusna-kotatka-implozivni-kotatka',
    'manual',
    1,
    'Reviewed Implozivni kotatka expansion match'
  ),
  (
    'implozivni-kotatka',
    'ludopolis',
    'implozivni-kotatka',
    'vybusna-kotatka-implozivni-kotatka',
    'manual',
    1,
    'Reviewed Implozivni kotatka expansion match'
  ),
  (
    'implozivni-kotatka',
    'najada',
    'JDHML2',
    'vybusna-kotatka-implozivni-kotatka',
    'manual',
    1,
    'Reviewed Implozivni kotatka expansion match'
  ),
  (
    'implozivni-kotatka',
    'svet-her',
    'P9119',
    'vybusna-kotatka-implozivni-kotatka',
    'manual',
    1,
    'Reviewed Implozivni kotatka expansion match'
  )
on conflict do nothing;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'catalog_slug_seller_state'
      and column_name = 'ean_codes'
  ) then
    perform public.refresh_canonical_product_alias_candidates(5000);
  end if;
end $$;

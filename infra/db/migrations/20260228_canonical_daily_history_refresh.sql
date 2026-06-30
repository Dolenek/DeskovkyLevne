-- Seller-day history read model and alias-aware rebuild helpers.

create table if not exists public.catalog_daily_price_history (
  canonical_product_id text not null,
  product_name_normalized text not null,
  seller text not null,
  price_date date not null,
  currency_code char(3) not null,
  opening_price numeric not null,
  closing_price numeric not null,
  min_price numeric not null,
  max_price numeric not null,
  list_price_with_vat numeric,
  availability_status text not null,
  is_available boolean not null,
  is_preorder boolean not null,
  snapshot_count integer not null,
  first_scraped_at timestamptz not null,
  last_scraped_at timestamptz not null,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (canonical_product_id, seller, price_date)
);

create index if not exists catalog_daily_price_history_canonical_date_idx
on public.catalog_daily_price_history (canonical_product_id, price_date desc);

create index if not exists catalog_daily_price_history_slug_date_idx
on public.catalog_daily_price_history (product_name_normalized, price_date desc);

create or replace function public.catalog_availability_status(
  availability_label text
) returns text
language sql
immutable
as $$
  with normalized as (
    select regexp_replace(
      replace(public.unaccent(lower(trim(coalesce(availability_label, '')))), chr(160), ' '),
      '\s+',
      ' ',
      'g'
    ) as value
  )
  select case
    when value = '' then 'unknown'
    when value like '%predprodej%' or value like '%predobjednav%' then 'preorder'
    when value like '%hra jiz neni v prodeji%' then 'unavailable'
    when value like '%hra uz nie je v predaji%' then 'unavailable'
    when value like '%vyprodano%' or value like '%vypredane%' then 'unavailable'
    when value like '%nedostup%' or value like '%neni skladem%' then 'unavailable'
    when value like '%nie je skladom%' then 'unavailable'
    when value like '%na dotaz%' or value like '%dostupnost na dotaz%' then 'unknown'
    when value like '%objednano%' then 'preorder'
    when value like '%do tydne%' or value like '%do tyzdna%' then 'available'
    when value ~ '(^|[^0-9])14[[:space:]]*dni?' then 'available'
    when value ~ '(^|[^0-9])14[[:space:]]*dnu' then 'available'
    when value ~ '(^|[^0-9])30[[:space:]]*dni?' then 'available'
    when value ~ '(^|[^0-9])30[[:space:]]*dnu' then 'available'
    when value like '%skladem%' or value like '%skladom%' then 'available'
    when value like '%na sklade%' then 'available'
    when value like 'neznama dostupnost (% ks)' then 'available'
    when value like 'neznama dostupnost (>%' then 'available'
    else 'unknown'
  end
  from normalized;
$$;

create or replace function public.refresh_catalog_daily_price_history(
  p_since timestamptz default null,
  p_until timestamptz default null
) returns jsonb
language plpgsql
as $$
declare
  v_upserted_rows bigint := 0;
begin
  with source_snapshots as (
    select
      public.canonical_product_slug(seller, product_code, product_name_normalized)
        as canonical_product_id,
      lower(coalesce(nullif(trim(seller), ''), 'unknown')) as seller,
      scraped_at::date as price_date,
      currency_code,
      price_with_vat,
      list_price_with_vat,
      coalesce(
        nullif(availability_status, 'unknown'),
        public.catalog_availability_status(availability_label),
        'unknown'
      ) as availability_status,
      scraped_at,
      id
    from public.product_price_snapshots
    where product_name_normalized is not null
      and trim(product_name_normalized) <> ''
      and (p_since is null or scraped_at >= date_trunc('day', p_since))
      and (p_until is null or scraped_at < date_trunc('day', p_until))
  ),
  daily_bounds as (
    select
      canonical_product_id,
      seller,
      price_date,
      min(price_with_vat) as min_price,
      max(price_with_vat) as max_price,
      count(*)::integer as snapshot_count,
      min(scraped_at) as first_scraped_at,
      max(scraped_at) as last_scraped_at
    from source_snapshots
    group by canonical_product_id, seller, price_date
  ),
  opening_rows as (
    select distinct on (canonical_product_id, seller, price_date)
      canonical_product_id,
      seller,
      price_date,
      price_with_vat as opening_price
    from source_snapshots
    order by canonical_product_id, seller, price_date, scraped_at asc, id asc
  ),
  closing_rows as (
    select distinct on (canonical_product_id, seller, price_date)
      canonical_product_id,
      seller,
      price_date,
      currency_code,
      price_with_vat as closing_price,
      list_price_with_vat,
      availability_status,
      availability_status = 'available' as is_available,
      availability_status = 'preorder' as is_preorder
    from source_snapshots
    order by canonical_product_id, seller, price_date, scraped_at desc, id desc
  )
  insert into public.catalog_daily_price_history (
    canonical_product_id,
    product_name_normalized,
    seller,
    price_date,
    currency_code,
    opening_price,
    closing_price,
    min_price,
    max_price,
    list_price_with_vat,
    availability_status,
    is_available,
    is_preorder,
    snapshot_count,
    first_scraped_at,
    last_scraped_at
  )
  select
    bounds.canonical_product_id,
    bounds.canonical_product_id,
    bounds.seller,
    bounds.price_date,
    closing.currency_code,
    opening.opening_price,
    closing.closing_price,
    bounds.min_price,
    bounds.max_price,
    closing.list_price_with_vat,
    closing.availability_status,
    closing.is_available,
    closing.is_preorder,
    bounds.snapshot_count,
    bounds.first_scraped_at,
    bounds.last_scraped_at
  from daily_bounds bounds
  join opening_rows opening using (canonical_product_id, seller, price_date)
  join closing_rows closing using (canonical_product_id, seller, price_date)
  on conflict (canonical_product_id, seller, price_date) do update set
    product_name_normalized = excluded.product_name_normalized,
    currency_code = case
      when excluded.last_scraped_at >= catalog_daily_price_history.last_scraped_at
        then excluded.currency_code
      else catalog_daily_price_history.currency_code
    end,
    opening_price = case
      when excluded.first_scraped_at < catalog_daily_price_history.first_scraped_at
        then excluded.opening_price
      else catalog_daily_price_history.opening_price
    end,
    closing_price = case
      when excluded.last_scraped_at >= catalog_daily_price_history.last_scraped_at
        then excluded.closing_price
      else catalog_daily_price_history.closing_price
    end,
    min_price = least(catalog_daily_price_history.min_price, excluded.min_price),
    max_price = greatest(catalog_daily_price_history.max_price, excluded.max_price),
    list_price_with_vat = case
      when excluded.last_scraped_at >= catalog_daily_price_history.last_scraped_at
        then excluded.list_price_with_vat
      else catalog_daily_price_history.list_price_with_vat
    end,
    availability_status = case
      when excluded.last_scraped_at >= catalog_daily_price_history.last_scraped_at
        then excluded.availability_status
      else catalog_daily_price_history.availability_status
    end,
    is_available = case
      when excluded.last_scraped_at >= catalog_daily_price_history.last_scraped_at
        then excluded.is_available
      else catalog_daily_price_history.is_available
    end,
    is_preorder = case
      when excluded.last_scraped_at >= catalog_daily_price_history.last_scraped_at
        then excluded.is_preorder
      else catalog_daily_price_history.is_preorder
    end,
    snapshot_count = greatest(catalog_daily_price_history.snapshot_count, excluded.snapshot_count),
    first_scraped_at = least(catalog_daily_price_history.first_scraped_at, excluded.first_scraped_at),
    last_scraped_at = greatest(catalog_daily_price_history.last_scraped_at, excluded.last_scraped_at),
    updated_at = timezone('utc', now());

  get diagnostics v_upserted_rows = row_count;
  return jsonb_build_object('upserted_daily_rows', v_upserted_rows);
end;
$$;

create or replace function public.rebuild_catalog_daily_price_history_for_canonical_product(
  p_canonical_product_id text
) returns jsonb
language plpgsql
as $$
declare
  v_canonical_product_id text := public.canonical_product_slug(
    null,
    null,
    p_canonical_product_id
  );
  v_deleted_rows bigint := 0;
  v_result jsonb;
begin
  if nullif(trim(v_canonical_product_id), '') is null then
    return jsonb_build_object('canonical_product_id', null, 'deleted_rows', 0);
  end if;

  create temp table tmp_alias_rebuild_slugs (
    product_name_normalized text primary key
  ) on commit drop;

  insert into tmp_alias_rebuild_slugs (product_name_normalized)
  select v_canonical_product_id
  union
  select lower(trim(product_name_normalized))
  from public.canonical_product_aliases
  where canonical_product_id = v_canonical_product_id
    and product_name_normalized is not null
    and trim(product_name_normalized) <> '';

  delete from public.catalog_daily_price_history history
  where history.canonical_product_id in (
    select product_name_normalized from tmp_alias_rebuild_slugs
  );
  get diagnostics v_deleted_rows = row_count;

  with bounds as (
    select min(scraped_at) as since_at, max(scraped_at) + interval '1 day' as until_at
    from public.product_price_snapshots snapshots
    where public.canonical_product_slug(
      snapshots.seller,
      snapshots.product_code,
      snapshots.product_name_normalized
    ) = v_canonical_product_id
  )
  select public.refresh_catalog_daily_price_history(since_at, until_at)
  into v_result
  from bounds
  where since_at is not null;

  return jsonb_build_object(
    'canonical_product_id', v_canonical_product_id,
    'deleted_rows', v_deleted_rows,
    'refresh', coalesce(v_result, '{}'::jsonb)
  );
end;
$$;

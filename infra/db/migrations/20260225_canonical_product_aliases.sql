-- Canonical product alias layer.
-- Raw snapshots keep their scraped slug; runtime read models can resolve known
-- aliases to a reviewed canonical product slug.

create table if not exists public.canonical_products (
  canonical_product_id text primary key,
  display_name text,
  source text not null default 'manual',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.canonical_product_aliases (
  canonical_product_id text not null,
  seller text,
  product_code text,
  product_name_normalized text,
  source text not null default 'manual',
  confidence numeric not null default 1,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'canonical_product_aliases_canonical_product_id_fkey'
  ) then
    alter table public.canonical_product_aliases
      add constraint canonical_product_aliases_canonical_product_id_fkey
      foreign key (canonical_product_id)
      references public.canonical_products (canonical_product_id)
      on update cascade
      on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'canonical_product_alias_confidence_check'
  ) then
    alter table public.canonical_product_aliases
      add constraint canonical_product_alias_confidence_check
      check (confidence >= 0 and confidence <= 1);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'canonical_product_alias_has_match_key'
  ) then
    alter table public.canonical_product_aliases
      add constraint canonical_product_alias_has_match_key
      check (
        nullif(trim(coalesce(product_name_normalized, '')), '') is not null
        or (
          nullif(trim(coalesce(seller, '')), '') is not null
          and nullif(trim(coalesce(product_code, '')), '') is not null
        )
      );
  end if;
end $$;

create unique index if not exists canonical_product_alias_seller_code_idx
on public.canonical_product_aliases (lower(seller), lower(product_code))
where seller is not null and product_code is not null;

create index if not exists canonical_product_alias_slug_idx
on public.canonical_product_aliases (product_name_normalized)
where product_name_normalized is not null;

create or replace function public.canonical_product_slug(
  p_seller text,
  p_product_code text,
  p_current_slug text
) returns text
language plpgsql
stable
as $$
declare
  v_slug text := lower(trim(coalesce(p_current_slug, '')));
  v_canonical_product_id text;
begin
  select alias.canonical_product_id
  into v_canonical_product_id
  from public.canonical_product_aliases alias
  where lower(coalesce(alias.seller, '')) = lower(coalesce(p_seller, ''))
    and lower(coalesce(alias.product_code, '')) = lower(coalesce(p_product_code, ''))
  order by alias.confidence desc, alias.updated_at desc
  limit 1;

  if v_canonical_product_id is not null then
    return v_canonical_product_id;
  end if;

  select alias.canonical_product_id
  into v_canonical_product_id
  from public.canonical_product_aliases alias
  where lower(trim(alias.product_name_normalized)) = v_slug
  order by alias.confidence desc, alias.updated_at desc
  limit 1;

  return coalesce(v_canonical_product_id, v_slug);
end;
$$;

create or replace function public.catalog_product_daily_history(
  p_canonical_product_id text,
  p_seller text default null
) returns table (
  canonical_product_id text,
  seller text,
  price_date date,
  currency_code char(3),
  opening_price numeric,
  closing_price numeric,
  min_price numeric,
  max_price numeric,
  list_price_with_vat numeric,
  availability_status text,
  is_available boolean,
  is_preorder boolean,
  snapshot_count integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    history.canonical_product_id,
    history.seller,
    history.price_date,
    history.currency_code,
    history.opening_price,
    history.closing_price,
    history.min_price,
    history.max_price,
    history.list_price_with_vat,
    history.availability_status,
    history.is_available,
    history.is_preorder,
    history.snapshot_count
  from public.catalog_daily_price_history history
  where history.canonical_product_id = public.canonical_product_slug(
      null,
      null,
      p_canonical_product_id
    )
    and (p_seller is null or history.seller = lower(trim(p_seller)))
  order by history.price_date asc, history.seller asc;
$$;

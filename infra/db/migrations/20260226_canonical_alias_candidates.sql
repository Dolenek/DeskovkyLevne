-- Review-first alias candidate seeding.
-- This table is advisory: rows here never affect public catalog identity until
-- a reviewed alias is inserted into canonical_product_aliases.

create table if not exists public.canonical_product_alias_candidates (
  id bigserial primary key,
  proposed_canonical_product_id text not null,
  seller text,
  product_code text,
  product_name_normalized text,
  product_name text,
  match_rule text not null,
  confidence numeric not null,
  evidence jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'canonical_product_alias_candidate_confidence_check'
  ) then
    alter table public.canonical_product_alias_candidates
      add constraint canonical_product_alias_candidate_confidence_check
      check (confidence >= 0 and confidence <= 1);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'canonical_product_alias_candidate_status_check'
  ) then
    alter table public.canonical_product_alias_candidates
      add constraint canonical_product_alias_candidate_status_check
      check (status in ('pending', 'approved', 'rejected'));
  end if;
end $$;

create unique index if not exists canonical_product_alias_candidate_key_idx
on public.canonical_product_alias_candidates (
  match_rule,
  proposed_canonical_product_id,
  coalesce(seller, ''),
  coalesce(product_code, ''),
  coalesce(product_name_normalized, '')
);

create index if not exists canonical_product_alias_candidate_status_idx
on public.canonical_product_alias_candidates (status, confidence desc);

create or replace function public.normalize_alias_ean(p_ean text)
returns text
language sql
immutable
as $$
  with cleaned as (
    select regexp_replace(coalesce(p_ean, ''), '[^0-9]', '', 'g') as digits
  )
  select case
    when length(digits) = 12 then '0' || digits
    when length(digits) between 8 and 14 then digits
    else null
  end
  from cleaned;
$$;

create or replace function public.refresh_canonical_product_alias_candidates(
  p_limit integer default 5000
) returns jsonb
language plpgsql
as $$
declare
  v_inserted_rows bigint := 0;
begin
  with latest_rows as (
    select
      lower(coalesce(nullif(trim(seller), ''), 'unknown')) as seller,
      nullif(trim(product_code), '') as product_code,
      lower(nullif(trim(product_code), '')) as product_code_key,
      lower(trim(product_name_normalized)) as slug,
      product_name,
      latest_scraped_at as scraped_at
    from public.catalog_slug_seller_state
    where product_name_normalized is not null
      and trim(product_name_normalized) <> ''
      and product_code is not null
      and trim(product_code) <> ''
  ),
  code_groups as (
    select
      seller,
      product_code_key,
      (array_agg(product_code order by length(product_code), product_code))[1] as product_code,
      (array_agg(slug order by length(slug), slug))[1] as proposed_slug,
      count(distinct slug) as slug_count,
      jsonb_agg(
        jsonb_build_object(
          'slug', slug,
          'product_code', product_code,
          'product_name', product_name,
          'latest_scraped_at', scraped_at
        )
        order by slug
      ) as evidence_rows
    from latest_rows
    group by seller, product_code_key
    having count(distinct slug) > 1
  ),
  code_candidates as (
    select
      group_rows.proposed_slug,
      latest_rows.seller,
      latest_rows.product_code,
      latest_rows.product_code_key,
      latest_rows.slug,
      latest_rows.product_name,
      'same_seller_product_code'::text as match_rule,
      0.98::numeric as confidence,
      jsonb_build_object(
        'reason', 'same seller and product_code appears under multiple slugs',
        'slug_count', group_rows.slug_count,
        'group_rows', group_rows.evidence_rows
      ) as evidence
    from code_groups group_rows
    join latest_rows
      on latest_rows.seller = group_rows.seller
     and latest_rows.product_code_key = group_rows.product_code_key
  ),
  ean_rows as (
    select
      public.normalize_alias_ean(ean.raw_ean) as normalized_ean,
      lower(coalesce(nullif(trim(state.seller), ''), 'unknown')) as seller,
      nullif(trim(state.product_code), '') as product_code,
      lower(nullif(trim(state.product_code), '')) as product_code_key,
      lower(trim(state.product_name_normalized)) as slug,
      state.product_name,
      state.latest_scraped_at as scraped_at
    from public.catalog_slug_seller_state state
    cross join lateral unnest(coalesce(state.ean_codes, '{}'::text[])) ean(raw_ean)
    where state.product_name_normalized is not null
      and trim(state.product_name_normalized) <> ''
      and public.normalize_alias_ean(ean.raw_ean) is not null
  ),
  ean_groups as (
    select
      normalized_ean,
      (array_agg(
        slug
        order by public.seller_priority(seller), length(slug), slug
      ))[1] as proposed_slug,
      count(distinct slug) as slug_count,
      count(distinct seller) as seller_count,
      jsonb_agg(
        jsonb_build_object(
          'slug', slug,
          'seller', seller,
          'product_code', product_code,
          'product_name', product_name,
          'latest_scraped_at', scraped_at
        )
        order by seller, slug
      ) as evidence_rows
    from ean_rows
    group by normalized_ean
    having count(distinct slug) between 2 and 5
       and count(distinct seller) > 1
  ),
  ean_candidates as (
    select
      group_rows.proposed_slug,
      ean_rows.seller,
      ean_rows.product_code,
      ean_rows.product_code_key,
      ean_rows.slug,
      ean_rows.product_name,
      'shared_ean_review'::text as match_rule,
      0.74::numeric as confidence,
      jsonb_build_object(
        'reason', 'normalized EAN is shared by a small cross-seller group',
        'normalized_ean', group_rows.normalized_ean,
        'slug_count', group_rows.slug_count,
        'seller_count', group_rows.seller_count,
        'group_rows', group_rows.evidence_rows
      ) as evidence
    from ean_groups group_rows
    join ean_rows using (normalized_ean)
  ),
  all_candidates as (
    select * from code_candidates
    union all
    select * from ean_candidates
  ),
  inserted as (
    insert into public.canonical_product_alias_candidates (
      proposed_canonical_product_id,
      seller,
      product_code,
      product_name_normalized,
      product_name,
      match_rule,
      confidence,
      evidence
    )
    select
      proposed_slug,
      seller,
      product_code,
      slug,
      product_name,
      match_rule,
      confidence,
      evidence
    from all_candidates candidate
    where not exists (
      select 1
      from public.canonical_product_aliases approved
      where lower(coalesce(approved.seller, '')) = candidate.seller
        and lower(coalesce(approved.product_code, '')) = candidate.product_code_key
    )
    order by confidence desc, proposed_slug, seller, product_code, slug
    limit greatest(coalesce(p_limit, 5000), 0)
    on conflict do nothing
    returning 1
  )
  select count(*) into v_inserted_rows from inserted;

  return jsonb_build_object('inserted_candidate_rows', v_inserted_rows);
end;
$$;

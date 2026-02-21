-- Phase 2 incremental read-model refresh function.
-- Requires tables created by 20260223_incremental_catalog_state.sql.

create or replace function public.refresh_catalog_state_incremental(
  p_since timestamptz default null
) returns jsonb
language plpgsql
as $$
declare
  v_changed_slug_count bigint := 0;
  v_upserted_seller_rows bigint := 0;
  v_deleted_seller_rows bigint := 0;
  v_upserted_slug_rows bigint := 0;
  v_deleted_slug_rows bigint := 0;
begin
  create temp table tmp_changed_slugs (
    product_name_normalized text primary key
  ) on commit drop;

  insert into tmp_changed_slugs (product_name_normalized)
  select distinct lower(trim(s.product_name_normalized))
  from public.product_price_snapshots s
  where s.product_name_normalized is not null
    and trim(s.product_name_normalized) <> ''
    and (p_since is null or s.scraped_at >= p_since);

  select count(*) into v_changed_slug_count from tmp_changed_slugs;
  if v_changed_slug_count = 0 then
    return jsonb_build_object(
      'changed_slugs', 0,
      'upserted_seller_rows', 0,
      'deleted_seller_rows', 0,
      'upserted_slug_rows', 0,
      'deleted_slug_rows', 0
    );
  end if;

  create temp table tmp_seller_state_delta on commit drop as
  with base as (
    select
      p.id,
      lower(trim(p.product_name_normalized)) as product_name_normalized,
      lower(coalesce(nullif(trim(p.seller), ''), 'unknown')) as seller,
      p.product_guid,
      p.product_code,
      p.product_name_original as product_name,
      p.price_with_vat,
      p.list_price_with_vat,
      p.currency_code,
      p.availability_label,
      p.stock_status_label,
      p.source_url,
      p.scraped_at,
      p.metadata,
      p.hero_image_url,
      p.gallery_image_urls,
      p.short_description,
      p.supplementary_parameters
    from public.product_price_snapshots p
    join tmp_changed_slugs c
      on c.product_name_normalized = lower(trim(p.product_name_normalized))
  ),
  ranked as (
    select
      b.*,
      row_number() over (
        partition by b.product_name_normalized, b.seller
        order by b.scraped_at desc, b.id desc
      ) as rn_desc,
      row_number() over (
        partition by b.product_name_normalized, b.seller
        order by b.scraped_at asc, b.id asc
      ) as rn_asc
    from base b
  ),
  latest as (
    select * from ranked where rn_desc = 1
  ),
  previous_price as (
    select
      product_name_normalized,
      seller,
      price_with_vat as previous_price
    from ranked
    where rn_desc = 2
  ),
  first_price as (
    select
      product_name_normalized,
      seller,
      price_with_vat as first_price
    from ranked
    where rn_asc = 1
  ),
  price_points as (
    select
      b.product_name_normalized,
      b.seller,
      jsonb_agg(
        jsonb_build_object(
          'rawDate',
          to_char((b.scraped_at at time zone 'UTC'), 'YYYY-MM-DD'),
          'price',
          b.price_with_vat
        ) order by b.scraped_at
      ) as price_points
    from base b
    group by b.product_name_normalized, b.seller
  )
  select
    l.product_name_normalized,
    l.seller,
    l.product_guid,
    l.product_code,
    l.product_name,
    unaccent(lower(l.product_name)) as product_name_search,
    l.currency_code,
    l.availability_label,
    l.stock_status_label,
    l.price_with_vat as latest_price,
    ppv.previous_price,
    fp.first_price,
    l.list_price_with_vat,
    l.source_url,
    l.scraped_at as latest_scraped_at,
    l.hero_image_url,
    l.gallery_image_urls,
    l.short_description,
    l.supplementary_parameters,
    l.metadata,
    public.extract_category_tags(l.supplementary_parameters) as category_tags,
    coalesce(ppt.price_points, '[]'::jsonb) as price_points
  from latest l
  left join previous_price ppv
    on ppv.product_name_normalized = l.product_name_normalized
   and ppv.seller = l.seller
  left join first_price fp
    on fp.product_name_normalized = l.product_name_normalized
   and fp.seller = l.seller
  left join price_points ppt
    on ppt.product_name_normalized = l.product_name_normalized
   and ppt.seller = l.seller;

  insert into public.catalog_slug_seller_state (
    product_name_normalized,
    seller,
    product_guid,
    product_code,
    product_name,
    product_name_search,
    currency_code,
    availability_label,
    stock_status_label,
    latest_price,
    previous_price,
    first_price,
    list_price_with_vat,
    source_url,
    latest_scraped_at,
    hero_image_url,
    gallery_image_urls,
    short_description,
    supplementary_parameters,
    metadata,
    category_tags,
    price_points
  )
  select
    product_name_normalized,
    seller,
    product_guid,
    product_code,
    product_name,
    product_name_search,
    currency_code,
    availability_label,
    stock_status_label,
    latest_price,
    previous_price,
    first_price,
    list_price_with_vat,
    source_url,
    latest_scraped_at,
    hero_image_url,
    gallery_image_urls,
    short_description,
    supplementary_parameters,
    metadata,
    category_tags,
    price_points
  from tmp_seller_state_delta
  on conflict (product_name_normalized, seller) do update
  set
    product_guid = excluded.product_guid,
    product_code = excluded.product_code,
    product_name = excluded.product_name,
    product_name_search = excluded.product_name_search,
    currency_code = excluded.currency_code,
    availability_label = excluded.availability_label,
    stock_status_label = excluded.stock_status_label,
    latest_price = excluded.latest_price,
    previous_price = excluded.previous_price,
    first_price = excluded.first_price,
    list_price_with_vat = excluded.list_price_with_vat,
    source_url = excluded.source_url,
    latest_scraped_at = excluded.latest_scraped_at,
    hero_image_url = excluded.hero_image_url,
    gallery_image_urls = excluded.gallery_image_urls,
    short_description = excluded.short_description,
    supplementary_parameters = excluded.supplementary_parameters,
    metadata = excluded.metadata,
    category_tags = excluded.category_tags,
    price_points = excluded.price_points,
    updated_at = now();
  get diagnostics v_upserted_seller_rows = row_count;

  delete from public.catalog_slug_seller_state existing
  where existing.product_name_normalized in (
    select product_name_normalized from tmp_changed_slugs
  )
    and not exists (
      select 1
      from tmp_seller_state_delta delta
      where delta.product_name_normalized = existing.product_name_normalized
        and delta.seller = existing.seller
    );
  get diagnostics v_deleted_seller_rows = row_count;

  create temp table tmp_slug_state_delta on commit drop as
  with ranked as (
    select
      css.*, 
      row_number() over (
        partition by css.product_name_normalized
        order by public.seller_priority(css.seller), css.latest_scraped_at desc
      ) as seller_rank
    from public.catalog_slug_seller_state css
    join tmp_changed_slugs c using (product_name_normalized)
  ),
  primary_seller as (
    select * from ranked where seller_rank = 1
  ),
  availability as (
    select
      css.product_name_normalized,
      bool_or(coalesce(css.availability_label, '') ilike '%Skladem%') as is_available,
      bool_or(coalesce(css.availability_label, '') ilike '%Předprodej%') as is_preorder
    from public.catalog_slug_seller_state css
    join tmp_changed_slugs c using (product_name_normalized)
    group by css.product_name_normalized
  ),
  categories as (
    select
      css.product_name_normalized,
      coalesce(array_agg(distinct tag order by tag), '{}'::text[]) as category_tags
    from public.catalog_slug_seller_state css
    join tmp_changed_slugs c using (product_name_normalized)
    cross join lateral unnest(css.category_tags) as tag
    group by css.product_name_normalized
  )
  select
    p.product_name_normalized,
    p.seller as primary_seller,
    p.product_code,
    p.product_name,
    p.product_name_search,
    p.currency_code,
    p.availability_label,
    p.stock_status_label,
    p.latest_price,
    p.previous_price,
    p.first_price,
    p.list_price_with_vat,
    p.source_url,
    p.latest_scraped_at,
    p.hero_image_url,
    p.gallery_image_urls,
    p.short_description,
    p.supplementary_parameters,
    p.metadata,
    coalesce(c.category_tags, '{}'::text[]) as category_tags,
    coalesce(a.is_available, false) as is_available,
    coalesce(a.is_preorder, false) as is_preorder,
    null::jsonb as price_points
  from primary_seller p
  left join availability a using (product_name_normalized)
  left join categories c using (product_name_normalized);

  insert into public.catalog_slug_state (
    product_name_normalized,
    primary_seller,
    product_code,
    product_name,
    product_name_search,
    currency_code,
    availability_label,
    stock_status_label,
    latest_price,
    previous_price,
    first_price,
    list_price_with_vat,
    source_url,
    latest_scraped_at,
    hero_image_url,
    gallery_image_urls,
    short_description,
    supplementary_parameters,
    metadata,
    category_tags,
    is_available,
    is_preorder,
    price_points
  )
  select
    product_name_normalized,
    primary_seller,
    product_code,
    product_name,
    product_name_search,
    currency_code,
    availability_label,
    stock_status_label,
    latest_price,
    previous_price,
    first_price,
    list_price_with_vat,
    source_url,
    latest_scraped_at,
    hero_image_url,
    gallery_image_urls,
    short_description,
    supplementary_parameters,
    metadata,
    category_tags,
    is_available,
    is_preorder,
    price_points
  from tmp_slug_state_delta
  on conflict (product_name_normalized) do update
  set
    primary_seller = excluded.primary_seller,
    product_code = excluded.product_code,
    product_name = excluded.product_name,
    product_name_search = excluded.product_name_search,
    currency_code = excluded.currency_code,
    availability_label = excluded.availability_label,
    stock_status_label = excluded.stock_status_label,
    latest_price = excluded.latest_price,
    previous_price = excluded.previous_price,
    first_price = excluded.first_price,
    list_price_with_vat = excluded.list_price_with_vat,
    source_url = excluded.source_url,
    latest_scraped_at = excluded.latest_scraped_at,
    hero_image_url = excluded.hero_image_url,
    gallery_image_urls = excluded.gallery_image_urls,
    short_description = excluded.short_description,
    supplementary_parameters = excluded.supplementary_parameters,
    metadata = excluded.metadata,
    category_tags = excluded.category_tags,
    is_available = excluded.is_available,
    is_preorder = excluded.is_preorder,
    price_points = excluded.price_points,
    updated_at = now();
  get diagnostics v_upserted_slug_rows = row_count;

  delete from public.catalog_slug_state existing
  where existing.product_name_normalized in (
    select product_name_normalized from tmp_changed_slugs
  )
    and not exists (
      select 1
      from public.catalog_slug_seller_state css
      where css.product_name_normalized = existing.product_name_normalized
    );
  get diagnostics v_deleted_slug_rows = row_count;

  return jsonb_build_object(
    'changed_slugs', v_changed_slug_count,
    'upserted_seller_rows', v_upserted_seller_rows,
    'deleted_seller_rows', v_deleted_seller_rows,
    'upserted_slug_rows', v_upserted_slug_rows,
    'deleted_slug_rows', v_deleted_slug_rows
  );
end;
$$;

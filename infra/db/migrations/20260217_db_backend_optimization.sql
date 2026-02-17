-- DB optimization phase 1: indexes + slug-keyed read models

create extension if not exists pg_trgm;
create extension if not exists unaccent;

create index if not exists idx_product_price_snapshots_slug_scraped_id
on public.product_price_snapshots (product_name_normalized, scraped_at, id);

create index if not exists idx_product_price_snapshots_scraped_at_desc
on public.product_price_snapshots (scraped_at desc);

create index if not exists idx_product_price_snapshots_slug_seller_scraped
on public.product_price_snapshots (product_name_normalized, seller, scraped_at);

create index if not exists idx_product_price_snapshots_name_trgm
on public.product_price_snapshots using gin (product_name_original gin_trgm_ops);

create index if not exists idx_product_price_snapshots_code_trgm
on public.product_price_snapshots using gin (product_code gin_trgm_ops);

create or replace function public.seller_priority(seller_id text)
returns integer
language sql
immutable
as $$
  select case lower(coalesce(seller_id, ''))
    when 'tlamagames' then 1
    when 'tlamagase' then 2
    when 'planetaher' then 3
    else 100
  end;
$$;

create or replace function public.extract_category_tags(params jsonb)
returns text[]
language sql
immutable
as $$
  with source_array as (
    select case
      when jsonb_typeof(params) = 'array' then params
      else '[]'::jsonb
    end as payload
  ),
  category_values as (
    select
      trim(elem ->> 'value') as value
    from source_array
    cross join lateral jsonb_array_elements(payload) elem
    where lower(coalesce(elem ->> 'name', '')) similar to '%(kategorie|category)%'
  ),
  raw_tags as (
    select regexp_split_to_table(value, E'\\s*[,;/|]\\s*') as tag
    from category_values
  ),
  normalized as (
    select distinct nullif(trim(tag), '') as tag
    from raw_tags
  )
  select coalesce(array_agg(tag order by tag), '{}'::text[])
  from normalized
  where tag is not null;
$$;

drop materialized view if exists public.catalog_slug_summary;
drop materialized view if exists public.catalog_slug_seller_summary;

create materialized view public.catalog_slug_seller_summary as
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
  where p.product_name_normalized is not null
    and trim(p.product_name_normalized) <> ''
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

create unique index if not exists catalog_slug_seller_summary_slug_seller_idx
on public.catalog_slug_seller_summary (product_name_normalized, seller);

create index if not exists catalog_slug_seller_summary_slug_idx
on public.catalog_slug_seller_summary (product_name_normalized);

create materialized view public.catalog_slug_summary as
with ranked as (
  select
    css.*,
    row_number() over (
      partition by css.product_name_normalized
      order by public.seller_priority(css.seller), css.latest_scraped_at desc
    ) as seller_rank
  from public.catalog_slug_seller_summary css
),
primary_seller as (
  select * from ranked where seller_rank = 1
),
availability as (
  select
    product_name_normalized,
    bool_or(coalesce(availability_label, '') ilike '%Skladem%') as is_available,
    bool_or(coalesce(availability_label, '') ilike '%Předprodej%') as is_preorder
  from public.catalog_slug_seller_summary
  group by product_name_normalized
),
categories as (
  select
    product_name_normalized,
    coalesce(array_agg(distinct tag order by tag), '{}'::text[]) as category_tags
  from (
    select
      product_name_normalized,
      unnest(category_tags) as tag
    from public.catalog_slug_seller_summary
  ) expanded
  group by product_name_normalized
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
  c.category_tags,
  a.is_available,
  a.is_preorder,
  null::jsonb as price_points
from primary_seller p
left join availability a using (product_name_normalized)
left join categories c using (product_name_normalized);

create unique index if not exists catalog_slug_summary_slug_idx
on public.catalog_slug_summary (product_name_normalized);

create index if not exists catalog_slug_summary_name_idx
on public.catalog_slug_summary (product_name);

create index if not exists catalog_slug_summary_latest_price_idx
on public.catalog_slug_summary (latest_price);

create index if not exists catalog_slug_summary_is_available_idx
on public.catalog_slug_summary (is_available);

create index if not exists catalog_slug_summary_is_preorder_idx
on public.catalog_slug_summary (is_preorder);

create index if not exists catalog_slug_summary_category_tags_gin_idx
on public.catalog_slug_summary using gin (category_tags);

create index if not exists catalog_slug_summary_product_name_search_trgm_idx
on public.catalog_slug_summary using gin (product_name_search gin_trgm_ops);

create index if not exists catalog_slug_summary_product_code_trgm_idx
on public.catalog_slug_summary using gin (product_code gin_trgm_ops);

create or replace function public.refresh_catalog_aggregates()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  refresh materialized view public.catalog_slug_seller_summary;
  refresh materialized view public.catalog_slug_summary;
end;
$$;

grant execute on function public.refresh_catalog_aggregates() to public;

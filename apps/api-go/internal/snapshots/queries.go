package snapshots

const sellerMetadataQuery = `
with requested_product as (
  select public.canonical_product_slug(null, null, $1) as canonical_product_id
)
select
  requested.canonical_product_id,
  seller_state.seller,
  seller_state.product_code,
  seller_state.product_name,
  seller_state.currency_code,
  seller_state.availability_label,
  seller_state.stock_status_label,
  seller_state.latest_price::double precision,
  seller_state.previous_price::double precision,
  seller_state.first_price::double precision,
  seller_state.list_price_with_vat::double precision,
  seller_state.source_url,
  seller_state.latest_scraped_at::text,
  seller_state.hero_image_url,
  coalesce(seller_state.gallery_image_urls, '{}'::text[]),
  seller_state.short_description,
  coalesce(seller_state.supplementary_parameters, '[]'::jsonb),
  coalesce(seller_state.metadata, '{}'::jsonb)
from requested_product requested
join public.catalog_slug_seller_state seller_state
  on seller_state.product_name_normalized = requested.canonical_product_id
order by
  case
    when seller_state.seller in ('tlamagames', 'tlamagase') then 0
    else 1
  end,
  seller_state.seller asc;`

const priceHistoryQuery = `
with requested_product as (
  select public.canonical_product_slug(null, null, $1) as canonical_product_id
),
ranked_history as (
  select
    history.*,
    row_number() over (
      partition by history.seller
      order by history.price_date desc
    ) as seller_row_number
  from public.catalog_daily_price_history history
  join requested_product requested
    on requested.canonical_product_id = history.canonical_product_id
)
select
  seller,
  price_date::text,
  closing_price::double precision,
  list_price_with_vat::double precision,
  currency_code,
  last_scraped_at::text,
  snapshot_count
from ranked_history
where $2 = 0 or seller_row_number <= $2
order by seller asc, price_date asc;`

const recentDiscountsQuery = `
select
  product_name_normalized,
  seller,
  product_code,
  product_name,
  currency_code,
  latest_price::double precision,
  case
    when previous_price is not null and latest_price < previous_price
      then previous_price::double precision
    else list_price_with_vat::double precision
  end as reference_price,
  source_url,
  latest_scraped_at::text
from public.catalog_slug_seller_state
where latest_price is not null
  and (
    (previous_price is not null and latest_price < previous_price)
    or (list_price_with_vat is not null and latest_price < list_price_with_vat)
  )
order by latest_scraped_at desc nulls last, product_name_normalized asc, seller asc
limit $1;`

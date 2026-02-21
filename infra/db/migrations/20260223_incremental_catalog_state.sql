-- Phase 2 incremental read-model tables.
-- These tables are designed for incremental upserts by changed slug.
-- Runtime can switch to `catalog_slug_state` via API_CATALOG_SUMMARY_RELATION.

create table if not exists public.catalog_slug_seller_state (
  product_name_normalized text not null,
  seller text not null,
  product_guid uuid,
  product_code text,
  product_name text,
  product_name_search text,
  currency_code char(3),
  availability_label text,
  stock_status_label text,
  latest_price numeric,
  previous_price numeric,
  first_price numeric,
  list_price_with_vat numeric,
  source_url text,
  latest_scraped_at timestamptz,
  hero_image_url text,
  gallery_image_urls text[],
  short_description text,
  supplementary_parameters jsonb,
  metadata jsonb,
  category_tags text[] not null default '{}'::text[],
  price_points jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (product_name_normalized, seller)
);

create index if not exists catalog_slug_seller_state_slug_idx
on public.catalog_slug_seller_state (product_name_normalized);

create table if not exists public.catalog_slug_state (
  product_name_normalized text primary key,
  primary_seller text,
  product_code text,
  product_name text,
  product_name_search text,
  currency_code char(3),
  availability_label text,
  stock_status_label text,
  latest_price numeric,
  previous_price numeric,
  first_price numeric,
  list_price_with_vat numeric,
  source_url text,
  latest_scraped_at timestamptz,
  hero_image_url text,
  gallery_image_urls text[],
  short_description text,
  supplementary_parameters jsonb,
  metadata jsonb,
  category_tags text[] not null default '{}'::text[],
  is_available boolean not null default false,
  is_preorder boolean not null default false,
  price_points jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists catalog_slug_state_name_idx
on public.catalog_slug_state (product_name);

create index if not exists catalog_slug_state_latest_price_idx
on public.catalog_slug_state (latest_price);

create index if not exists catalog_slug_state_is_available_idx
on public.catalog_slug_state (is_available);

create index if not exists catalog_slug_state_is_preorder_idx
on public.catalog_slug_state (is_preorder);

create index if not exists catalog_slug_state_category_tags_gin_idx
on public.catalog_slug_state using gin (category_tags);

create index if not exists catalog_slug_state_product_name_search_trgm_idx
on public.catalog_slug_state using gin (product_name_search gin_trgm_ops);

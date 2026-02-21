-- Snapshot partitioning preparation.
-- This migration is additive and does not cut over reads/writes yet.
-- It prepares a partitioned replacement table plus indexes and partitions.

create table if not exists public.product_price_snapshots_partitioned (
  id bigint not null,
  product_guid uuid,
  product_code text not null,
  product_name_original text not null,
  price_with_vat numeric not null,
  list_price_with_vat numeric,
  currency_code char(3) not null,
  availability_label text,
  stock_status_label text,
  boardgamegeek_rating numeric,
  source_url text not null,
  scraped_at timestamptz not null,
  metadata jsonb not null default '{}'::jsonb,
  hero_image_url text,
  gallery_image_urls text[],
  short_description text,
  supplementary_parameters jsonb,
  product_name_normalized text,
  seller text
) partition by range (scraped_at);

create table if not exists public.product_price_snapshots_partitioned_default
partition of public.product_price_snapshots_partitioned default;

do $$
declare
  partition_start date := date_trunc('month', now())::date - interval '24 month';
  partition_end date := date_trunc('month', now())::date + interval '7 month';
  partition_name text;
begin
  while partition_start < partition_end loop
    partition_name := format(
      'product_price_snapshots_partitioned_%s',
      to_char(partition_start, 'YYYY_MM')
    );
    execute format(
      'create table if not exists public.%I partition of public.product_price_snapshots_partitioned
       for values from (%L) to (%L)',
      partition_name,
      partition_start::timestamptz,
      (partition_start + interval '1 month')::timestamptz
    );
    partition_start := (partition_start + interval '1 month')::date;
  end loop;
end $$;

create unique index if not exists product_price_snapshots_partitioned_id_scraped_key
on public.product_price_snapshots_partitioned (id, scraped_at);

create index if not exists idx_product_price_snapshots_p_slug_scraped_id
on public.product_price_snapshots_partitioned (product_name_normalized, scraped_at, id);

create index if not exists idx_product_price_snapshots_p_scraped_id_desc
on public.product_price_snapshots_partitioned (scraped_at desc, id desc);

create index if not exists idx_product_price_snapshots_p_slug_seller_scraped
on public.product_price_snapshots_partitioned (product_name_normalized, seller, scraped_at);

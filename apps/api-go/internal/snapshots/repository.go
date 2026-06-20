package snapshots

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) BySlug(ctx context.Context, slug string, historyPoints int) ([]Row, error) {
	query, args := buildBySlugQuery(slug, historyPoints)
	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return collect(rows)
}

func (r *Repository) Recent(ctx context.Context, limit int) ([]Row, error) {
	query := `
with latest_ids as (
  select id
  from public.product_price_snapshots
  order by scraped_at desc, id desc
  limit $1
)
select
  p.id,
  p.product_code,
  p.product_name_original,
  p.product_name_normalized,
  p.price_with_vat::double precision,
  p.list_price_with_vat::double precision,
  p.currency_code,
  p.source_url,
  p.scraped_at::text,
  null::text as price_date,
  null::integer as snapshot_count,
  p.availability_label,
  p.stock_status_label,
  p.hero_image_url,
  coalesce(p.gallery_image_urls, '{}'::text[]),
  p.short_description,
  coalesce(p.supplementary_parameters, '[]'::jsonb),
  coalesce(p.metadata, '{}'::jsonb),
  p.seller
from latest_ids l
join public.product_price_snapshots p on p.id = l.id
order by p.scraped_at desc, p.id desc;`
	rows, err := r.db.Query(ctx, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return collect(rows)
}

func collect(rows pgxRows) ([]Row, error) {
	results := make([]Row, 0, 512)
	for rows.Next() {
		item, err := scanSnapshotRow(rows)
		if err != nil {
			return nil, err
		}
		results = append(results, item)
	}
	return results, rows.Err()
}

func scanSnapshotRow(rows pgxRows) (Row, error) {
	var item Row
	err := rows.Scan(
		&item.ID,
		&item.ProductCode,
		&item.ProductNameOriginal,
		&item.ProductNameNormalized,
		&item.PriceWithVat,
		&item.ListPriceWithVat,
		&item.CurrencyCode,
		&item.SourceURL,
		&item.ScrapedAt,
		&item.PriceDate,
		&item.SnapshotCount,
		&item.AvailabilityLabel,
		&item.StockStatusLabel,
		&item.HeroImageURL,
		&item.GalleryImageURLs,
		&item.ShortDescription,
		&item.SupplementaryParameters,
		&item.Metadata,
		&item.Seller,
	)
	return item, err
}

func buildBySlugQuery(slug string, historyPoints int) (string, []any) {
	selectClause := `
select
  row_number() over (order by h.price_date asc, h.seller asc)::bigint as id,
  s.product_code,
  s.product_name,
  h.canonical_product_id,
  h.closing_price::double precision,
  h.list_price_with_vat::double precision,
  h.currency_code,
  s.source_url,
  h.last_scraped_at::text,
  h.price_date::text,
  h.snapshot_count,
  s.availability_label,
  s.stock_status_label,
  s.hero_image_url,
  coalesce(s.gallery_image_urls, '{}'::text[]),
  s.short_description,
  coalesce(s.supplementary_parameters, '[]'::jsonb),
  coalesce(s.metadata, '{}'::jsonb),
  h.seller`

	if historyPoints <= 0 {
		query := selectClause + `
from public.catalog_daily_price_history h
join public.catalog_slug_seller_state s
  on s.seller = h.seller
  and public.canonical_product_slug(
    s.seller,
    s.product_code,
    s.product_name_normalized
  ) = h.canonical_product_id
where h.canonical_product_id = $1
order by h.price_date asc, h.seller asc;`
		return query, []any{slug}
	}

	query := `
with recent_history as (
select *
from public.catalog_daily_price_history
where canonical_product_id = $1
order by price_date desc, seller desc
limit $2
)
` + selectClause + `
from recent_history h
join public.catalog_slug_seller_state s
  on s.seller = h.seller
  and public.canonical_product_slug(
    s.seller,
    s.product_code,
    s.product_name_normalized
  ) = h.canonical_product_id
order by h.price_date asc, h.seller asc;`
	return query, []any{slug, historyPoints}
}

type pgxRows interface {
	Next() bool
	Scan(dest ...any) error
	Err() error
}

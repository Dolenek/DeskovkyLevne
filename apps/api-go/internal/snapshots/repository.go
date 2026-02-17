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

func (r *Repository) BySlug(ctx context.Context, slug string) ([]Row, error) {
	query := `
select
  id,
  product_code,
  product_name_original,
  product_name_normalized,
  price_with_vat::double precision,
  list_price_with_vat::double precision,
  currency_code,
  source_url,
  scraped_at::text,
  availability_label,
  stock_status_label,
  hero_image_url,
  coalesce(gallery_image_urls, '{}'::text[]),
  short_description,
  coalesce(supplementary_parameters, '[]'::jsonb),
  coalesce(metadata, '{}'::jsonb),
  seller
from public.product_price_snapshots
where product_name_normalized = $1
order by scraped_at asc;`
	rows, err := r.db.Query(ctx, query, slug)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return collect(rows)
}

func (r *Repository) Recent(ctx context.Context, limit int) ([]Row, error) {
	query := `
select
  id,
  product_code,
  product_name_original,
  product_name_normalized,
  price_with_vat::double precision,
  list_price_with_vat::double precision,
  currency_code,
  source_url,
  scraped_at::text,
  availability_label,
  stock_status_label,
  hero_image_url,
  coalesce(gallery_image_urls, '{}'::text[]),
  short_description,
  coalesce(supplementary_parameters, '[]'::jsonb),
  coalesce(metadata, '{}'::jsonb),
  seller
from public.product_price_snapshots
order by scraped_at desc
limit $1;`
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

type pgxRows interface {
	Next() bool
	Scan(dest ...any) error
	Err() error
}

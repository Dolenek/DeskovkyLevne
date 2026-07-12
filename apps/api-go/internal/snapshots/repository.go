package snapshots

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (repository *Repository) BySlug(
	ctx context.Context,
	slug string,
	historyPoints int,
) (ProductDetail, error) {
	detail, err := repository.fetchSellerMetadata(ctx, slug)
	if err != nil {
		return ProductDetail{}, err
	}
	if len(detail.Sellers) == 0 {
		return ProductDetail{}, ErrProductNotFound
	}
	if err := repository.attachPriceHistory(ctx, &detail, slug, historyPoints); err != nil {
		return ProductDetail{}, err
	}
	return detail, nil
}

func (repository *Repository) RecentDiscounts(
	ctx context.Context,
	limit int,
) ([]RecentDiscount, error) {
	rows, err := repository.db.Query(ctx, recentDiscountsQuery, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	discounts := make([]RecentDiscount, 0, limit)
	for rows.Next() {
		var discount RecentDiscount
		if err := rows.Scan(
			&discount.ProductNameNormalized,
			&discount.Seller,
			&discount.ProductCode,
			&discount.ProductName,
			&discount.CurrencyCode,
			&discount.CurrentPrice,
			&discount.ReferencePrice,
			&discount.SourceURL,
			&discount.ChangedAt,
		); err != nil {
			return nil, err
		}
		discounts = append(discounts, discount)
	}
	return discounts, rows.Err()
}

func (repository *Repository) Ping(ctx context.Context) error {
	return repository.db.Ping(ctx)
}

func (repository *Repository) fetchSellerMetadata(
	ctx context.Context,
	slug string,
) (ProductDetail, error) {
	rows, err := repository.db.Query(ctx, sellerMetadataQuery, slug)
	if err != nil {
		return ProductDetail{}, err
	}
	defer rows.Close()

	detail := ProductDetail{Sellers: make([]Seller, 0, 8)}
	for rows.Next() {
		var canonicalSlug string
		var seller Seller
		if err := scanSeller(rows, &canonicalSlug, &seller); err != nil {
			return ProductDetail{}, err
		}
		detail.ProductNameNormalized = canonicalSlug
		detail.Sellers = append(detail.Sellers, seller)
	}
	return detail, rows.Err()
}

func scanSeller(rows pgx.Rows, canonicalSlug *string, seller *Seller) error {
	return rows.Scan(
		canonicalSlug,
		&seller.Seller,
		&seller.ProductCode,
		&seller.ProductName,
		&seller.CurrencyCode,
		&seller.AvailabilityLabel,
		&seller.StockStatusLabel,
		&seller.LatestPrice,
		&seller.PreviousPrice,
		&seller.FirstPrice,
		&seller.ListPriceWithVat,
		&seller.SourceURL,
		&seller.LatestScrapedAt,
		&seller.HeroImageURL,
		&seller.GalleryImageURLs,
		&seller.ShortDescription,
		&seller.SupplementaryParameters,
		&seller.Metadata,
	)
}

func (repository *Repository) attachPriceHistory(
	ctx context.Context,
	detail *ProductDetail,
	slug string,
	historyPoints int,
) error {
	rows, err := repository.db.Query(ctx, priceHistoryQuery, slug, historyPoints)
	if err != nil {
		return err
	}
	defer rows.Close()

	sellerIndexes := indexSellers(detail.Sellers)
	for rows.Next() {
		var sellerID string
		var point PricePoint
		if err := rows.Scan(
			&sellerID,
			&point.PriceDate,
			&point.PriceWithVat,
			&point.ListPriceWithVat,
			&point.CurrencyCode,
			&point.ScrapedAt,
			&point.SnapshotCount,
		); err != nil {
			return err
		}
		if sellerIndex, exists := sellerIndexes[sellerID]; exists {
			detail.Sellers[sellerIndex].History = append(
				detail.Sellers[sellerIndex].History,
				point,
			)
		}
	}
	return rows.Err()
}

func indexSellers(sellers []Seller) map[string]int {
	indexes := make(map[string]int, len(sellers))
	for index := range sellers {
		sellers[index].History = make([]PricePoint, 0, 128)
		indexes[sellers[index].Seller] = index
	}
	return indexes
}

func IsProductNotFound(err error) bool {
	return errors.Is(err, ErrProductNotFound)
}

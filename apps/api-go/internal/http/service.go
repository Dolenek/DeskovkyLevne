package http

import (
	"context"
	"strings"
	"time"

	"golang.org/x/sync/singleflight"
	"tlamasite/apps/api-go/internal/cache"
	"tlamasite/apps/api-go/internal/catalog"
	"tlamasite/apps/api-go/internal/snapshots"
)

type CacheTTLConfig struct {
	Catalog    time.Duration
	Search     time.Duration
	Product    time.Duration
	Discounts  time.Duration
	PriceRange time.Duration
}

type ServiceOptions struct {
	CacheNamespace string
	CacheTTL       CacheTTLConfig
}

type catalogRepository interface {
	Fetch(context.Context, catalog.Filters) ([]catalog.Row, int64, error)
	FetchOverview(context.Context) (catalog.Overview, error)
	Search(context.Context, string, string, []string, int) ([]catalog.SuggestionRow, error)
	FetchPriceRange(context.Context, catalog.PriceRangeFilters) (catalog.PriceRange, error)
}

type snapshotRepository interface {
	BySlug(context.Context, string, int) (snapshots.ProductDetail, error)
	RecentDiscounts(context.Context, int) ([]snapshots.RecentDiscount, error)
	Ping(context.Context) error
}

type Service struct {
	catalogRepo    catalogRepository
	snapshotRepo   snapshotRepository
	cacheClient    cache.Client
	cacheNamespace string
	cacheTTL       CacheTTLConfig
	requests       singleflight.Group
}

func NewService(
	catalogRepo catalogRepository,
	snapshotRepo snapshotRepository,
	cacheClient cache.Client,
	options ServiceOptions,
) *Service {
	normalized := normalizeServiceOptions(options)
	return &Service{
		catalogRepo:    catalogRepo,
		snapshotRepo:   snapshotRepo,
		cacheClient:    cacheClient,
		cacheNamespace: normalized.CacheNamespace,
		cacheTTL:       normalized.CacheTTL,
	}
}

func normalizeServiceOptions(options ServiceOptions) ServiceOptions {
	defaults := ServiceOptions{
		CacheNamespace: "api-v2",
		CacheTTL: CacheTTLConfig{
			Catalog:    120 * time.Second,
			Search:     60 * time.Second,
			Product:    300 * time.Second,
			Discounts:  60 * time.Second,
			PriceRange: 180 * time.Second,
		},
	}

	normalized := options
	if strings.TrimSpace(normalized.CacheNamespace) == "" {
		normalized.CacheNamespace = defaults.CacheNamespace
	}
	if normalized.CacheTTL.Catalog <= 0 {
		normalized.CacheTTL.Catalog = defaults.CacheTTL.Catalog
	}
	if normalized.CacheTTL.Search <= 0 {
		normalized.CacheTTL.Search = defaults.CacheTTL.Search
	}
	if normalized.CacheTTL.Product <= 0 {
		normalized.CacheTTL.Product = defaults.CacheTTL.Product
	}
	if normalized.CacheTTL.Discounts <= 0 {
		normalized.CacheTTL.Discounts = defaults.CacheTTL.Discounts
	}
	if normalized.CacheTTL.PriceRange <= 0 {
		normalized.CacheTTL.PriceRange = defaults.CacheTTL.PriceRange
	}
	return normalized
}

type catalogResponse struct {
	Rows  []catalog.Row `json:"rows"`
	Total int64         `json:"total"`
}

type suggestionRowsResponse struct {
	Rows []catalog.SuggestionRow `json:"rows"`
}

type productDetailCacheResponse struct {
	Detail snapshots.ProductDetail `json:"detail"`
}

type priceRangeResponse struct {
	Row catalog.PriceRange `json:"row"`
}

type discountRowsResponse struct {
	Rows []snapshots.RecentDiscount `json:"rows"`
}

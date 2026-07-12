package http

import (
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

type Service struct {
	catalogRepo    *catalog.Repository
	snapshotRepo   *snapshots.Repository
	cacheClient    cache.Client
	cacheNamespace string
	cacheTTL       CacheTTLConfig
	requests       singleflight.Group
}

func NewService(
	catalogRepo *catalog.Repository,
	snapshotRepo *snapshots.Repository,
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

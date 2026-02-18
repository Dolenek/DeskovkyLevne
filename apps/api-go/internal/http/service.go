package http

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"
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
	Recent     time.Duration
	Categories time.Duration
	PriceRange time.Duration
}

type ServiceOptions struct {
	CacheNamespace string
	CacheTTL       CacheTTLConfig
}

type Service struct {
	catalogRepo     *catalog.Repository
	snapshotRepo    *snapshots.Repository
	cacheClient     cache.Client
	cacheNamespace  string
	cacheTTL        CacheTTLConfig
	requests        singleflight.Group
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

func (s *Service) Catalog(
	ctx context.Context,
	filters catalog.Filters,
) ([]catalog.Row, int64, error) {
	key := catalogCacheKey(filters)
	var cached catalogResponse
	if ok := s.readCache(ctx, key, &cached); ok {
		return cached.Rows, cached.Total, nil
	}
	value, err, _ := s.requests.Do("catalog:"+key, func() (any, error) {
		var latest catalogResponse
		if ok := s.readCache(ctx, key, &latest); ok {
			return latest, nil
		}
		rows, total, fetchErr := s.catalogRepo.Fetch(ctx, filters)
		if fetchErr != nil {
			return nil, fetchErr
		}
		payload := catalogResponse{Rows: rows, Total: total}
		s.writeCache(ctx, key, payload, s.cacheTTL.Catalog)
		return payload, nil
	})
	if err != nil {
		return nil, 0, err
	}
	payload := value.(catalogResponse)
	return payload.Rows, payload.Total, nil
}

func (s *Service) Search(
	ctx context.Context,
	query string,
	availability string,
	limit int,
) ([]catalog.SuggestionRow, error) {
	key := fmt.Sprintf(
		"suggest:%s:%s:%d",
		strings.ToLower(strings.TrimSpace(query)),
		normalizeAvailability(availability),
		limit,
	)
	var cached suggestionRowsResponse
	if ok := s.readCache(ctx, key, &cached); ok {
		return cached.Rows, nil
	}
	value, err, _ := s.requests.Do("search:"+key, func() (any, error) {
		var latest suggestionRowsResponse
		if ok := s.readCache(ctx, key, &latest); ok {
			return latest, nil
		}
		rows, fetchErr := s.catalogRepo.Search(ctx, query, availability, limit)
		if fetchErr != nil {
			return nil, fetchErr
		}
		payload := suggestionRowsResponse{Rows: rows}
		s.writeCache(ctx, key, payload, s.cacheTTL.Search)
		return payload, nil
	})
	if err != nil {
		return nil, err
	}
	return value.(suggestionRowsResponse).Rows, nil
}

func (s *Service) ProductSnapshots(
	ctx context.Context,
	slug string,
) ([]snapshots.Row, error) {
	key := "product:" + strings.ToLower(slug)
	var cached snapshotRowsResponse
	if ok := s.readCache(ctx, key, &cached); ok {
		return cached.Rows, nil
	}
	value, err, _ := s.requests.Do("product:"+key, func() (any, error) {
		var latest snapshotRowsResponse
		if ok := s.readCache(ctx, key, &latest); ok {
			return latest, nil
		}
		rows, fetchErr := s.snapshotRepo.BySlug(ctx, slug)
		if fetchErr != nil {
			return nil, fetchErr
		}
		payload := snapshotRowsResponse{Rows: rows}
		s.writeCache(ctx, key, payload, s.cacheTTL.Product)
		return payload, nil
	})
	if err != nil {
		return nil, err
	}
	return value.(snapshotRowsResponse).Rows, nil
}

func (s *Service) RecentSnapshots(
	ctx context.Context,
	limit int,
) ([]snapshots.Row, error) {
	key := fmt.Sprintf("recent:%d", limit)
	var cached snapshotRowsResponse
	if ok := s.readCache(ctx, key, &cached); ok {
		return cached.Rows, nil
	}
	value, err, _ := s.requests.Do("recent:"+key, func() (any, error) {
		var latest snapshotRowsResponse
		if ok := s.readCache(ctx, key, &latest); ok {
			return latest, nil
		}
		rows, fetchErr := s.snapshotRepo.Recent(ctx, limit)
		if fetchErr != nil {
			return nil, fetchErr
		}
		payload := snapshotRowsResponse{Rows: rows}
		s.writeCache(ctx, key, payload, s.cacheTTL.Recent)
		return payload, nil
	})
	if err != nil {
		return nil, err
	}
	return value.(snapshotRowsResponse).Rows, nil
}

func (s *Service) CategoryCounts(
	ctx context.Context,
	availability string,
) ([]catalog.CategoryCount, error) {
	key := "categories:" + normalizeAvailability(availability)
	var cached categoryRowsResponse
	if ok := s.readCache(ctx, key, &cached); ok {
		return cached.Rows, nil
	}
	value, err, _ := s.requests.Do("categories:"+key, func() (any, error) {
		var latest categoryRowsResponse
		if ok := s.readCache(ctx, key, &latest); ok {
			return latest, nil
		}
		rows, fetchErr := s.catalogRepo.FetchCategoryCounts(ctx, catalog.CategoryFilters{
			Availability: availability,
		})
		if fetchErr != nil {
			return nil, fetchErr
		}
		payload := categoryRowsResponse{Rows: rows}
		s.writeCache(ctx, key, payload, s.cacheTTL.Categories)
		return payload, nil
	})
	if err != nil {
		return nil, err
	}
	return value.(categoryRowsResponse).Rows, nil
}

func (s *Service) PriceRange(
	ctx context.Context,
	filters catalog.PriceRangeFilters,
) (catalog.PriceRange, error) {
	key := priceRangeCacheKey(filters)
	var cached priceRangeResponse
	if ok := s.readCache(ctx, key, &cached); ok {
		return cached.Row, nil
	}
	value, err, _ := s.requests.Do("price-range:"+key, func() (any, error) {
		var latest priceRangeResponse
		if ok := s.readCache(ctx, key, &latest); ok {
			return latest, nil
		}
		row, fetchErr := s.catalogRepo.FetchPriceRange(ctx, filters)
		if fetchErr != nil {
			return nil, fetchErr
		}
		payload := priceRangeResponse{Row: row}
		s.writeCache(ctx, key, payload, s.cacheTTL.PriceRange)
		return payload, nil
	})
	if err != nil {
		return catalog.PriceRange{}, err
	}
	return value.(priceRangeResponse).Row, nil
}

func (s *Service) readCache(ctx context.Context, key string, target any) bool {
	if s.cacheClient == nil {
		return false
	}
	payload, hit, err := s.cacheClient.Get(ctx, s.namespacedCacheKey(key))
	if err != nil || !hit {
		return false
	}
	if err := json.Unmarshal([]byte(payload), target); err != nil {
		return false
	}
	return true
}

func (s *Service) writeCache(ctx context.Context, key string, value any, ttl time.Duration) {
	if s.cacheClient == nil || ttl <= 0 {
		return
	}
	payload, err := json.Marshal(value)
	if err != nil {
		return
	}
	_ = s.cacheClient.Set(ctx, s.namespacedCacheKey(key), string(payload), ttl)
}

func (s *Service) namespacedCacheKey(key string) string {
	if s.cacheNamespace == "" {
		return key
	}
	return s.cacheNamespace + ":" + key
}

func catalogCacheKey(filters catalog.Filters) string {
	categories := append([]string(nil), filters.Categories...)
	sort.Strings(categories)
	parts := []string{
		normalizeAvailability(filters.Availability),
		fmt.Sprintf("min:%s", floatPtrKey(filters.MinPrice)),
		fmt.Sprintf("max:%s", floatPtrKey(filters.MaxPrice)),
		fmt.Sprintf("q:%s", strings.ToLower(strings.TrimSpace(filters.Query))),
		fmt.Sprintf("cats:%s", strings.Join(categories, "|")),
		fmt.Sprintf("l:%d", filters.Limit),
		fmt.Sprintf("o:%d", filters.Offset),
	}
	return "catalog:" + strings.Join(parts, ";")
}

func priceRangeCacheKey(filters catalog.PriceRangeFilters) string {
	categories := append([]string(nil), filters.Categories...)
	sort.Strings(categories)
	return fmt.Sprintf(
		"price-range:%s:cats=%s",
		normalizeAvailability(filters.Availability),
		strings.Join(categories, "|"),
	)
}

func normalizeAvailability(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}

func floatPtrKey(value *float64) string {
	if value == nil {
		return "nil"
	}
	return fmt.Sprintf("%.4f", *value)
}

func normalizeServiceOptions(options ServiceOptions) ServiceOptions {
	defaults := ServiceOptions{
		CacheNamespace: "api-v1",
		CacheTTL: CacheTTLConfig{
			Catalog:    120 * time.Second,
			Search:     60 * time.Second,
			Product:    300 * time.Second,
			Recent:     120 * time.Second,
			Categories: 600 * time.Second,
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
	if normalized.CacheTTL.Recent <= 0 {
		normalized.CacheTTL.Recent = defaults.CacheTTL.Recent
	}
	if normalized.CacheTTL.Categories <= 0 {
		normalized.CacheTTL.Categories = defaults.CacheTTL.Categories
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

type snapshotRowsResponse struct {
	Rows []snapshots.Row `json:"rows"`
}

type categoryRowsResponse struct {
	Rows []catalog.CategoryCount `json:"rows"`
}

type priceRangeResponse struct {
	Row catalog.PriceRange `json:"row"`
}

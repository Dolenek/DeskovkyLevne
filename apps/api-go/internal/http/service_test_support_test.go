package http

import (
	"context"
	"sync"
	"time"

	"tlamasite/apps/api-go/internal/cache"
	"tlamasite/apps/api-go/internal/catalog"
	"tlamasite/apps/api-go/internal/snapshots"
)

type fakeCatalogRepository struct {
	fetch           func(context.Context, catalog.Filters) ([]catalog.Row, int64, error)
	fetchOverview   func(context.Context) (catalog.Overview, error)
	search          func(context.Context, string, string, []string, int) ([]catalog.SuggestionRow, error)
	fetchPriceRange func(context.Context, catalog.PriceRangeFilters) (catalog.PriceRange, error)
}

func (repository *fakeCatalogRepository) Fetch(
	ctx context.Context,
	filters catalog.Filters,
) ([]catalog.Row, int64, error) {
	if repository.fetch == nil {
		return nil, 0, nil
	}
	return repository.fetch(ctx, filters)
}

func (repository *fakeCatalogRepository) FetchOverview(
	ctx context.Context,
) (catalog.Overview, error) {
	if repository.fetchOverview == nil {
		return catalog.Overview{}, nil
	}
	return repository.fetchOverview(ctx)
}

func (repository *fakeCatalogRepository) Search(
	ctx context.Context,
	query string,
	availability string,
	productCodes []string,
	limit int,
) ([]catalog.SuggestionRow, error) {
	if repository.search == nil {
		return nil, nil
	}
	return repository.search(ctx, query, availability, productCodes, limit)
}

func (repository *fakeCatalogRepository) FetchPriceRange(
	ctx context.Context,
	filters catalog.PriceRangeFilters,
) (catalog.PriceRange, error) {
	if repository.fetchPriceRange == nil {
		return catalog.PriceRange{}, nil
	}
	return repository.fetchPriceRange(ctx, filters)
}

type fakeSnapshotRepository struct {
	bySlug          func(context.Context, string, int) (snapshots.ProductDetail, error)
	recentDiscounts func(context.Context, int) ([]snapshots.RecentDiscount, error)
	ping            func(context.Context) error
}

func (repository *fakeSnapshotRepository) BySlug(
	ctx context.Context,
	slug string,
	historyPoints int,
) (snapshots.ProductDetail, error) {
	if repository.bySlug == nil {
		return snapshots.ProductDetail{}, nil
	}
	return repository.bySlug(ctx, slug, historyPoints)
}

func (repository *fakeSnapshotRepository) RecentDiscounts(
	ctx context.Context,
	limit int,
) ([]snapshots.RecentDiscount, error) {
	if repository.recentDiscounts == nil {
		return nil, nil
	}
	return repository.recentDiscounts(ctx, limit)
}

func (repository *fakeSnapshotRepository) Ping(ctx context.Context) error {
	if repository.ping == nil {
		return nil
	}
	return repository.ping(ctx)
}

type recordingCache struct {
	mutex    sync.Mutex
	values   map[string]string
	getError error
	setError error
	getCalls int
	setCalls int
}

func newRecordingCache() *recordingCache {
	return &recordingCache{values: make(map[string]string)}
}

func (cache *recordingCache) Get(_ context.Context, key string) (string, bool, error) {
	cache.mutex.Lock()
	defer cache.mutex.Unlock()
	cache.getCalls++
	if cache.getError != nil {
		return "", false, cache.getError
	}
	value, exists := cache.values[key]
	return value, exists, nil
}

func (cache *recordingCache) Set(
	_ context.Context,
	key string,
	value string,
	_ time.Duration,
) error {
	cache.mutex.Lock()
	defer cache.mutex.Unlock()
	cache.setCalls++
	if cache.setError != nil {
		return cache.setError
	}
	cache.values[key] = value
	return nil
}

func (cache *recordingCache) Close() error { return nil }

func newTestService(
	catalogRepo catalogRepository,
	snapshotRepo snapshotRepository,
	cacheClient *recordingCache,
) *Service {
	if catalogRepo == nil {
		catalogRepo = &fakeCatalogRepository{}
	}
	if snapshotRepo == nil {
		snapshotRepo = &fakeSnapshotRepository{}
	}
	var effectiveCache cache.Client
	if cacheClient != nil {
		effectiveCache = cacheClient
	}
	return NewService(catalogRepo, snapshotRepo, effectiveCache, ServiceOptions{
		CacheNamespace: "test",
		CacheTTL: CacheTTLConfig{
			Catalog: time.Minute, Search: time.Minute, Product: time.Minute,
			Discounts: time.Minute, PriceRange: time.Minute,
		},
	})
}

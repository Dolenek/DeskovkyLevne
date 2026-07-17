package http

import (
	"context"
	"errors"
	"testing"
	"time"

	"tlamasite/apps/api-go/internal/catalog"
)

func TestNormalizeServiceOptionsAppliesDefaults(t *testing.T) {
	normalized := normalizeServiceOptions(ServiceOptions{})
	if normalized.CacheNamespace != "api-v2" {
		t.Fatalf("unexpected namespace %q", normalized.CacheNamespace)
	}
	if normalized.CacheTTL.Catalog != 120*time.Second ||
		normalized.CacheTTL.Product != 300*time.Second ||
		normalized.CacheTTL.PriceRange != 180*time.Second {
		t.Fatalf("unexpected default TTLs: %#v", normalized.CacheTTL)
	}
}

func TestCatalogCachesSuccessfulRepositoryResponse(t *testing.T) {
	cacheClient := newRecordingCache()
	fetchCalls := 0
	productSlug := "alpha"
	repository := &fakeCatalogRepository{
		fetch: func(_ context.Context, filters catalog.Filters) ([]catalog.Row, int64, error) {
			fetchCalls++
			if filters.Availability != "available" {
				t.Fatalf("unexpected filters: %#v", filters)
			}
			return []catalog.Row{{ProductNameNormalized: &productSlug}}, 1, nil
		},
	}
	service := newTestService(repository, nil, cacheClient)
	filters := catalog.Filters{Availability: "available", Limit: 20}

	for range 2 {
		rows, total, err := service.Catalog(context.Background(), filters)
		if err != nil || total != 1 || len(rows) != 1 {
			t.Fatalf("unexpected catalog result: rows=%#v total=%d err=%v", rows, total, err)
		}
	}
	if fetchCalls != 1 {
		t.Fatalf("expected one repository fetch, got %d", fetchCalls)
	}
	if cacheClient.setCalls != 1 {
		t.Fatalf("expected one cache write, got %d", cacheClient.setCalls)
	}
}

func TestCatalogKeepsDistinctFilterCacheKeys(t *testing.T) {
	cacheClient := newRecordingCache()
	fetchCalls := 0
	repository := &fakeCatalogRepository{
		fetch: func(_ context.Context, _ catalog.Filters) ([]catalog.Row, int64, error) {
			fetchCalls++
			return []catalog.Row{}, 0, nil
		},
	}
	service := newTestService(repository, nil, cacheClient)

	_, _, _ = service.Catalog(context.Background(), catalog.Filters{Limit: 20, Offset: 0})
	_, _, _ = service.Catalog(context.Background(), catalog.Filters{Limit: 20, Offset: 20})
	if fetchCalls != 2 {
		t.Fatalf("distinct filters shared a cache entry; fetches=%d", fetchCalls)
	}
}

func TestRandomCatalogBypassesCache(t *testing.T) {
	cacheClient := newRecordingCache()
	fetchCalls := 0
	repository := &fakeCatalogRepository{
		fetch: func(_ context.Context, _ catalog.Filters) ([]catalog.Row, int64, error) {
			fetchCalls++
			return nil, 0, nil
		},
	}
	service := newTestService(repository, nil, cacheClient)
	seed := int64(42)
	filters := catalog.Filters{RandomSeed: &seed, Limit: 4}

	_, _, _ = service.Catalog(context.Background(), filters)
	_, _, _ = service.Catalog(context.Background(), filters)
	if fetchCalls != 2 || cacheClient.getCalls != 0 || cacheClient.setCalls != 0 {
		t.Fatalf(
			"random catalog used cache: fetch=%d get=%d set=%d",
			fetchCalls,
			cacheClient.getCalls,
			cacheClient.setCalls,
		)
	}
}

func TestCatalogDoesNotCacheRepositoryErrors(t *testing.T) {
	cacheClient := newRecordingCache()
	fetchCalls := 0
	repository := &fakeCatalogRepository{
		fetch: func(_ context.Context, _ catalog.Filters) ([]catalog.Row, int64, error) {
			fetchCalls++
			if fetchCalls == 1 {
				return nil, 0, errors.New("database unavailable")
			}
			return []catalog.Row{}, 0, nil
		},
	}
	service := newTestService(repository, nil, cacheClient)
	filters := catalog.Filters{Limit: 20}

	if _, _, err := service.Catalog(context.Background(), filters); err == nil {
		t.Fatal("expected first repository error")
	}
	if _, _, err := service.Catalog(context.Background(), filters); err != nil {
		t.Fatalf("second repository fetch failed: %v", err)
	}
	if fetchCalls != 2 || cacheClient.setCalls != 1 {
		t.Fatalf("unexpected retry/cache calls: fetch=%d set=%d", fetchCalls, cacheClient.setCalls)
	}
}

func TestSearchAndPriceRangeForwardRepositoryInputs(t *testing.T) {
	productSlug := "alpha"
	repository := &fakeCatalogRepository{
		search: func(
			_ context.Context,
			query string,
			availability string,
			productCodes []string,
			limit int,
		) ([]catalog.SuggestionRow, error) {
			if query != "alpha" || availability != "available" || limit != 12 || productCodes[0] != "A-1" {
				t.Fatalf("unexpected search inputs: %q %q %#v %d", query, availability, productCodes, limit)
			}
			return []catalog.SuggestionRow{{ProductNameNormalized: &productSlug}}, nil
		},
		fetchPriceRange: func(
			_ context.Context,
			filters catalog.PriceRangeFilters,
		) (catalog.PriceRange, error) {
			if filters.Availability != "preorder" || filters.Categories[0] != "fantasy" {
				t.Fatalf("unexpected price filters: %#v", filters)
			}
			return catalog.PriceRange{}, nil
		},
	}
	service := newTestService(repository, nil, nil)

	rows, err := service.Search(context.Background(), "alpha", "available", []string{"A-1"}, 12)
	if err != nil || len(rows) != 1 {
		t.Fatalf("unexpected search result: %#v, %v", rows, err)
	}
	_, err = service.PriceRange(context.Background(), catalog.PriceRangeFilters{
		Availability: "preorder",
		Categories:   []string{"fantasy"},
	})
	if err != nil {
		t.Fatalf("price range: %v", err)
	}
}

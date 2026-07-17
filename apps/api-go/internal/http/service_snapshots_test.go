package http

import (
	"context"
	"errors"
	"testing"

	"tlamasite/apps/api-go/internal/snapshots"
)

func TestProductDetailCachesBySlugAndHistoryLimit(t *testing.T) {
	cacheClient := newRecordingCache()
	fetchCalls := 0
	repository := &fakeSnapshotRepository{
		bySlug: func(_ context.Context, slug string, historyPoints int) (snapshots.ProductDetail, error) {
			fetchCalls++
			return snapshots.ProductDetail{ProductNameNormalized: slug}, nil
		},
	}
	service := newTestService(nil, repository, cacheClient)

	for range 2 {
		detail, err := service.ProductDetail(context.Background(), "alpha", 100)
		if err != nil || detail.ProductNameNormalized != "alpha" {
			t.Fatalf("unexpected product detail: %#v, %v", detail, err)
		}
	}
	_, _ = service.ProductDetail(context.Background(), "alpha", 200)
	_, _ = service.ProductDetail(context.Background(), "beta", 100)
	if fetchCalls != 3 {
		t.Fatalf("product cache keys collided; repository calls=%d", fetchCalls)
	}
}

func TestProductDetailPropagatesNotFoundWithoutCachingIt(t *testing.T) {
	cacheClient := newRecordingCache()
	fetchCalls := 0
	repository := &fakeSnapshotRepository{
		bySlug: func(_ context.Context, _ string, _ int) (snapshots.ProductDetail, error) {
			fetchCalls++
			return snapshots.ProductDetail{}, snapshots.ErrProductNotFound
		},
	}
	service := newTestService(nil, repository, cacheClient)

	for range 2 {
		_, err := service.ProductDetail(context.Background(), "missing", 0)
		if !snapshots.IsProductNotFound(err) {
			t.Fatalf("expected not-found error, got %v", err)
		}
	}
	if fetchCalls != 2 || cacheClient.setCalls != 0 {
		t.Fatalf("not-found response was cached: fetch=%d set=%d", fetchCalls, cacheClient.setCalls)
	}
}

func TestRecentDiscountsAndReadyPropagateRepositoryResults(t *testing.T) {
	readinessError := errors.New("database unavailable")
	repository := &fakeSnapshotRepository{
		recentDiscounts: func(_ context.Context, limit int) ([]snapshots.RecentDiscount, error) {
			if limit != 7 {
				t.Fatalf("unexpected discount limit %d", limit)
			}
			return []snapshots.RecentDiscount{{ProductNameNormalized: "alpha", Seller: "tlama"}}, nil
		},
		ping: func(context.Context) error { return readinessError },
	}
	service := newTestService(nil, repository, nil)

	rows, err := service.RecentDiscounts(context.Background(), 7)
	if err != nil || len(rows) != 1 || rows[0].Seller != "tlama" {
		t.Fatalf("unexpected discounts: %#v, %v", rows, err)
	}
	if err := service.Ready(context.Background()); !errors.Is(err, readinessError) {
		t.Fatalf("unexpected readiness error: %v", err)
	}
}

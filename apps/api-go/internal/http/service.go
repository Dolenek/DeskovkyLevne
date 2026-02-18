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

type Service struct {
	catalogRepo  *catalog.Repository
	snapshotRepo *snapshots.Repository
	cacheClient  cache.Client
	requests     singleflight.Group
}

func NewService(
	catalogRepo *catalog.Repository,
	snapshotRepo *snapshots.Repository,
	cacheClient cache.Client,
) *Service {
	return &Service{
		catalogRepo:  catalogRepo,
		snapshotRepo: snapshotRepo,
		cacheClient:  cacheClient,
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
		s.writeCache(ctx, key, payload, 120*time.Second)
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
		s.writeCache(ctx, key, payload, 60*time.Second)
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
		s.writeCache(ctx, key, payload, 300*time.Second)
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
		s.writeCache(ctx, key, payload, 120*time.Second)
		return payload, nil
	})
	if err != nil {
		return nil, err
	}
	return value.(snapshotRowsResponse).Rows, nil
}

func (s *Service) CategoryCounts(ctx context.Context) ([]catalog.CategoryCount, error) {
	key := "categories:list"
	var cached categoryRowsResponse
	if ok := s.readCache(ctx, key, &cached); ok {
		return cached.Rows, nil
	}
	value, err, _ := s.requests.Do("categories:"+key, func() (any, error) {
		var latest categoryRowsResponse
		if ok := s.readCache(ctx, key, &latest); ok {
			return latest, nil
		}
		rows, fetchErr := s.catalogRepo.FetchCategoryCounts(ctx)
		if fetchErr != nil {
			return nil, fetchErr
		}
		payload := categoryRowsResponse{Rows: rows}
		s.writeCache(ctx, key, payload, 600*time.Second)
		return payload, nil
	})
	if err != nil {
		return nil, err
	}
	return value.(categoryRowsResponse).Rows, nil
}

func (s *Service) readCache(ctx context.Context, key string, target any) bool {
	if s.cacheClient == nil {
		return false
	}
	payload, hit, err := s.cacheClient.Get(ctx, key)
	if err != nil || !hit {
		return false
	}
	if err := json.Unmarshal([]byte(payload), target); err != nil {
		return false
	}
	return true
}

func (s *Service) writeCache(ctx context.Context, key string, value any, ttl time.Duration) {
	if s.cacheClient == nil {
		return
	}
	payload, err := json.Marshal(value)
	if err != nil {
		return
	}
	_ = s.cacheClient.Set(ctx, key, string(payload), ttl)
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

func normalizeAvailability(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}

func floatPtrKey(value *float64) string {
	if value == nil {
		return "nil"
	}
	return fmt.Sprintf("%.4f", *value)
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

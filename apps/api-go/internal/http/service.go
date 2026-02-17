package http

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"tlamasite/apps/api-go/internal/cache"
	"tlamasite/apps/api-go/internal/catalog"
	"tlamasite/apps/api-go/internal/snapshots"
)

type Service struct {
	catalogRepo  *catalog.Repository
	snapshotRepo *snapshots.Repository
	cacheClient  cache.Client
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
	rows, total, err := s.catalogRepo.Fetch(ctx, filters)
	if err != nil {
		return nil, 0, err
	}
	payload := catalogResponse{Rows: rows, Total: total}
	s.writeCache(ctx, key, payload, 120*time.Second)
	return rows, total, nil
}

func (s *Service) Search(
	ctx context.Context,
	query string,
	availability string,
	limit int,
) ([]catalog.Row, error) {
	key := fmt.Sprintf("suggest:%s:%s:%d", strings.ToLower(query), availability, limit)
	var cached rowsResponse
	if ok := s.readCache(ctx, key, &cached); ok {
		return cached.Rows, nil
	}
	rows, err := s.catalogRepo.Search(ctx, query, availability, limit)
	if err != nil {
		return nil, err
	}
	s.writeCache(ctx, key, rowsResponse{Rows: rows}, 60*time.Second)
	return rows, nil
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
	rows, err := s.snapshotRepo.BySlug(ctx, slug)
	if err != nil {
		return nil, err
	}
	s.writeCache(ctx, key, snapshotRowsResponse{Rows: rows}, 300*time.Second)
	return rows, nil
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
	rows, err := s.snapshotRepo.Recent(ctx, limit)
	if err != nil {
		return nil, err
	}
	s.writeCache(ctx, key, snapshotRowsResponse{Rows: rows}, 120*time.Second)
	return rows, nil
}

func (s *Service) CategoryCounts(ctx context.Context) ([]catalog.CategoryCount, error) {
	key := "categories:list"
	var cached categoryRowsResponse
	if ok := s.readCache(ctx, key, &cached); ok {
		return cached.Rows, nil
	}
	rows, err := s.catalogRepo.FetchCategoryCounts(ctx)
	if err != nil {
		return nil, err
	}
	s.writeCache(ctx, key, categoryRowsResponse{Rows: rows}, 600*time.Second)
	return rows, nil
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
	parts := []string{
		filters.Availability,
		fmt.Sprintf("min:%v", filters.MinPrice),
		fmt.Sprintf("max:%v", filters.MaxPrice),
		fmt.Sprintf("q:%s", strings.ToLower(filters.Query)),
		fmt.Sprintf("cats:%s", strings.Join(filters.Categories, "|")),
		fmt.Sprintf("l:%d", filters.Limit),
		fmt.Sprintf("o:%d", filters.Offset),
	}
	return "catalog:" + strings.Join(parts, ";")
}

type catalogResponse struct {
	Rows  []catalog.Row `json:"rows"`
	Total int64         `json:"total"`
}

type rowsResponse struct {
	Rows []catalog.Row `json:"rows"`
}

type snapshotRowsResponse struct {
	Rows []snapshots.Row `json:"rows"`
}

type categoryRowsResponse struct {
	Rows []catalog.CategoryCount `json:"rows"`
}

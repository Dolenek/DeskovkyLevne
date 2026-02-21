package http

import (
	"context"
	"fmt"
	"strings"

	"tlamasite/apps/api-go/internal/snapshots"
)

func (s *Service) ProductSnapshots(
	ctx context.Context,
	slug string,
	historyPoints int,
) ([]snapshots.Row, error) {
	cacheKey := productCacheKey(slug, historyPoints)
	payload, err := fetchCached[snapshotRowsResponse](
		ctx,
		s,
		"product",
		cacheKey,
		s.cacheTTL.Product,
		func(innerCtx context.Context) (snapshotRowsResponse, error) {
			rows, fetchErr := s.snapshotRepo.BySlug(innerCtx, slug, historyPoints)
			if fetchErr != nil {
				return snapshotRowsResponse{}, fetchErr
			}
			return snapshotRowsResponse{Rows: rows}, nil
		},
	)
	if err != nil {
		return nil, err
	}
	return payload.Rows, nil
}

func (s *Service) RecentSnapshots(
	ctx context.Context,
	limit int,
) ([]snapshots.Row, error) {
	cacheKey := fmt.Sprintf("recent:%d", limit)
	payload, err := fetchCached[snapshotRowsResponse](
		ctx,
		s,
		"recent",
		cacheKey,
		s.cacheTTL.Recent,
		func(innerCtx context.Context) (snapshotRowsResponse, error) {
			rows, fetchErr := s.snapshotRepo.Recent(innerCtx, limit)
			if fetchErr != nil {
				return snapshotRowsResponse{}, fetchErr
			}
			return snapshotRowsResponse{Rows: rows}, nil
		},
	)
	if err != nil {
		return nil, err
	}
	return payload.Rows, nil
}

func productCacheKey(slug string, historyPoints int) string {
	return fmt.Sprintf("product:%s:points=%d", strings.ToLower(strings.TrimSpace(slug)), historyPoints)
}

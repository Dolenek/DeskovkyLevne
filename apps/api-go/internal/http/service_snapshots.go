package http

import (
	"context"
	"fmt"

	"tlamasite/apps/api-go/internal/snapshots"
)

func (s *Service) ProductDetail(
	ctx context.Context,
	slug string,
	historyPoints int,
) (snapshots.ProductDetail, error) {
	cacheKey := productCacheKey(slug, historyPoints)
	payload, err := fetchCached[productDetailCacheResponse](
		ctx,
		s,
		"product",
		cacheKey,
		s.cacheTTL.Product,
		func(innerCtx context.Context) (productDetailCacheResponse, error) {
			detail, fetchErr := s.snapshotRepo.BySlug(innerCtx, slug, historyPoints)
			if fetchErr != nil {
				return productDetailCacheResponse{}, fetchErr
			}
			return productDetailCacheResponse{Detail: detail}, nil
		},
	)
	if err != nil {
		return snapshots.ProductDetail{}, err
	}
	return payload.Detail, nil
}

func (s *Service) RecentDiscounts(
	ctx context.Context,
	limit int,
) ([]snapshots.RecentDiscount, error) {
	cacheKey := fmt.Sprintf("discounts:%d", limit)
	payload, err := fetchCached[discountRowsResponse](
		ctx,
		s,
		"discounts",
		cacheKey,
		s.cacheTTL.Discounts,
		func(innerCtx context.Context) (discountRowsResponse, error) {
			rows, fetchErr := s.snapshotRepo.RecentDiscounts(innerCtx, limit)
			if fetchErr != nil {
				return discountRowsResponse{}, fetchErr
			}
			return discountRowsResponse{Rows: rows}, nil
		},
	)
	if err != nil {
		return nil, err
	}
	return payload.Rows, nil
}

func (s *Service) Ready(ctx context.Context) error {
	return s.snapshotRepo.Ping(ctx)
}

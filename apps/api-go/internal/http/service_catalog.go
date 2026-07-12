package http

import (
	"context"

	"tlamasite/apps/api-go/internal/catalog"
)

func (s *Service) Catalog(
	ctx context.Context,
	filters catalog.Filters,
) ([]catalog.Row, int64, error) {
	if filters.RandomSeed != nil {
		return s.catalogRepo.Fetch(ctx, filters)
	}

	cacheKey := catalogCacheKey(filters)
	payload, err := fetchCached[catalogResponse](
		ctx,
		s,
		"catalog",
		cacheKey,
		s.cacheTTL.Catalog,
		func(innerCtx context.Context) (catalogResponse, error) {
			rows, total, fetchErr := s.catalogRepo.Fetch(innerCtx, filters)
			if fetchErr != nil {
				return catalogResponse{}, fetchErr
			}
			return catalogResponse{Rows: rows, Total: total}, nil
		},
	)
	if err != nil {
		return nil, 0, err
	}
	return payload.Rows, payload.Total, nil
}

func (s *Service) CatalogOverview(ctx context.Context) (catalog.Overview, error) {
	return fetchCached[catalog.Overview](
		ctx,
		s,
		"catalog-overview",
		"catalog-overview",
		s.cacheTTL.Catalog,
		func(innerCtx context.Context) (catalog.Overview, error) {
			return s.catalogRepo.FetchOverview(innerCtx)
		},
	)
}

func (s *Service) Search(
	ctx context.Context,
	query string,
	availability string,
	productCodes []string,
	limit int,
) ([]catalog.SuggestionRow, error) {
	cacheKey := searchCacheKey(query, availability, productCodes, limit)
	payload, err := fetchCached[suggestionRowsResponse](
		ctx,
		s,
		"search",
		cacheKey,
		s.cacheTTL.Search,
		func(innerCtx context.Context) (suggestionRowsResponse, error) {
			rows, fetchErr := s.catalogRepo.Search(
				innerCtx, query, availability, productCodes, limit,
			)
			if fetchErr != nil {
				return suggestionRowsResponse{}, fetchErr
			}
			return suggestionRowsResponse{Rows: rows}, nil
		},
	)
	if err != nil {
		return nil, err
	}
	return payload.Rows, nil
}

func (s *Service) PriceRange(
	ctx context.Context,
	filters catalog.PriceRangeFilters,
) (catalog.PriceRange, error) {
	cacheKey := priceRangeCacheKey(filters)
	payload, err := fetchCached[priceRangeResponse](
		ctx,
		s,
		"price-range",
		cacheKey,
		s.cacheTTL.PriceRange,
		func(innerCtx context.Context) (priceRangeResponse, error) {
			row, fetchErr := s.catalogRepo.FetchPriceRange(innerCtx, filters)
			if fetchErr != nil {
				return priceRangeResponse{}, fetchErr
			}
			return priceRangeResponse{Row: row}, nil
		},
	)
	if err != nil {
		return catalog.PriceRange{}, err
	}
	return payload.Row, nil
}

func (s *Service) FilterOptions(_ context.Context) (catalog.FilterOptions, error) {
	return catalog.StaticFilterOptions(), nil
}

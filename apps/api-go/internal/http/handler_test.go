package http

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
	"tlamasite/apps/api-go/internal/catalog"
	"tlamasite/apps/api-go/internal/snapshots"
)

type fakeService struct {
	catalog         func(ctx context.Context, filters catalog.Filters) ([]catalog.Row, int64, error)
	catalogOverview func(ctx context.Context) (catalog.Overview, error)
	productDetail   func(ctx context.Context, slug string, historyPoints int) (snapshots.ProductDetail, error)
	priceRange      func(ctx context.Context, filters catalog.PriceRangeFilters) (catalog.PriceRange, error)
	ready           func(ctx context.Context) error
}

func (f *fakeService) Catalog(
	ctx context.Context,
	filters catalog.Filters,
) ([]catalog.Row, int64, error) {
	if f.catalog != nil {
		return f.catalog(ctx, filters)
	}
	return nil, 0, nil
}

func (f *fakeService) CatalogOverview(ctx context.Context) (catalog.Overview, error) {
	if f.catalogOverview != nil {
		return f.catalogOverview(ctx)
	}
	return catalog.Overview{}, nil
}

func (f *fakeService) Search(_ context.Context, _ string, _ string, _ int) ([]catalog.SuggestionRow, error) {
	return nil, nil
}

func (f *fakeService) ProductDetail(
	ctx context.Context,
	slug string,
	historyPoints int,
) (snapshots.ProductDetail, error) {
	if f.productDetail != nil {
		return f.productDetail(ctx, slug, historyPoints)
	}
	return snapshots.ProductDetail{}, nil
}

func (f *fakeService) RecentDiscounts(_ context.Context, _ int) ([]snapshots.RecentDiscount, error) {
	return nil, nil
}

func (f *fakeService) PriceRange(
	ctx context.Context,
	filters catalog.PriceRangeFilters,
) (catalog.PriceRange, error) {
	if f.priceRange != nil {
		return f.priceRange(ctx, filters)
	}
	return catalog.PriceRange{}, nil
}

func (f *fakeService) FilterOptions(_ context.Context) (catalog.FilterOptions, error) {
	return catalog.StaticFilterOptions(), nil
}

func (f *fakeService) Ready(ctx context.Context) error {
	if f.ready != nil {
		return f.ready(ctx)
	}
	return nil
}

func TestHandlerPriceRangeParsesFilters(t *testing.T) {
	var captured catalog.PriceRangeFilters
	handler := NewHandler(&fakeService{
		priceRange: func(_ context.Context, filters catalog.PriceRangeFilters) (catalog.PriceRange, error) {
			captured = filters
			return catalog.PriceRange{
				MinPrice: floatPtr(99),
				MaxPrice: floatPtr(799),
			}, nil
		},
	}, 200)

	req := httptest.NewRequest(
		http.MethodGet,
		"/api/v1/meta/price-range?availability=available&categories=strategicka,fantasy&players=2-4&playtime=30-60&age=8&price_movement=decreased",
		nil,
	)
	rec := httptest.NewRecorder()

	handler.PriceRange(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	if captured.Availability != "available" {
		t.Fatalf("expected availability=available, got %q", captured.Availability)
	}
	if len(captured.Categories) != 2 || captured.Categories[0] != "strategicka" || captured.Categories[1] != "fantasy" {
		t.Fatalf("unexpected categories: %#v", captured.Categories)
	}
	if len(captured.PlayerRanges) != 1 || captured.PlayerRanges[0] != "2-4" {
		t.Fatalf("unexpected players: %#v", captured.PlayerRanges)
	}
	if len(captured.PlaytimeRanges) != 1 || captured.PlaytimeRanges[0] != "30-60" {
		t.Fatalf("unexpected playtime: %#v", captured.PlaytimeRanges)
	}
	if len(captured.AgeRatings) != 1 || captured.AgeRatings[0] != 8 {
		t.Fatalf("unexpected ages: %#v", captured.AgeRatings)
	}
	if captured.PriceMovement != "decreased" {
		t.Fatalf("unexpected price movement: %q", captured.PriceMovement)
	}
	var payload map[string]float64
	if err := json.Unmarshal(rec.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if payload["min_price"] != 99 || payload["max_price"] != 799 {
		t.Fatalf("unexpected payload: %#v", payload)
	}
}

func TestHandlerCatalogParsesRequestedFilterParams(t *testing.T) {
	var captured catalog.Filters
	handler := NewHandler(&fakeService{
		catalog: func(_ context.Context, filters catalog.Filters) ([]catalog.Row, int64, error) {
			captured = filters
			return []catalog.Row{}, 0, nil
		},
	}, 200)

	req := httptest.NewRequest(
		http.MethodGet,
		"/api/v1/catalog?availability=available&categories=strategicka,fantasy&players=2-4&playtime=30-60&age=10&price_movement=decreased&limit=24&offset=48&random_seed=987",
		nil,
	)
	rec := httptest.NewRecorder()

	handler.Catalog(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	if captured.Availability != "available" {
		t.Fatalf("expected availability=available, got %q", captured.Availability)
	}
	if len(captured.Categories) != 2 || captured.Categories[0] != "strategicka" || captured.Categories[1] != "fantasy" {
		t.Fatalf("unexpected categories: %#v", captured.Categories)
	}
	if len(captured.PlayerRanges) != 1 || captured.PlayerRanges[0] != "2-4" {
		t.Fatalf("unexpected players: %#v", captured.PlayerRanges)
	}
	if len(captured.PlaytimeRanges) != 1 || captured.PlaytimeRanges[0] != "30-60" {
		t.Fatalf("unexpected playtime: %#v", captured.PlaytimeRanges)
	}
	if len(captured.AgeRatings) != 1 || captured.AgeRatings[0] != 10 {
		t.Fatalf("unexpected ages: %#v", captured.AgeRatings)
	}
	if captured.PriceMovement != "decreased" {
		t.Fatalf("unexpected price movement: %q", captured.PriceMovement)
	}
	if captured.Limit != 24 || captured.Offset != 48 {
		t.Fatalf("unexpected paging: limit=%d offset=%d", captured.Limit, captured.Offset)
	}
	if captured.RandomSeed == nil || *captured.RandomSeed != 987 {
		t.Fatalf("unexpected random seed: %#v", captured.RandomSeed)
	}
}

func TestHandlerProductDetailValidationError(t *testing.T) {
	handler := NewHandler(&fakeService{}, 200)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/products/", nil)
	routeCtx := chi.NewRouteContext()
	routeCtx.URLParams.Add("slug", "")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, routeCtx))
	rec := httptest.NewRecorder()

	handler.ProductDetail(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
	var payload map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if payload["code"] != "validation_error" {
		t.Fatalf("expected code validation_error, got %q", payload["code"])
	}
}

func TestHandlerProductDetailParsesHistoryPoints(t *testing.T) {
	var capturedHistoryPoints int
	handler := NewHandler(&fakeService{
		productDetail: func(
			_ context.Context,
			_ string,
			historyPoints int,
		) (snapshots.ProductDetail, error) {
			capturedHistoryPoints = historyPoints
			return snapshots.ProductDetail{}, nil
		},
	}, 200)

	req := httptest.NewRequest(
		http.MethodGet,
		"/api/v1/products/alpha-game?history_points=250",
		nil,
	)
	routeCtx := chi.NewRouteContext()
	routeCtx.URLParams.Add("slug", "alpha-game")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, routeCtx))
	rec := httptest.NewRecorder()

	handler.ProductDetail(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	if capturedHistoryPoints != 250 {
		t.Fatalf("expected historyPoints=250, got %d", capturedHistoryPoints)
	}
}

func floatPtr(value float64) *float64 {
	return &value
}

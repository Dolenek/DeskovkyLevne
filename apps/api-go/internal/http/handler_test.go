package http

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
	"tlamasite/apps/api-go/internal/catalog"
	"tlamasite/apps/api-go/internal/snapshots"
)

type fakeService struct {
	priceRange func(ctx context.Context, filters catalog.PriceRangeFilters) (catalog.PriceRange, error)
}

func (f *fakeService) Catalog(_ context.Context, _ catalog.Filters) ([]catalog.Row, int64, error) {
	return nil, 0, nil
}

func (f *fakeService) Search(_ context.Context, _ string, _ string, _ int) ([]catalog.SuggestionRow, error) {
	return nil, nil
}

func (f *fakeService) ProductSnapshots(_ context.Context, _ string) ([]snapshots.Row, error) {
	return nil, nil
}

func (f *fakeService) RecentSnapshots(_ context.Context, _ int) ([]snapshots.Row, error) {
	return nil, nil
}

func (f *fakeService) CategoryCounts(_ context.Context, _ string) ([]catalog.CategoryCount, error) {
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
		"/api/v1/meta/price-range?availability=available&categories=Strategy,Family",
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
	if len(captured.Categories) != 2 || captured.Categories[0] != "Strategy" || captured.Categories[1] != "Family" {
		t.Fatalf("unexpected categories: %#v", captured.Categories)
	}
	var payload map[string]float64
	if err := json.Unmarshal(rec.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if payload["min_price"] != 99 || payload["max_price"] != 799 {
		t.Fatalf("unexpected payload: %#v", payload)
	}
}

func TestHandlerProductSnapshotsValidationError(t *testing.T) {
	handler := NewHandler(&fakeService{}, 200)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/products/", nil)
	routeCtx := chi.NewRouteContext()
	routeCtx.URLParams.Add("slug", "")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, routeCtx))
	rec := httptest.NewRecorder()

	handler.ProductSnapshots(rec, req)

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

func TestWriteServiceErrorCodes(t *testing.T) {
	cases := []struct {
		name       string
		err        error
		statusCode int
		code       string
	}{
		{
			name:       "timeout",
			err:        context.DeadlineExceeded,
			statusCode: http.StatusGatewayTimeout,
			code:       "timeout",
		},
		{
			name:       "canceled",
			err:        context.Canceled,
			statusCode: http.StatusRequestTimeout,
			code:       "request_canceled",
		},
		{
			name:       "internal",
			err:        errors.New("boom"),
			statusCode: http.StatusInternalServerError,
			code:       "internal_error",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			rec := httptest.NewRecorder()
			writeServiceError(rec, tc.err)

			if rec.Code != tc.statusCode {
				t.Fatalf("expected %d, got %d", tc.statusCode, rec.Code)
			}
			var payload map[string]string
			if err := json.Unmarshal(rec.Body.Bytes(), &payload); err != nil {
				t.Fatalf("decode response: %v", err)
			}
			if payload["code"] != tc.code {
				t.Fatalf("expected code %q, got %q", tc.code, payload["code"])
			}
		})
	}
}

func floatPtr(value float64) *float64 {
	return &value
}

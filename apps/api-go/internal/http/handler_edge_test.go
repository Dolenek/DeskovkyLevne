package http

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"tlamasite/apps/api-go/internal/catalog"
	"tlamasite/apps/api-go/internal/snapshots"
)

func TestSearchSuggestReturnsEmptyRowsWithoutServiceCallForShortQuery(t *testing.T) {
	serviceCalled := false
	handler := NewHandler(&fakeService{
		search: func(
			context.Context, string, string, []string, int,
		) ([]catalog.SuggestionRow, error) {
			serviceCalled = true
			return nil, nil
		},
	}, 200)
	recorder := httptest.NewRecorder()

	handler.SearchSuggest(
		recorder,
		httptest.NewRequest(http.MethodGet, "/api/v1/search/suggest?q=a", nil),
	)
	if recorder.Code != http.StatusOK || serviceCalled {
		t.Fatalf("unexpected short-query result: status=%d called=%t", recorder.Code, serviceCalled)
	}
	var payload struct {
		Rows []any `json:"rows"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &payload); err != nil || len(payload.Rows) != 0 {
		t.Fatalf("unexpected payload: %#v, err=%v", payload, err)
	}
}

func TestSearchSuggestCapsLimitAndSetsPublicCache(t *testing.T) {
	handler := NewHandler(&fakeService{
		search: func(
			_ context.Context,
			query string,
			availability string,
			productCodes []string,
			limit int,
		) ([]catalog.SuggestionRow, error) {
			if query != "Alpha" || availability != "available" || limit != 200 {
				t.Fatalf("unexpected search inputs: %q %q %d", query, availability, limit)
			}
			if len(productCodes) != 2 || productCodes[1] != "B-2" {
				t.Fatalf("unexpected product codes: %#v", productCodes)
			}
			return []catalog.SuggestionRow{}, nil
		},
	}, 200)
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(
		http.MethodGet,
		"/api/v1/search/suggest?q=Alpha&availability=available&product_codes=A-1,B-2&limit=999",
		nil,
	)

	handler.SearchSuggest(recorder, request)
	if recorder.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", recorder.Code)
	}
	if got := recorder.Header().Get("Cache-Control"); got != "public, max-age=30, stale-while-revalidate=60" {
		t.Fatalf("unexpected Cache-Control %q", got)
	}
}

func TestRecentDiscountsCapsLimit(t *testing.T) {
	handler := NewHandler(&fakeService{
		recentDiscounts: func(
			_ context.Context,
			limit int,
		) ([]snapshots.RecentDiscount, error) {
			if limit != maxDiscountResults {
				t.Fatalf("expected capped limit %d, got %d", maxDiscountResults, limit)
			}
			return []snapshots.RecentDiscount{}, nil
		},
	}, 200)
	recorder := httptest.NewRecorder()

	handler.RecentDiscounts(
		recorder,
		httptest.NewRequest(http.MethodGet, "/api/v1/discounts/recent?limit=999", nil),
	)
	if recorder.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", recorder.Code)
	}
}

func TestHandlerServiceErrorIsNotPubliclyCached(t *testing.T) {
	handler := NewHandler(&fakeService{
		catalogOverview: func(context.Context) (catalog.Overview, error) {
			return catalog.Overview{}, errors.New("database unavailable")
		},
	}, 200)
	recorder := httptest.NewRecorder()

	handler.CatalogOverview(
		recorder,
		httptest.NewRequest(http.MethodGet, "/api/v1/catalog/overview", nil),
	)
	if recorder.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", recorder.Code)
	}
	if cacheControl := recorder.Header().Get("Cache-Control"); cacheControl != "" {
		t.Fatalf("error response was cacheable: %q", cacheControl)
	}
}

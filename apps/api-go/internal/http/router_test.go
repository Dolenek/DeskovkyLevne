package http

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"tlamasite/apps/api-go/internal/catalog"
)

func TestRouterExposesCurrentEndpointsOnly(t *testing.T) {
	router := NewRouter(NewHandler(&fakeService{}, 200), RouterOptions{
		AllowedOrigin: "*",
	})
	tests := []struct {
		path           string
		expectedStatus int
	}{
		{"/health", http.StatusOK},
		{"/ready", http.StatusOK},
		{"/version", http.StatusOK},
		{"/api/v1/catalog/overview", http.StatusOK},
		{"/api/v1/discounts/recent", http.StatusOK},
		{"/api/v1/meta/filter-options", http.StatusOK},
		{"/api/v1/snapshots/recent", http.StatusNotFound},
		{"/api/v1/meta/categories", http.StatusNotFound},
	}
	for _, testCase := range tests {
		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(http.MethodGet, testCase.path, nil)
		router.ServeHTTP(recorder, request)
		if recorder.Code != testCase.expectedStatus {
			t.Fatalf("%s: expected %d, got %d", testCase.path, testCase.expectedStatus, recorder.Code)
		}
	}
}

func TestRouterEnforcesCatalogDeadline(t *testing.T) {
	service := &fakeService{
		catalog: func(
			ctx context.Context,
			_ catalog.Filters,
		) ([]catalog.Row, int64, error) {
			<-ctx.Done()
			return nil, 0, ctx.Err()
		},
	}
	router := NewRouter(NewHandler(service, 200), RouterOptions{
		AllowedOrigin: "*",
		Timeouts:      RouteTimeouts{Catalog: 20 * time.Millisecond},
	})
	recorder := httptest.NewRecorder()
	startedAt := time.Now()

	router.ServeHTTP(
		recorder,
		httptest.NewRequest(http.MethodGet, "/api/v1/catalog", nil),
	)
	if recorder.Code != http.StatusGatewayTimeout {
		t.Fatalf("expected 504, got %d", recorder.Code)
	}
	if elapsed := time.Since(startedAt); elapsed > time.Second {
		t.Fatalf("route timeout took too long: %s", elapsed)
	}
}

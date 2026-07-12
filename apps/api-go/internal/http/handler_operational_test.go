package http

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"tlamasite/apps/api-go/internal/catalog"
	"tlamasite/apps/api-go/internal/snapshots"
)

func TestWriteServiceErrorCodes(t *testing.T) {
	cases := []struct {
		name       string
		err        error
		statusCode int
		code       string
	}{
		{"not found", snapshots.ErrProductNotFound, http.StatusNotFound, "not_found"},
		{"timeout", context.DeadlineExceeded, http.StatusGatewayTimeout, "timeout"},
		{"canceled", context.Canceled, http.StatusRequestTimeout, "request_canceled"},
		{"internal", errors.New("boom"), http.StatusInternalServerError, "internal_error"},
	}
	for _, testCase := range cases {
		t.Run(testCase.name, func(t *testing.T) {
			assertServiceError(t, testCase.err, testCase.statusCode, testCase.code)
		})
	}
}

func assertServiceError(t *testing.T, serviceErr error, expectedStatus int, expectedCode string) {
	t.Helper()
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/api/v1/catalog", nil)
	writeServiceError(recorder, request, serviceErr)
	if recorder.Code != expectedStatus {
		t.Fatalf("expected %d, got %d", expectedStatus, recorder.Code)
	}
	var payload map[string]any
	if err := json.Unmarshal(recorder.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if payload["code"] != expectedCode {
		t.Fatalf("expected code %q, got %v", expectedCode, payload["code"])
	}
}

func TestHandlerRejectsInvalidCatalogQuery(t *testing.T) {
	handler := NewHandler(&fakeService{}, 200)
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(
		http.MethodGet,
		"/api/v1/catalog?availability=unsupported",
		nil,
	)
	handler.Catalog(recorder, request)
	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", recorder.Code)
	}
}

func TestCatalogOverviewReturnsTotalAndAvailableCounts(t *testing.T) {
	handler := NewHandler(&fakeService{
		catalogOverview: func(context.Context) (catalog.Overview, error) {
			return catalog.Overview{Total: 22002, Available: 17424}, nil
		},
	}, 200)
	recorder := httptest.NewRecorder()
	handler.CatalogOverview(
		recorder,
		httptest.NewRequest(http.MethodGet, "/api/v1/catalog/overview", nil),
	)
	if recorder.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", recorder.Code)
	}
	var payload catalog.Overview
	if err := json.Unmarshal(recorder.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if payload.Total != 22002 || payload.Available != 17424 {
		t.Fatalf("unexpected overview: %#v", payload)
	}
}

func TestReadinessReportsDatabaseFailure(t *testing.T) {
	handler := NewHandler(&fakeService{
		ready: func(context.Context) error { return errors.New("database unavailable") },
	}, 200)
	recorder := httptest.NewRecorder()
	handler.Ready(recorder, httptest.NewRequest(http.MethodGet, "/ready", nil))
	if recorder.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503, got %d", recorder.Code)
	}
}

func TestVersionReturnsConfiguredBuildIdentity(t *testing.T) {
	handler := NewHandler(&fakeService{}, 200, BuildInfo{
		Version: "v1.2.3", Commit: "abc123", BuiltAt: "2026-07-11T20:00:00Z",
	})
	recorder := httptest.NewRecorder()
	handler.Version(recorder, httptest.NewRequest(http.MethodGet, "/version", nil))
	var payload BuildInfo
	if err := json.Unmarshal(recorder.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if payload.Commit != "abc123" {
		t.Fatalf("unexpected build identity: %#v", payload)
	}
}

func TestWriteErrorCodeIncludesRequestID(t *testing.T) {
	router := chi.NewRouter()
	router.Use(middleware.RequestID)
	router.Get("/err", func(w http.ResponseWriter, r *http.Request) {
		writeErrorCode(w, r, http.StatusBadRequest, "validation_error", "invalid")
	})
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/err", nil))
	var payload map[string]string
	if err := json.Unmarshal(recorder.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if payload["request_id"] == "" {
		t.Fatal("expected request_id to be present")
	}
}

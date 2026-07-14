package http

import (
	"net/http"
	"net/http/httptest"
	"testing"
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

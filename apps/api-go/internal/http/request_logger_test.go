package http

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestRequestLoggerEscapesEncodedNewline(t *testing.T) {
	var logOutput bytes.Buffer
	originalLogger := slog.Default()
	slog.SetDefault(slog.New(slog.NewJSONHandler(&logOutput, nil)))
	t.Cleanup(func() { slog.SetDefault(originalLogger) })

	handler := requestLogger(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))
	request := httptest.NewRequest(http.MethodGet, "/catalog%0aFORGED", nil)
	handler.ServeHTTP(httptest.NewRecorder(), request)

	if bytes.Count(logOutput.Bytes(), []byte{'\n'}) != 1 {
		t.Fatalf("expected one log event, got %q", logOutput.String())
	}
	var event map[string]any
	if err := json.Unmarshal(bytes.TrimSpace(logOutput.Bytes()), &event); err != nil {
		t.Fatalf("decode structured log: %v", err)
	}
	loggedPath, _ := event["path"].(string)
	if strings.ContainsAny(loggedPath, "\r\n") || loggedPath != request.URL.EscapedPath() {
		t.Fatalf("unexpected logged path %q", loggedPath)
	}
}

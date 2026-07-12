package http

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5/middleware"
)

func setPublicCache(w http.ResponseWriter, maxAgeSeconds int, staleSeconds int) {
	w.Header().Set(
		"Cache-Control",
		fmt.Sprintf(
			"public, max-age=%d, stale-while-revalidate=%d",
			maxAgeSeconds,
			staleSeconds,
		),
	)
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	encodedPayload, err := json.Marshal(payload)
	if err != nil {
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_, _ = w.Write(append(encodedPayload, '\n'))
}

func writeErrorCode(
	w http.ResponseWriter,
	r *http.Request,
	status int,
	code string,
	message string,
) {
	payload := map[string]string{"error": message}
	if code != "" {
		payload["code"] = code
	}
	if requestID := middleware.GetReqID(r.Context()); requestID != "" {
		payload["request_id"] = requestID
	}
	writeJSON(w, status, payload)
}

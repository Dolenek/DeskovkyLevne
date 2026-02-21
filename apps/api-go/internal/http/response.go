package http

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5/middleware"
)

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	encoder := json.NewEncoder(w)
	encoder.SetEscapeHTML(true)
	_ = encoder.Encode(payload)
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

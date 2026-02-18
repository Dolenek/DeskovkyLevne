package http

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"tlamasite/apps/api-go/internal/catalog"
)

type Handler struct {
	service     *Service
	maxPageSize int
}

func NewHandler(service *Service, maxPageSize int) *Handler {
	return &Handler{service: service, maxPageSize: maxPageSize}
}

func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) Catalog(w http.ResponseWriter, r *http.Request) {
	values := r.URL.Query()
	limit := parseLimit(values, 20, h.maxPageSize)
	offset := parseOffset(values)
	filters := catalog.Filters{
		Availability: strings.TrimSpace(values.Get("availability")),
		MinPrice:     parseFloatPtr(values.Get("min_price")),
		MaxPrice:     parseFloatPtr(values.Get("max_price")),
		Categories:   parseCategories(values.Get("categories")),
		Query:        strings.TrimSpace(values.Get("q")),
		Limit:        limit,
		Offset:       offset,
	}
	rows, total, err := h.service.Catalog(r.Context(), filters)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"rows":           rows,
		"total":          total,
		"total_estimate": total,
		"limit":          limit,
		"offset":         offset,
	})
}

func (h *Handler) SearchSuggest(w http.ResponseWriter, r *http.Request) {
	values := r.URL.Query()
	query := strings.TrimSpace(values.Get("q"))
	if len(query) < 2 {
		writeJSON(w, http.StatusOK, map[string]any{"rows": []any{}})
		return
	}
	availability := strings.TrimSpace(values.Get("availability"))
	limit := parseLimit(values, 60, h.maxPageSize)
	rows, err := h.service.Search(r.Context(), query, availability, limit)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"rows": rows})
}

func (h *Handler) ProductSnapshots(w http.ResponseWriter, r *http.Request) {
	slug := strings.TrimSpace(chi.URLParam(r, "slug"))
	if slug == "" {
		writeError(w, http.StatusBadRequest, "slug is required")
		return
	}
	rows, err := h.service.ProductSnapshots(r.Context(), strings.ToLower(slug))
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"rows": rows})
}

func (h *Handler) RecentSnapshots(w http.ResponseWriter, r *http.Request) {
	values := r.URL.Query()
	limit := parseLimit(values, 2000, 10000)
	rows, err := h.service.RecentSnapshots(r.Context(), limit)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"rows": rows})
}

func (h *Handler) Categories(w http.ResponseWriter, r *http.Request) {
	rows, err := h.service.CategoryCounts(r.Context())
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"rows": rows})
}

func writeServiceError(w http.ResponseWriter, err error) {
	if errors.Is(err, context.DeadlineExceeded) {
		writeError(w, http.StatusGatewayTimeout, "request timed out")
		return
	}
	writeError(w, http.StatusInternalServerError, err.Error())
}

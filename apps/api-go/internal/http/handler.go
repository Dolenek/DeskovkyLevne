package http

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"tlamasite/apps/api-go/internal/catalog"
	"tlamasite/apps/api-go/internal/snapshots"
)

type serviceContract interface {
	Catalog(ctx context.Context, filters catalog.Filters) ([]catalog.Row, int64, error)
	Search(ctx context.Context, query string, availability string, limit int) ([]catalog.SuggestionRow, error)
	ProductSnapshots(ctx context.Context, slug string) ([]snapshots.Row, error)
	RecentSnapshots(ctx context.Context, limit int) ([]snapshots.Row, error)
	CategoryCounts(ctx context.Context, availability string) ([]catalog.CategoryCount, error)
	PriceRange(ctx context.Context, filters catalog.PriceRangeFilters) (catalog.PriceRange, error)
}

type Handler struct {
	service     serviceContract
	maxPageSize int
}

func NewHandler(service serviceContract, maxPageSize int) *Handler {
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
		writeErrorCode(
			w,
			http.StatusBadRequest,
			"validation_error",
			"slug is required",
		)
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
	availability := strings.TrimSpace(r.URL.Query().Get("availability"))
	rows, err := h.service.CategoryCounts(r.Context(), availability)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"rows": rows})
}

func (h *Handler) PriceRange(w http.ResponseWriter, r *http.Request) {
	values := r.URL.Query()
	filters := catalog.PriceRangeFilters{
		Availability: strings.TrimSpace(values.Get("availability")),
		Categories:   parseCategories(values.Get("categories")),
	}
	row, err := h.service.PriceRange(r.Context(), filters)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, row)
}

func writeServiceError(w http.ResponseWriter, err error) {
	if errors.Is(err, context.DeadlineExceeded) {
		writeErrorCode(w, http.StatusGatewayTimeout, "timeout", "request timed out")
		return
	}
	if errors.Is(err, context.Canceled) {
		writeErrorCode(w, http.StatusRequestTimeout, "request_canceled", "request canceled")
		return
	}
	writeErrorCode(w, http.StatusInternalServerError, "internal_error", "internal server error")
}

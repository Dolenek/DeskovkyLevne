package http

import (
	"context"
	"errors"
	"net/http"
	"unicode/utf8"

	"github.com/go-chi/chi/v5"
	"tlamasite/apps/api-go/internal/catalog"
	"tlamasite/apps/api-go/internal/snapshots"
)

type serviceContract interface {
	Catalog(ctx context.Context, filters catalog.Filters) ([]catalog.Row, int64, error)
	Search(ctx context.Context, query string, availability string, limit int) ([]catalog.SuggestionRow, error)
	ProductDetail(ctx context.Context, slug string, historyPoints int) (snapshots.ProductDetail, error)
	RecentDiscounts(ctx context.Context, limit int) ([]snapshots.RecentDiscount, error)
	PriceRange(ctx context.Context, filters catalog.PriceRangeFilters) (catalog.PriceRange, error)
	FilterOptions(ctx context.Context) (catalog.FilterOptions, error)
	Ready(ctx context.Context) error
}

type BuildInfo struct {
	Version string `json:"version"`
	Commit  string `json:"commit"`
	BuiltAt string `json:"built_at"`
}

type Handler struct {
	service     serviceContract
	maxPageSize int
	buildInfo   BuildInfo
}

func NewHandler(service serviceContract, maxPageSize int, buildInfo ...BuildInfo) *Handler {
	resolvedBuildInfo := BuildInfo{Version: "development", Commit: "unknown", BuiltAt: "unknown"}
	if len(buildInfo) > 0 {
		resolvedBuildInfo = buildInfo[0]
	}
	return &Handler{service: service, maxPageSize: maxPageSize, buildInfo: resolvedBuildInfo}
}

func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) Ready(w http.ResponseWriter, r *http.Request) {
	if err := h.service.Ready(r.Context()); err != nil {
		writeErrorCode(w, r, http.StatusServiceUnavailable, "not_ready", "service is not ready")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ready"})
}

func (h *Handler) Version(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, h.buildInfo)
}

func (h *Handler) Catalog(w http.ResponseWriter, r *http.Request) {
	values := r.URL.Query()
	filters, validationErr := parseCatalogFilters(values, h.maxPageSize)
	if validationErr != nil {
		writeValidationError(w, r, validationErr)
		return
	}
	rows, total, err := h.service.Catalog(r.Context(), filters)
	if err != nil {
		writeServiceError(w, r, err)
		return
	}
	setPublicCache(w, 60, 120)
	writeJSON(w, http.StatusOK, map[string]any{
		"rows":           rows,
		"total":          total,
		"total_estimate": total,
		"limit":          filters.Limit,
		"offset":         filters.Offset,
	})
}

func (h *Handler) SearchSuggest(w http.ResponseWriter, r *http.Request) {
	values := r.URL.Query()
	query, validationErr := validateSearchQuery(values.Get("q"))
	if validationErr != nil {
		writeValidationError(w, r, validationErr)
		return
	}
	if utf8.RuneCountInString(query) < 2 {
		writeJSON(w, http.StatusOK, map[string]any{"rows": []any{}})
		return
	}
	availability, validationErr := parseOptionalEnum(values.Get("availability"), "availability", supportedAvailabilities)
	if validationErr != nil {
		writeValidationError(w, r, validationErr)
		return
	}
	limit, validationErr := parseBoundedInt(values, "limit", 60, h.maxPageSize)
	if validationErr != nil {
		writeValidationError(w, r, validationErr)
		return
	}
	rows, err := h.service.Search(r.Context(), query, availability, limit)
	if err != nil {
		writeServiceError(w, r, err)
		return
	}
	setPublicCache(w, 30, 60)
	writeJSON(w, http.StatusOK, map[string]any{"rows": rows})
}

func (h *Handler) ProductDetail(w http.ResponseWriter, r *http.Request) {
	slug, validationErr := validateProductSlug(chi.URLParam(r, "slug"))
	if validationErr != nil {
		writeValidationError(w, r, validationErr)
		return
	}
	values := r.URL.Query()
	historyPoints, validationErr := parseProductHistoryPoints(values)
	if validationErr != nil {
		writeValidationError(w, r, validationErr)
		return
	}
	detail, err := h.service.ProductDetail(
		r.Context(),
		slug,
		historyPoints,
	)
	if err != nil {
		writeServiceError(w, r, err)
		return
	}
	setPublicCache(w, 60, 300)
	writeJSON(w, http.StatusOK, detail)
}

func (h *Handler) RecentDiscounts(w http.ResponseWriter, r *http.Request) {
	values := r.URL.Query()
	limit, validationErr := parseBoundedInt(values, "limit", 10, maxDiscountResults)
	if validationErr != nil {
		writeValidationError(w, r, validationErr)
		return
	}
	rows, err := h.service.RecentDiscounts(r.Context(), limit)
	if err != nil {
		writeServiceError(w, r, err)
		return
	}
	setPublicCache(w, 30, 60)
	writeJSON(w, http.StatusOK, map[string]any{"rows": rows})
}

func (h *Handler) PriceRange(w http.ResponseWriter, r *http.Request) {
	values := r.URL.Query()
	filters, validationErr := parsePriceRangeFilters(values)
	if validationErr != nil {
		writeValidationError(w, r, validationErr)
		return
	}
	row, err := h.service.PriceRange(r.Context(), filters)
	if err != nil {
		writeServiceError(w, r, err)
		return
	}
	setPublicCache(w, 120, 180)
	writeJSON(w, http.StatusOK, row)
}

func (h *Handler) FilterOptions(w http.ResponseWriter, r *http.Request) {
	options, err := h.service.FilterOptions(r.Context())
	if err != nil {
		writeServiceError(w, r, err)
		return
	}
	setPublicCache(w, 600, 600)
	writeJSON(w, http.StatusOK, options)
}

func writeServiceError(w http.ResponseWriter, r *http.Request, err error) {
	if snapshots.IsProductNotFound(err) {
		writeErrorCode(w, r, http.StatusNotFound, "not_found", "product not found")
		return
	}
	if errors.Is(err, context.DeadlineExceeded) {
		writeErrorCode(w, r, http.StatusGatewayTimeout, "timeout", "request timed out")
		return
	}
	if errors.Is(err, context.Canceled) {
		writeErrorCode(
			w,
			r,
			http.StatusRequestTimeout,
			"request_canceled",
			"request canceled",
		)
		return
	}
	writeErrorCode(
		w,
		r,
		http.StatusInternalServerError,
		"internal_error",
		"internal server error",
	)
}

func writeValidationError(w http.ResponseWriter, r *http.Request, err error) {
	writeErrorCode(w, r, http.StatusBadRequest, "validation_error", err.Error())
}

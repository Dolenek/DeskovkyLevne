package http

import (
	"log/slog"
	"net/http"
	"net/netip"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

type RouteTimeouts struct {
	Health     time.Duration
	Ready      time.Duration
	Catalog    time.Duration
	Search     time.Duration
	Product    time.Duration
	Discounts  time.Duration
	Metadata   time.Duration
	PriceRange time.Duration
}

type RouterOptions struct {
	AllowedOrigin     string
	Timeouts          RouteTimeouts
	TrustedProxyCIDRs []netip.Prefix
}

func NewRouter(handler *Handler, options RouterOptions) http.Handler {
	router := chi.NewRouter()
	router.Use(trustedClientIP(options.TrustedProxyCIDRs))
	router.Use(middleware.RequestID)
	router.Use(middleware.Recoverer)
	router.Use(requestLogger)
	router.Use(middleware.Compress(5, "application/json"))
	router.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{options.AllowedOrigin},
		AllowedMethods: []string{
			http.MethodGet,
			http.MethodHead,
			http.MethodOptions,
		},
		AllowedHeaders: []string{"Accept", "Content-Type", "Authorization"},
		MaxAge:         300,
	}))
	timeouts := options.Timeouts
	withRouteTimeout(router, timeouts.Health, "/health", handler.Health)
	withRouteTimeout(router, timeouts.Ready, "/ready", handler.Ready)
	withRouteTimeout(router, timeouts.Health, "/version", handler.Version)
	router.Route("/api/v1", func(r chi.Router) {
		withRouteTimeout(r, timeouts.Catalog, "/catalog", handler.Catalog)
		withRouteTimeout(r, timeouts.Catalog, "/catalog/overview", handler.CatalogOverview)
		withRouteTimeout(r, timeouts.Search, "/search/suggest", handler.SearchSuggest)
		withRouteTimeout(r, timeouts.Product, "/products/{slug}", handler.ProductDetail)
		withRouteTimeout(r, timeouts.Discounts, "/discounts/recent", handler.RecentDiscounts)
		withRouteTimeout(r, timeouts.PriceRange, "/meta/price-range", handler.PriceRange)
		withRouteTimeout(r, timeouts.Metadata, "/meta/filter-options", handler.FilterOptions)
	})
	return router
}

func withRouteTimeout(router chi.Router, timeout time.Duration, pattern string, handler http.HandlerFunc) {
	if timeout <= 0 {
		router.Get(pattern, handler)
		return
	}
	router.With(middleware.Timeout(timeout)).Get(pattern, handler)
}

func requestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		startedAt := time.Now()
		writer := middleware.NewWrapResponseWriter(w, r.ProtoMajor)
		next.ServeHTTP(writer, r)
		slog.Info("request_completed",
			"request_id", middleware.GetReqID(r.Context()),
			"method", r.Method,
			"path", r.URL.EscapedPath(),
			"status", writer.Status(),
			"bytes", writer.BytesWritten(),
			"duration_ms", time.Since(startedAt).Milliseconds(),
			"client_ip", clientIP(r),
		)
	})
}

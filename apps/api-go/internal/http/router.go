package http

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

type RouteTimeouts struct {
	Health     time.Duration
	Catalog    time.Duration
	Search     time.Duration
	Product    time.Duration
	Recent     time.Duration
	Categories time.Duration
}

func NewRouter(handler *Handler, allowedOrigin string, timeouts RouteTimeouts) http.Handler {
	router := chi.NewRouter()
	router.Use(middleware.RealIP)
	router.Use(middleware.Recoverer)
	router.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{allowedOrigin},
		AllowedMethods: []string{
			http.MethodGet,
			http.MethodHead,
			http.MethodOptions,
		},
		AllowedHeaders: []string{"Accept", "Content-Type", "Authorization"},
		MaxAge:         300,
	}))
	withRouteTimeout(router, timeouts.Health, "/health", handler.Health)
	router.Route("/api/v1", func(r chi.Router) {
		withRouteTimeout(r, timeouts.Catalog, "/catalog", handler.Catalog)
		withRouteTimeout(r, timeouts.Search, "/search/suggest", handler.SearchSuggest)
		withRouteTimeout(r, timeouts.Product, "/products/{slug}", handler.ProductSnapshots)
		withRouteTimeout(r, timeouts.Recent, "/snapshots/recent", handler.RecentSnapshots)
		withRouteTimeout(r, timeouts.Categories, "/meta/categories", handler.Categories)
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

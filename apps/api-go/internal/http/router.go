package http

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
)

func NewRouter(handler *Handler, allowedOrigin string) http.Handler {
	router := chi.NewRouter()
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
	router.Get("/health", handler.Health)
	router.Route("/api/v1", func(r chi.Router) {
		r.Get("/catalog", handler.Catalog)
		r.Get("/search/suggest", handler.SearchSuggest)
		r.Get("/products/{slug}", handler.ProductSnapshots)
		r.Get("/snapshots/recent", handler.RecentSnapshots)
		r.Get("/meta/categories", handler.Categories)
	})
	return router
}

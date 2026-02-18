package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"tlamasite/apps/api-go/internal/cache"
	"tlamasite/apps/api-go/internal/catalog"
	"tlamasite/apps/api-go/internal/config"
	"tlamasite/apps/api-go/internal/db"
	api "tlamasite/apps/api-go/internal/http"
	"tlamasite/apps/api-go/internal/snapshots"
)

func main() {
	if err := run(); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}

func run() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	ctx := context.Background()
	pool, err := db.NewPool(ctx, cfg.DatabaseURL, db.PoolOptions{
		MaxConns:        cfg.DBMaxConns,
		MinConns:        cfg.DBMinConns,
		MaxConnIdleTime: cfg.DBMaxConnIdleTime,
		MaxConnLifetime: cfg.DBMaxConnLifetime,
		SimpleProtocol:  cfg.DBSimpleProtocol,
	})
	if err != nil {
		return err
	}
	defer pool.Close()

	cacheClient := connectCache(cfg)
	if cacheClient != nil {
		defer cacheClient.Close()
	}

	service := api.NewService(
		catalog.NewRepository(pool),
		snapshots.NewRepository(pool),
		cacheClient,
	)
	handler := api.NewHandler(service, cfg.MaxPageSize)
	server := &http.Server{
		Addr: cfg.ServerAddress,
		Handler: api.NewRouter(handler, cfg.FrontendOrigin, api.RouteTimeouts{
			Health:     cfg.HealthTimeout,
			Catalog:    cfg.CatalogTimeout,
			Search:     cfg.SearchTimeout,
			Product:    cfg.ProductTimeout,
			Recent:     cfg.RecentTimeout,
			Categories: cfg.CategoriesTimeout,
		}),
		ReadTimeout:  cfg.ReadTimeout,
		WriteTimeout: cfg.WriteTimeout,
		IdleTimeout:  cfg.IdleTimeout,
	}
	return serve(server)
}

func connectCache(cfg config.Config) cache.Client {
	if cfg.RedisAddr == "" {
		return nil
	}
	client, err := cache.NewRedisClient(cfg.RedisAddr, cfg.RedisPassword, cfg.RedisDB)
	if err != nil {
		log.Printf("redis unavailable, continuing without cache: %v", err)
		return nil
	}
	log.Printf("redis cache enabled at %s", cfg.RedisAddr)
	return client
}

func serve(server *http.Server) error {
	errCh := make(chan error, 1)
	go func() {
		log.Printf("api listening on %s", server.Addr)
		errCh <- server.ListenAndServe()
	}()
	stopCh := make(chan os.Signal, 1)
	signal.Notify(stopCh, syscall.SIGINT, syscall.SIGTERM)
	select {
	case err := <-errCh:
		if err == nil || err == http.ErrServerClosed {
			return nil
		}
		return err
	case <-stopCh:
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		return server.Shutdown(ctx)
	}
}

package main

import (
	"context"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"tlamasite/apps/api-go/internal/cache"
	"tlamasite/apps/api-go/internal/catalog"
	"tlamasite/apps/api-go/internal/config"
	"tlamasite/apps/api-go/internal/db"
	api "tlamasite/apps/api-go/internal/http"
	"tlamasite/apps/api-go/internal/snapshots"
)

var (
	version = "development"
	commit  = "unknown"
	builtAt = "unknown"
)

func main() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))
	if err := run(); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}

func run() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	pool, err := openPool(context.Background(), cfg)
	if err != nil {
		return err
	}
	defer pool.Close()

	cacheClient := connectCache(cfg)
	if cacheClient != nil {
		defer cacheClient.Close()
	}
	return serve(buildServer(cfg, buildHandler(cfg, pool, cacheClient)))
}

func openPool(ctx context.Context, cfg config.Config) (*pgxpool.Pool, error) {
	return db.NewPool(ctx, cfg.DatabaseURL, db.PoolOptions{
		DatabaseRole:    cfg.DatabaseRole,
		MaxConns:        cfg.DBMaxConns,
		MinConns:        cfg.DBMinConns,
		MaxConnIdleTime: cfg.DBMaxConnIdleTime,
		MaxConnLifetime: cfg.DBMaxConnLifetime,
		SimpleProtocol:  cfg.DBSimpleProtocol,
	})
}

func buildHandler(
	cfg config.Config,
	pool *pgxpool.Pool,
	cacheClient cache.Client,
) *api.Handler {
	service := api.NewService(
		catalog.NewRepository(pool, catalog.RepositoryOptions{
			SummaryRelation: cfg.CatalogSummaryRelation,
		}),
		snapshots.NewRepository(pool),
		cacheClient,
		api.ServiceOptions{
			CacheNamespace: cfg.CacheNamespace,
			CacheTTL: api.CacheTTLConfig{
				Catalog:    cfg.CacheTTLCatalog,
				Search:     cfg.CacheTTLSearch,
				Product:    cfg.CacheTTLProduct,
				Discounts:  cfg.CacheTTLDiscounts,
				PriceRange: cfg.CacheTTLPriceRange,
			},
		},
	)
	return api.NewHandler(service, cfg.MaxPageSize, api.BuildInfo{
		Version: version,
		Commit:  commit,
		BuiltAt: builtAt,
	})
}

func buildServer(cfg config.Config, handler *api.Handler) *http.Server {
	return &http.Server{
		Addr: cfg.ServerAddress,
		Handler: api.NewRouter(handler, api.RouterOptions{
			AllowedOrigin:     cfg.FrontendOrigin,
			TrustedProxyCIDRs: cfg.TrustedProxyCIDRs,
			Timeouts: api.RouteTimeouts{
				Health: cfg.HealthTimeout, Ready: cfg.ReadyTimeout,
				Catalog: cfg.CatalogTimeout, Search: cfg.SearchTimeout,
				Product: cfg.ProductTimeout, Discounts: cfg.DiscountsTimeout,
				Metadata: cfg.MetadataTimeout, PriceRange: cfg.PriceRangeTimeout,
			},
		}),
		ReadTimeout:       cfg.ReadTimeout,
		ReadHeaderTimeout: cfg.ReadHeaderTimeout,
		WriteTimeout:      cfg.WriteTimeout,
		IdleTimeout:       cfg.IdleTimeout,
		MaxHeaderBytes:    cfg.MaxHeaderBytes,
	}
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

package db

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PoolOptions struct {
	MaxConns        int32
	MinConns        int32
	MaxConnIdleTime time.Duration
	MaxConnLifetime time.Duration
	SimpleProtocol  bool
}

func NewPool(ctx context.Context, databaseURL string, options PoolOptions) (*pgxpool.Pool, error) {
	cfg, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, err
	}
	if options.SimpleProtocol {
		// Required for PgBouncer transaction pooling compatibility.
		cfg.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol
	}
	if options.MaxConns > 0 {
		cfg.MaxConns = options.MaxConns
	}
	if options.MinConns >= 0 {
		cfg.MinConns = options.MinConns
	}
	if options.MaxConnIdleTime > 0 {
		cfg.MaxConnIdleTime = options.MaxConnIdleTime
	}
	if options.MaxConnLifetime > 0 {
		cfg.MaxConnLifetime = options.MaxConnLifetime
	}
	return pgxpool.NewWithConfig(ctx, cfg)
}

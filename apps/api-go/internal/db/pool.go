package db

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PoolOptions struct {
	DatabaseRole    string
	MaxConns        int32
	MinConns        int32
	MaxConnIdleTime time.Duration
	MaxConnLifetime time.Duration
	SimpleProtocol  bool
}

func NewPool(ctx context.Context, databaseURL string, options PoolOptions) (*pgxpool.Pool, error) {
	cfg, err := buildPoolConfig(databaseURL, options)
	if err != nil {
		return nil, err
	}
	return pgxpool.NewWithConfig(ctx, cfg)
}

func buildPoolConfig(databaseURL string, options PoolOptions) (*pgxpool.Config, error) {
	cfg, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, err
	}
	if options.SimpleProtocol {
		// Required for PgBouncer transaction pooling compatibility.
		cfg.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol
	}
	if options.DatabaseRole != "" {
		roleSQL := setRoleStatement(options.DatabaseRole)
		cfg.AfterConnect = func(ctx context.Context, connection *pgx.Conn) error {
			_, err := connection.Exec(ctx, roleSQL)
			return err
		}
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
	return cfg, nil
}

func setRoleStatement(roleName string) string {
	return "set role " + pgx.Identifier{roleName}.Sanitize()
}

package db

import (
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
)

func TestSetRoleStatementQuotesRoleName(t *testing.T) {
	statement := setRoleStatement(`unsafe"; reset role; --`)
	expected := `set role "unsafe""; reset role; --"`
	if statement != expected {
		t.Fatalf("expected %q, got %q", expected, statement)
	}
}

func TestBuildPoolConfigAppliesSecurityAndLifetimeOptions(t *testing.T) {
	options := PoolOptions{
		DatabaseRole:    `api"role`,
		MaxConns:        18,
		MinConns:        4,
		MaxConnIdleTime: 3 * time.Minute,
		MaxConnLifetime: 90 * time.Minute,
		SimpleProtocol:  true,
	}

	config, err := buildPoolConfig("postgres://localhost/tlamasite", options)
	if err != nil {
		t.Fatalf("build pool config: %v", err)
	}
	if config.AfterConnect == nil {
		t.Fatal("database role must install an AfterConnect callback")
	}
	if config.ConnConfig.DefaultQueryExecMode != pgx.QueryExecModeSimpleProtocol {
		t.Fatalf("unexpected query mode: %v", config.ConnConfig.DefaultQueryExecMode)
	}
	if config.MaxConns != 18 || config.MinConns != 4 {
		t.Fatalf("unexpected connection bounds: max=%d min=%d", config.MaxConns, config.MinConns)
	}
	if config.MaxConnIdleTime != 3*time.Minute || config.MaxConnLifetime != 90*time.Minute {
		t.Fatalf("unexpected connection lifetimes: %#v", config)
	}
}

func TestBuildPoolConfigLeavesRoleCallbackUnsetWhenRoleIsEmpty(t *testing.T) {
	config, err := buildPoolConfig(
		"postgres://localhost/tlamasite",
		PoolOptions{MinConns: -1},
	)
	if err != nil {
		t.Fatalf("build pool config: %v", err)
	}
	if config.AfterConnect != nil {
		t.Fatal("empty database role must not install an AfterConnect callback")
	}
}

func TestBuildPoolConfigRejectsInvalidDatabaseURL(t *testing.T) {
	if _, err := buildPoolConfig("://invalid", PoolOptions{}); err == nil {
		t.Fatal("expected invalid database URL to fail")
	}
}

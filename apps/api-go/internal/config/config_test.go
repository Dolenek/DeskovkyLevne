package config

import (
	"testing"
	"time"
)

func TestLoadUsesSecurityDefaults(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://localhost/example")
	t.Setenv("API_TRUSTED_PROXY_CIDRS", "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("load config: %v", err)
	}
	if cfg.DatabaseRole != "tlamasite_api" {
		t.Fatalf("unexpected database role %q", cfg.DatabaseRole)
	}
	if cfg.ReadHeaderTimeout != 5*time.Second || cfg.MaxHeaderBytes != 32*1024 {
		t.Fatalf("unexpected HTTP security defaults: %#v", cfg)
	}
}

func TestLoadRejectsInvalidTrustedProxyCIDR(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://localhost/example")
	t.Setenv("API_TRUSTED_PROXY_CIDRS", "not-a-cidr")

	if _, err := Load(); err == nil {
		t.Fatal("expected invalid trusted proxy CIDR to fail")
	}
}

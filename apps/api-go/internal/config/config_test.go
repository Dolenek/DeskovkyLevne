package config

import (
	"net/netip"
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

func TestNormalizeConfigClampsOperationalBounds(t *testing.T) {
	config, err := normalizeConfig(Config{
		DatabaseURL:    "postgres://localhost/tlamasite",
		MaxPageSize:    1,
		MaxHeaderBytes: 1024,
		DBMaxConns:     0,
		DBMinConns:     9,
	})
	if err != nil {
		t.Fatalf("normalize config: %v", err)
	}
	if config.MaxPageSize != 10 || config.MaxHeaderBytes != 8*1024 {
		t.Fatalf("unexpected HTTP bounds: %#v", config)
	}
	if config.DBMaxConns != 1 || config.DBMinConns != 1 {
		t.Fatalf("unexpected database bounds: %#v", config)
	}
	if config.CacheNamespace != "api-v2" ||
		config.CatalogSummaryRelation != "public.catalog_slug_state" {
		t.Fatalf("unexpected normalized defaults: %#v", config)
	}
}

func TestNormalizeConfigRequiresDatabaseURL(t *testing.T) {
	if _, err := normalizeConfig(Config{}); err == nil {
		t.Fatal("expected missing database URL to fail")
	}
}

func TestInvalidEnvironmentValuesUseConfiguredFallbacks(t *testing.T) {
	t.Setenv("TEST_INTEGER", "not-an-integer")
	t.Setenv("TEST_INT32", "999999999999")
	t.Setenv("TEST_DURATION", "tomorrow")
	t.Setenv("TEST_BOOLEAN", "sometimes")

	if got := readInt("TEST_INTEGER", 17); got != 17 {
		t.Fatalf("unexpected integer fallback %d", got)
	}
	if got := readInt32("TEST_INT32", 23); got != 23 {
		t.Fatalf("unexpected int32 fallback %d", got)
	}
	if got := readDuration("TEST_DURATION", 5*time.Second); got != 5*time.Second {
		t.Fatalf("unexpected duration fallback %s", got)
	}
	if got := readBool("TEST_BOOLEAN", true); !got {
		t.Fatal("unexpected boolean fallback")
	}
}

func TestReadCIDRsMasksPrefixesAndTrimsWhitespace(t *testing.T) {
	t.Setenv("TEST_CIDRS", " 10.20.30.40/24, 2001:db8::5/64 ")
	prefixes, err := readCIDRs("TEST_CIDRS")
	if err != nil {
		t.Fatalf("read CIDRs: %v", err)
	}
	want := []netip.Prefix{
		netip.MustParsePrefix("10.20.30.0/24"),
		netip.MustParsePrefix("2001:db8::/64"),
	}
	if len(prefixes) != len(want) || prefixes[0] != want[0] || prefixes[1] != want[1] {
		t.Fatalf("unexpected CIDRs: %#v", prefixes)
	}
}

func TestLoadRejectsInvalidTrustedProxyCIDR(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://localhost/example")
	t.Setenv("API_TRUSTED_PROXY_CIDRS", "not-a-cidr")

	if _, err := Load(); err == nil {
		t.Fatal("expected invalid trusted proxy CIDR to fail")
	}
}

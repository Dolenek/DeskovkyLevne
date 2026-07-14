package config

import (
	"errors"
	"fmt"
	"net/netip"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	ServerAddress          string
	DatabaseURL            string
	FrontendOrigin         string
	CatalogSummaryRelation string
	ReadTimeout            time.Duration
	ReadHeaderTimeout      time.Duration
	WriteTimeout           time.Duration
	IdleTimeout            time.Duration
	MaxHeaderBytes         int
	MaxPageSize            int
	TrustedProxyCIDRs      []netip.Prefix
	RedisAddr              string
	RedisPassword          string
	RedisDB                int

	DatabaseRole      string
	DBMaxConns        int32
	DBMinConns        int32
	DBMaxConnIdleTime time.Duration
	DBMaxConnLifetime time.Duration
	DBSimpleProtocol  bool

	HealthTimeout     time.Duration
	ReadyTimeout      time.Duration
	CatalogTimeout    time.Duration
	SearchTimeout     time.Duration
	ProductTimeout    time.Duration
	DiscountsTimeout  time.Duration
	MetadataTimeout   time.Duration
	PriceRangeTimeout time.Duration

	CacheNamespace     string
	CacheTTLCatalog    time.Duration
	CacheTTLSearch     time.Duration
	CacheTTLProduct    time.Duration
	CacheTTLDiscounts  time.Duration
	CacheTTLPriceRange time.Duration
}

func Load() (Config, error) {
	cfg := Config{}
	applyServerConfig(&cfg)
	applyDatabaseConfig(&cfg)
	applyRouteTimeouts(&cfg)
	applyCacheConfig(&cfg)
	trustedProxyCIDRs, err := readCIDRs("API_TRUSTED_PROXY_CIDRS")
	if err != nil {
		return Config{}, err
	}
	cfg.TrustedProxyCIDRs = trustedProxyCIDRs
	return normalizeConfig(cfg)
}

func applyServerConfig(cfg *Config) {
	cfg.ServerAddress = getenv("API_ADDRESS", ":8080")
	cfg.FrontendOrigin = getenv("FRONTEND_ORIGIN", "http://localhost:5173")
	cfg.CatalogSummaryRelation = getenv(
		"API_CATALOG_SUMMARY_RELATION", "public.catalog_slug_state",
	)
	cfg.ReadTimeout = readDuration("API_READ_TIMEOUT", 10*time.Second)
	cfg.ReadHeaderTimeout = readDuration("API_READ_HEADER_TIMEOUT", 5*time.Second)
	cfg.WriteTimeout = readDuration("API_WRITE_TIMEOUT", 15*time.Second)
	cfg.IdleTimeout = readDuration("API_IDLE_TIMEOUT", 60*time.Second)
	cfg.MaxHeaderBytes = readInt("API_MAX_HEADER_BYTES", 32*1024)
	cfg.MaxPageSize = readInt("API_MAX_PAGE_SIZE", 200)
}

func applyDatabaseConfig(cfg *Config) {
	cfg.DatabaseURL = strings.TrimSpace(os.Getenv("DATABASE_URL"))
	cfg.DatabaseRole = getenv("API_DATABASE_ROLE", "tlamasite_api")
	cfg.DBMaxConns = readInt32("API_DB_MAX_CONNS", 30)
	cfg.DBMinConns = readInt32("API_DB_MIN_CONNS", 5)
	cfg.DBMaxConnIdleTime = readDuration("API_DB_MAX_CONN_IDLE", 5*time.Minute)
	cfg.DBMaxConnLifetime = readDuration("API_DB_MAX_CONN_LIFETIME", 2*time.Hour)
	cfg.DBSimpleProtocol = readBool("API_DB_SIMPLE_PROTOCOL", true)
}

func applyRouteTimeouts(cfg *Config) {
	cfg.HealthTimeout = readDuration("API_TIMEOUT_HEALTH", 2*time.Second)
	cfg.ReadyTimeout = readDuration("API_TIMEOUT_READY", 2*time.Second)
	cfg.CatalogTimeout = readDuration("API_TIMEOUT_CATALOG", 6*time.Second)
	cfg.SearchTimeout = readDuration("API_TIMEOUT_SEARCH", 3*time.Second)
	cfg.ProductTimeout = readDuration("API_TIMEOUT_PRODUCT", 6*time.Second)
	cfg.DiscountsTimeout = readDuration("API_TIMEOUT_DISCOUNTS", 4*time.Second)
	cfg.MetadataTimeout = readDuration("API_TIMEOUT_METADATA", 4*time.Second)
	cfg.PriceRangeTimeout = readDuration("API_TIMEOUT_PRICE_RANGE", 4*time.Second)
}

func applyCacheConfig(cfg *Config) {
	cfg.RedisAddr = strings.TrimSpace(os.Getenv("REDIS_ADDR"))
	cfg.RedisPassword = os.Getenv("REDIS_PASSWORD")
	cfg.RedisDB = readInt("REDIS_DB", 0)
	cfg.CacheNamespace = getenv("API_CACHE_NAMESPACE", "api-v2")
	cfg.CacheTTLCatalog = readDuration("API_CACHE_TTL_CATALOG", 120*time.Second)
	cfg.CacheTTLSearch = readDuration("API_CACHE_TTL_SEARCH", 60*time.Second)
	cfg.CacheTTLProduct = readDuration("API_CACHE_TTL_PRODUCT", 300*time.Second)
	cfg.CacheTTLDiscounts = readDuration("API_CACHE_TTL_DISCOUNTS", 60*time.Second)
	cfg.CacheTTLPriceRange = readDuration("API_CACHE_TTL_PRICE_RANGE", 180*time.Second)
}

func normalizeConfig(cfg Config) (Config, error) {
	if cfg.DatabaseURL == "" {
		return Config{}, errors.New("DATABASE_URL is required")
	}
	if cfg.MaxPageSize < 10 {
		cfg.MaxPageSize = 10
	}
	if cfg.MaxHeaderBytes < 8*1024 {
		cfg.MaxHeaderBytes = 8 * 1024
	}
	if cfg.DBMaxConns < 1 {
		cfg.DBMaxConns = 1
	}
	if cfg.DBMinConns < 0 {
		cfg.DBMinConns = 0
	}
	if cfg.DBMinConns > cfg.DBMaxConns {
		cfg.DBMinConns = cfg.DBMaxConns
	}
	if cfg.CacheNamespace == "" {
		cfg.CacheNamespace = "api-v2"
	}
	if cfg.CatalogSummaryRelation == "" {
		cfg.CatalogSummaryRelation = "public.catalog_slug_state"
	}
	return cfg, nil
}

func readCIDRs(key string) ([]netip.Prefix, error) {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return nil, nil
	}
	prefixes := make([]netip.Prefix, 0, 2)
	for _, candidate := range strings.Split(raw, ",") {
		prefix, err := netip.ParsePrefix(strings.TrimSpace(candidate))
		if err != nil {
			return nil, fmt.Errorf("%s contains invalid CIDR %q", key, candidate)
		}
		prefixes = append(prefixes, prefix.Masked())
	}
	return prefixes, nil
}

func getenv(key, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func readInt(key string, fallback int) int {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(raw)
	if err != nil {
		return fallback
	}
	return parsed
}

func readDuration(key string, fallback time.Duration) time.Duration {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return fallback
	}
	parsed, err := time.ParseDuration(raw)
	if err != nil {
		return fallback
	}
	return parsed
}

func readInt32(key string, fallback int32) int32 {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return fallback
	}
	parsed, err := strconv.ParseInt(raw, 10, 32)
	if err != nil {
		return fallback
	}
	return int32(parsed)
}

func readBool(key string, fallback bool) bool {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return fallback
	}
	parsed, err := strconv.ParseBool(raw)
	if err != nil {
		return fallback
	}
	return parsed
}

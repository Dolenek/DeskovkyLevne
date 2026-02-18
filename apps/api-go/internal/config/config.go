package config

import (
	"errors"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	ServerAddress  string
	DatabaseURL    string
	FrontendOrigin string
	ReadTimeout    time.Duration
	WriteTimeout   time.Duration
	IdleTimeout    time.Duration
	MaxPageSize    int
	RedisAddr      string
	RedisPassword  string
	RedisDB        int

	DBMaxConns        int32
	DBMinConns        int32
	DBMaxConnIdleTime time.Duration
	DBMaxConnLifetime time.Duration
	DBSimpleProtocol  bool

	HealthTimeout     time.Duration
	CatalogTimeout    time.Duration
	SearchTimeout     time.Duration
	ProductTimeout    time.Duration
	RecentTimeout     time.Duration
	CategoriesTimeout time.Duration
	PriceRangeTimeout time.Duration

	CacheNamespace    string
	CacheTTLCatalog   time.Duration
	CacheTTLSearch    time.Duration
	CacheTTLProduct   time.Duration
	CacheTTLRecent    time.Duration
	CacheTTLCategories time.Duration
	CacheTTLPriceRange time.Duration
}

func Load() (Config, error) {
	cfg := Config{
		ServerAddress:  getenv("API_ADDRESS", ":8080"),
		DatabaseURL:    strings.TrimSpace(os.Getenv("DATABASE_URL")),
		FrontendOrigin: getenv("FRONTEND_ORIGIN", "*"),
		ReadTimeout:    readDuration("API_READ_TIMEOUT", 10*time.Second),
		WriteTimeout:   readDuration("API_WRITE_TIMEOUT", 15*time.Second),
		IdleTimeout:    readDuration("API_IDLE_TIMEOUT", 60*time.Second),
		MaxPageSize:    readInt("API_MAX_PAGE_SIZE", 200),
		RedisAddr:      strings.TrimSpace(os.Getenv("REDIS_ADDR")),
		RedisPassword:  os.Getenv("REDIS_PASSWORD"),
		RedisDB:        readInt("REDIS_DB", 0),

		DBMaxConns:        readInt32("API_DB_MAX_CONNS", 30),
		DBMinConns:        readInt32("API_DB_MIN_CONNS", 5),
		DBMaxConnIdleTime: readDuration("API_DB_MAX_CONN_IDLE", 5*time.Minute),
		DBMaxConnLifetime: readDuration("API_DB_MAX_CONN_LIFETIME", 2*time.Hour),
		DBSimpleProtocol:  readBool("API_DB_SIMPLE_PROTOCOL", true),

		HealthTimeout:     readDuration("API_TIMEOUT_HEALTH", 2*time.Second),
		CatalogTimeout:    readDuration("API_TIMEOUT_CATALOG", 6*time.Second),
		SearchTimeout:     readDuration("API_TIMEOUT_SEARCH", 3*time.Second),
		ProductTimeout:    readDuration("API_TIMEOUT_PRODUCT", 6*time.Second),
		RecentTimeout:     readDuration("API_TIMEOUT_RECENT", 12*time.Second),
		CategoriesTimeout: readDuration("API_TIMEOUT_CATEGORIES", 4*time.Second),
		PriceRangeTimeout: readDuration("API_TIMEOUT_PRICE_RANGE", 4*time.Second),

		CacheNamespace:     getenv("API_CACHE_NAMESPACE", "api-v1"),
		CacheTTLCatalog:    readDuration("API_CACHE_TTL_CATALOG", 120*time.Second),
		CacheTTLSearch:     readDuration("API_CACHE_TTL_SEARCH", 60*time.Second),
		CacheTTLProduct:    readDuration("API_CACHE_TTL_PRODUCT", 300*time.Second),
		CacheTTLRecent:     readDuration("API_CACHE_TTL_RECENT", 120*time.Second),
		CacheTTLCategories: readDuration("API_CACHE_TTL_CATEGORIES", 600*time.Second),
		CacheTTLPriceRange: readDuration("API_CACHE_TTL_PRICE_RANGE", 180*time.Second),
	}
	if cfg.DatabaseURL == "" {
		return Config{}, errors.New("DATABASE_URL is required")
	}
	if cfg.MaxPageSize < 10 {
		cfg.MaxPageSize = 10
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
		cfg.CacheNamespace = "api-v1"
	}
	return cfg, nil
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

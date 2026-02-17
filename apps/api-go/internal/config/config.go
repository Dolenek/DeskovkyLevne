package config

import (
	"errors"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	ServerAddress string
	DatabaseURL   string
	FrontendOrigin string
	ReadTimeout   time.Duration
	WriteTimeout  time.Duration
	IdleTimeout   time.Duration
	MaxPageSize   int
	RedisAddr     string
	RedisPassword string
	RedisDB       int
}

func Load() (Config, error) {
	cfg := Config{
		ServerAddress: getenv("API_ADDRESS", ":8080"),
		DatabaseURL:   strings.TrimSpace(os.Getenv("DATABASE_URL")),
		FrontendOrigin: getenv("FRONTEND_ORIGIN", "*"),
		ReadTimeout:   readDuration("API_READ_TIMEOUT", 10*time.Second),
		WriteTimeout:  readDuration("API_WRITE_TIMEOUT", 15*time.Second),
		IdleTimeout:   readDuration("API_IDLE_TIMEOUT", 60*time.Second),
		MaxPageSize:   readInt("API_MAX_PAGE_SIZE", 200),
		RedisAddr:     strings.TrimSpace(os.Getenv("REDIS_ADDR")),
		RedisPassword: os.Getenv("REDIS_PASSWORD"),
		RedisDB:       readInt("REDIS_DB", 0),
	}
	if cfg.DatabaseURL == "" {
		return Config{}, errors.New("DATABASE_URL is required")
	}
	if cfg.MaxPageSize < 10 {
		cfg.MaxPageSize = 10
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

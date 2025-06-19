package config

import (
	"fmt"
	"os"
	"strings"
)

type Config struct {
	DatabaseURL string
	Port        string
}

func Load() *Config {
	cfg := &Config{
		Port: getEnv("PORT", "8080"),
	}

	// Check if we're in production (DATABASE_URL is set)
	if dbURL := os.Getenv("DATABASE_URL"); dbURL != "" {
		// Add sslmode=disable if not present and not in production
		if os.Getenv("PRODUCTION") == "" && !strings.Contains(dbURL, "sslmode=") {
			if strings.Contains(dbURL, "?") {
				cfg.DatabaseURL = dbURL + "&sslmode=disable"
			} else {
				cfg.DatabaseURL = dbURL + "?sslmode=disable"
			}
		} else {
			cfg.DatabaseURL = dbURL
		}
	} else {
		// Development configuration
		cfg.DatabaseURL = fmt.Sprintf(
			"postgres://%s:%s@%s:%s/%s?sslmode=disable",
			getEnv("DB_USER", "postgres"),
			getEnv("DB_PASSWORD", "testing"),
			getEnv("DB_HOST", "localhost"),
			getEnv("DB_PORT", "5432"),
			getEnv("DB_NAME", "mldegrees"),
		)
	}

	return cfg
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

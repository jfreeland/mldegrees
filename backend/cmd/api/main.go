package main

import (
	"fmt"
	"log"
	"net/http"

	"githib.com/jfreeland/mldegrees/backend/api/internal/auth"
	"githib.com/jfreeland/mldegrees/backend/api/internal/config"
	"githib.com/jfreeland/mldegrees/backend/api/internal/db"
	"githib.com/jfreeland/mldegrees/backend/api/internal/handlers"
	"githib.com/jfreeland/mldegrees/backend/api/internal/middleware"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {
	cfg := config.Load()

	database, err := db.New(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	fmt.Println("Starting ML Degrees API server...")
	fmt.Println("Connected to database successfully")

	// Create a new router for the application
	appMux := http.NewServeMux()

	// Health check endpoint
	appMux.HandleFunc("/api/health", handlers.EnableCORS(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	}))

	// Auth endpoint
	appMux.HandleFunc("/api/auth", handlers.EnableCORS(auth.HandleAuth(database)))

	// Local auth endpoint (for development only)
	appMux.HandleFunc("/api/auth/local", handlers.EnableCORS(handlers.HandleLocalAuth(database)))

	// Programs endpoint (public, but includes user votes if authenticated)
	appMux.HandleFunc("/api/programs", handlers.EnableCORS(handlers.HandlePrograms(database)))

	// Vote endpoint (requires authentication)
	appMux.HandleFunc("/api/vote", handlers.EnableCORS(auth.RequireAuth(handlers.HandleVote(database))))

	// Create the main router
	mainMux := http.NewServeMux()

	// Metrics endpoint (uninstrumented)
	mainMux.Handle("/metrics", promhttp.Handler())

	// Instrumented application endpoints
	authMiddleware := auth.Middleware(database)
	instrumentedApp := middleware.LoggingMiddleware(authMiddleware(appMux))
	mainMux.Handle("/", instrumentedApp)

	log.Printf("Server starting on :%s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, mainMux); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}

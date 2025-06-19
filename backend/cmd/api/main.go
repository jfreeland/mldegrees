package main

import (
	"fmt"
	"log"
	"net/http"

	"githib.com/jfreeland/mldegrees/backend/api/internal/auth"
	"githib.com/jfreeland/mldegrees/backend/api/internal/config"
	"githib.com/jfreeland/mldegrees/backend/api/internal/db"
	"githib.com/jfreeland/mldegrees/backend/api/internal/handlers"
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

	// Create router with auth middleware
	mux := http.NewServeMux()
	authMiddleware := auth.Middleware(database)

	// Health check endpoint
	mux.HandleFunc("/api/health", handlers.EnableCORS(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	}))

	// Auth endpoint
	mux.HandleFunc("/api/auth", handlers.EnableCORS(auth.HandleAuth(database)))

	// Programs endpoint (public, but includes user votes if authenticated)
	mux.HandleFunc("/api/programs", handlers.EnableCORS(handlers.HandlePrograms(database)))

	// Vote endpoint (requires authentication)
	mux.HandleFunc("/api/vote", handlers.EnableCORS(auth.RequireAuth(handlers.HandleVote(database))))

	// Apply auth middleware to all routes
	handler := authMiddleware(mux)

	log.Printf("Server starting on :%s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, handler); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}

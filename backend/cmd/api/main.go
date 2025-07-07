package main

import (
	"fmt"
	"log"
	"net/http"
	"path/filepath"
	"strings"

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

	// Run database migrations
	fmt.Println("Running database migrations...")
	migrationsDir := filepath.Join(".", "migrations")
	if err := database.RunMigrations(migrationsDir); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}
	fmt.Println("Database migrations completed")

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

	// Rate endpoint (requires authentication) - matches frontend expectation
	appMux.HandleFunc("/api/programs/", handlers.EnableCORS(auth.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		// Check if this is a rating request
		if r.Method == http.MethodPost && len(r.URL.Path) > len("/api/programs/") {
			pathParts := strings.Split(r.URL.Path, "/")
			if len(pathParts) >= 5 && pathParts[4] == "rate" {
				handlers.HandleProgramRate(database)(w, r)
				return
			}
		}
		http.Error(w, "Not found", http.StatusNotFound)
	})))

	// Propose program endpoint (requires authentication)
	appMux.HandleFunc("/api/programs/propose", handlers.EnableCORS(auth.RequireAuth(handlers.HandleProposeProgram(database))))

	// Program proposal endpoints
	appMux.HandleFunc("/api/programs/proposals", handlers.EnableCORS(auth.RequireAuth(handlers.HandleProgramProposal(database))))
	appMux.HandleFunc("/api/programs/proposals/user", handlers.EnableCORS(auth.RequireAuth(handlers.HandleGetUserProposals(database))))
	appMux.HandleFunc("/api/programs/proposals/", handlers.EnableCORS(auth.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodDelete:
			handlers.HandleDeleteUserProposal(database)(w, r)
		case http.MethodPut:
			handlers.HandleUpdateUserProposal(database)(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})))

	// Admin endpoints (require admin role)
	appMux.HandleFunc("/api/admin/programs", handlers.EnableCORS(auth.RequireAdmin(handlers.HandleAdminPrograms(database))))
	appMux.HandleFunc("/api/admin/programs/action", handlers.EnableCORS(auth.RequireAdmin(handlers.HandleAdminProgramAction(database))))
	appMux.HandleFunc("/api/admin/programs/all", handlers.EnableCORS(auth.RequireAdmin(handlers.HandleAdminAllPrograms(database))))
	appMux.HandleFunc("/api/admin/programs/", handlers.EnableCORS(auth.RequireAdmin(handlers.HandleAdminGetProgram(database))))
	appMux.HandleFunc("/api/admin/programs/update", handlers.EnableCORS(auth.RequireAdmin(handlers.HandleAdminUpdateProgram(database))))

	// Admin program proposal endpoints
	appMux.HandleFunc("/api/admin/proposals", handlers.EnableCORS(auth.RequireAdmin(handlers.HandleGetProgramProposals(database))))
	appMux.HandleFunc("/api/admin/proposals/review", handlers.EnableCORS(auth.RequireAdmin(handlers.HandleReviewProgramProposal(database))))

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

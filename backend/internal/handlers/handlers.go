package handlers

import (
	"encoding/json"
	"net/http"

	"githib.com/jfreeland/mldegrees/backend/api/internal/auth"
	"githib.com/jfreeland/mldegrees/backend/api/internal/db"
	"githib.com/jfreeland/mldegrees/backend/api/internal/models"
)

// HandlePrograms returns all programs with ratings
func HandlePrograms(database *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Get user from context if authenticated
		user := auth.GetUserFromContext(r.Context())
		var userID *int
		if user != nil {
			userID = &user.ID
		}

		// Get programs
		programs, err := database.GetPrograms(userID)
		if err != nil {
			http.Error(w, "Failed to get programs", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(programs)
	}
}

// HandleVote handles voting on programs
func HandleVote(database *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		user := auth.GetUserFromContext(r.Context())
		if user == nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		var req models.VoteRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Validate vote value
		if req.Vote != -1 && req.Vote != 1 && req.Vote != 0 {
			http.Error(w, "Invalid vote value", http.StatusBadRequest)
			return
		}

		// Handle vote removal
		if req.Vote == 0 {
			if err := database.RemoveVote(user.ID, req.ProgramID); err != nil {
				http.Error(w, "Failed to remove vote", http.StatusInternalServerError)
				return
			}
		} else {
			// Create or update vote
			if err := database.Vote(user.ID, req.ProgramID, req.Vote); err != nil {
				http.Error(w, "Failed to vote", http.StatusInternalServerError)
				return
			}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "success"})
	}
}

// EnableCORS adds CORS headers to responses
func EnableCORS(next http.HandlerFunc) http.HandlerFunc {
	allowedOrigins := []string{
		"http://localhost:3000",
		"https://machinelearningdegrees.com",
		"https://www.machinelearningdegrees.com",
		"https://www.mldegrees.com",
		"https://mldegrees.com",
	}

	return func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		// Check if origin is in allowed list
		for _, allowedOrigin := range allowedOrigins {
			if origin == allowedOrigin {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				break
			}
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

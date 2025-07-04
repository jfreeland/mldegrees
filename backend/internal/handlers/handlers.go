package handlers

import (
	"encoding/json"
	"fmt"
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

		// Parse query parameters for filtering
		filters := &models.ProgramFilters{
			DegreeType: r.URL.Query().Get("degree_type"),
			Country:    r.URL.Query().Get("country"),
			City:       r.URL.Query().Get("city"),
			State:      r.URL.Query().Get("state"),
			SortBy:     r.URL.Query().Get("sort_by"),
			SortOrder:  r.URL.Query().Get("sort_order"),
		}

		// Get programs with filters
		programs, err := database.GetProgramsWithFilters(userID, filters)
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

// HandleLocalAuth handles local development authentication
func HandleLocalAuth(database *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req struct {
			Role string `json:"role"` // "user" or "admin"
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Validate role
		if req.Role != "user" && req.Role != "admin" {
			http.Error(w, "Invalid role. Must be 'user' or 'admin'", http.StatusBadRequest)
			return
		}

		// Create local user
		email := req.Role + "@local.dev"
		name := "Local " + req.Role
		user, err := database.CreateLocalUser(email, name, req.Role)
		if err != nil {
			http.Error(w, "Failed to create local user", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"user":    user,
			"token":   user.GoogleID, // Use the local google_id as token
			"message": "Local authentication successful",
		})
	}
}

// HandleProposeProgram handles program proposals from authenticated users
func HandleProposeProgram(database *db.DB) http.HandlerFunc {
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

		var req models.ProposeRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Validate required fields
		if req.UniversityName == "" || req.ProgramName == "" || req.Description == "" {
			http.Error(w, "University name, program name, and description are required", http.StatusBadRequest)
			return
		}

		if req.DegreeType == "" {
			req.DegreeType = "masters" // Default value
		}

		if req.Country == "" {
			req.Country = "United States" // Default value
		}

		if req.City == "" {
			http.Error(w, "City is required", http.StatusBadRequest)
			return
		}

		// Create the program proposal
		program, err := database.ProposeProgram(&req)
		if err != nil {
			http.Error(w, "Failed to create program proposal", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"program": program,
			"message": "Program proposal submitted successfully. It will be reviewed by an administrator.",
		})
	}
}

// HandleAdminPrograms returns pending programs for admin review
func HandleAdminPrograms(database *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		user := auth.GetUserFromContext(r.Context())
		if user == nil || user.Role != "admin" {
			http.Error(w, "Forbidden: Admin access required", http.StatusForbidden)
			return
		}

		programs, err := database.GetPendingPrograms()
		if err != nil {
			http.Error(w, "Failed to get pending programs", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(programs)
	}
}

// HandleAdminProgramAction handles approving or rejecting program proposals
func HandleAdminProgramAction(database *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		user := auth.GetUserFromContext(r.Context())
		if user == nil || user.Role != "admin" {
			http.Error(w, "Forbidden: Admin access required", http.StatusForbidden)
			return
		}

		var req models.AdminProgramAction
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Validate action
		if req.Action != "approve" && req.Action != "reject" {
			http.Error(w, "Invalid action. Must be 'approve' or 'reject'", http.StatusBadRequest)
			return
		}

		// Convert action to visibility status
		visibility := "approved"
		if req.Action == "reject" {
			visibility = "rejected"
		}

		// Update program visibility
		err := database.UpdateProgramVisibility(req.ProgramID, visibility)
		if err != nil {
			http.Error(w, "Failed to update program status", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": fmt.Sprintf("Program %s successfully", req.Action+"d"),
			"status":  visibility,
		})
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

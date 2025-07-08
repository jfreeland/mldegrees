package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

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
			Cost:       r.URL.Query().Get("cost"),
			SortBy:     r.URL.Query().Get("sort_by"), SortOrder: r.URL.Query().Get("sort_order"),
		}

		// Get programs with filters
		programs, err := database.GetProgramsWithFilters(userID, filters)
		if err != nil {
			log.Printf("Error getting programs with filters (userID: %v, filters: %+v): %v", userID, filters, err)
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
				log.Printf("Error removing vote for user %d, program %d: %v", user.ID, req.ProgramID, err)
				http.Error(w, "Failed to remove vote", http.StatusInternalServerError)
				return
			}
		} else {
			// Create or update vote
			if err := database.Vote(user.ID, req.ProgramID, req.Vote); err != nil {
				log.Printf("Error voting for user %d, program %d, vote %d: %v", user.ID, req.ProgramID, req.Vote, err)
				http.Error(w, "Failed to vote", http.StatusInternalServerError)
				return
			}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "success"})
	}
}

// HandleProgramRate handles rating programs with program ID in URL path
func HandleProgramRate(database *db.DB) http.HandlerFunc {
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

		// Extract program ID from URL path: /api/programs/{id}/rate
		programIDStr := r.URL.Path[len("/api/programs/"):]
		if idx := strings.Index(programIDStr, "/"); idx != -1 {
			programIDStr = programIDStr[:idx]
		}
		if programIDStr == "" {
			http.Error(w, "Program ID required", http.StatusBadRequest)
			return
		}

		programID := 0
		if _, err := fmt.Sscanf(programIDStr, "%d", &programID); err != nil {
			http.Error(w, "Invalid program ID", http.StatusBadRequest)
			return
		}

		var req struct {
			Rating int `json:"rating"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Validate rating value (0 means remove rating)
		if req.Rating < 0 || req.Rating > 5 {
			http.Error(w, "Invalid rating value. Must be between 0 and 5 (0 to remove rating)", http.StatusBadRequest)
			return
		}

		// Handle rating removal
		if req.Rating == 0 {
			if err := database.RemoveRating(user.ID, programID); err != nil {
				log.Printf("Error removing rating for user %d, program %d: %v", user.ID, programID, err)
				http.Error(w, "Failed to remove rating", http.StatusInternalServerError)
				return
			}
		} else {
			// Create or update rating
			if err := database.Rate(user.ID, programID, req.Rating); err != nil {
				log.Printf("Error rating for user %d, program %d, rating %d: %v", user.ID, programID, req.Rating, err)
				http.Error(w, "Failed to rate", http.StatusInternalServerError)
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
			log.Printf("Error creating local user with role %s: %v", req.Role, err)
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
			log.Printf("Error creating program proposal for %s - %s: %v", req.UniversityName, req.ProgramName, err)
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
			log.Printf("Error getting pending programs: %v", err)
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
			log.Printf("Error updating program %d visibility to %s: %v", req.ProgramID, visibility, err)
			http.Error(w, "Failed to update program status", http.StatusInternalServerError)
			return
		}
		// Convert action to proper past tense for message
		var actionPastTense string
		if req.Action == "approve" {
			actionPastTense = "approved"
		} else if req.Action == "reject" {
			actionPastTense = "rejected"
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": fmt.Sprintf("Program %s successfully", actionPastTense),
			"status":  visibility,
		})
	}
}

// HandleAdminAllPrograms returns all programs for admin management
func HandleAdminAllPrograms(database *db.DB) http.HandlerFunc {
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

		// Parse query parameters for filtering
		filters := &models.ProgramFilters{
			DegreeType: r.URL.Query().Get("degree_type"),
			Country:    r.URL.Query().Get("country"),
			City:       r.URL.Query().Get("city"),
			State:      r.URL.Query().Get("state"),
			Cost:       r.URL.Query().Get("cost"),
			SortBy:     r.URL.Query().Get("sort_by"),
			SortOrder:  r.URL.Query().Get("sort_order"),
		}

		programs, err := database.GetAllProgramsWithFilters(filters)
		if err != nil {
			log.Printf("Error getting all programs with filters: %v", err)
			http.Error(w, "Failed to get programs", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(programs)
	}
}

// HandleAdminGetProgram returns a single program for editing
func HandleAdminGetProgram(database *db.DB) http.HandlerFunc {
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

		// Get program ID from URL path
		programIDStr := r.URL.Path[len("/api/admin/programs/"):]
		if programIDStr == "" {
			http.Error(w, "Program ID required", http.StatusBadRequest)
			return
		}

		programID := 0
		if _, err := fmt.Sscanf(programIDStr, "%d", &programID); err != nil {
			http.Error(w, "Invalid program ID", http.StatusBadRequest)
			return
		}

		program, err := database.GetProgramByID(programID)
		if err != nil {
			log.Printf("Error getting program %d: %v", programID, err)
			http.Error(w, "Failed to get program", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(program)
	}
}

// HandleAdminUpdateProgram handles updating program details
func HandleAdminUpdateProgram(database *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPut {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		user := auth.GetUserFromContext(r.Context())
		if user == nil || user.Role != "admin" {
			http.Error(w, "Forbidden: Admin access required", http.StatusForbidden)
			return
		}

		var req models.ProgramUpdateRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Validate required fields
		if req.UniversityName == "" || req.Name == "" || req.Description == "" {
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

		// Update the program
		program, err := database.UpdateProgram(&req)
		if err != nil {
			log.Printf("Error updating program %d: %v", req.ID, err)
			http.Error(w, "Failed to update program", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"program": program,
			"message": "Program updated successfully",
		})
	}
}

// HandleProgramProposal handles creating a new program change proposal
func HandleProgramProposal(database *db.DB) http.HandlerFunc {
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

		var req models.ProgramProposalRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Validate required fields
		if req.ProgramID == 0 || req.Reason == "" {
			http.Error(w, "Program ID and reason are required", http.StatusBadRequest)
			return
		}

		// At least one proposed change must be provided
		if req.ProposedName == nil && req.ProposedDescription == nil &&
			req.ProposedDegreeType == nil && req.ProposedCountry == nil &&
			req.ProposedCity == nil && req.ProposedState == nil && req.ProposedURL == nil {
			http.Error(w, "At least one proposed change must be provided", http.StatusBadRequest)
			return
		}

		// Create the program proposal
		proposal, err := database.CreateProgramProposal(user.ID, &req)
		if err != nil {
			log.Printf("Error creating program proposal for user %d, program %d: %v", user.ID, req.ProgramID, err)
			http.Error(w, "Failed to create program proposal", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"proposal": proposal,
			"message":  "Program change proposal submitted successfully. It will be reviewed by an administrator.",
		})
	}
}

// HandleGetProgramProposals returns program proposals for admin review
func HandleGetProgramProposals(database *db.DB) http.HandlerFunc {
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

		// Get status filter from query params
		status := r.URL.Query().Get("status")
		if status == "" {
			status = "pending" // Default to pending proposals
		}

		proposals, err := database.GetProgramProposals(status)
		if err != nil {
			log.Printf("Error getting program proposals with status %s: %v", status, err)
			http.Error(w, "Failed to get program proposals", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(proposals)
	}
}

// HandleReviewProgramProposal handles approving or rejecting program proposals
func HandleReviewProgramProposal(database *db.DB) http.HandlerFunc {
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

		var req models.ProgramProposalReviewRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Printf("Error decoding request body: %v", err)
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		log.Printf("Received proposal review request: ProposalID=%d, Action=%s", req.ProposalID, req.Action)

		// Validate required fields
		if req.ProposalID == 0 {
			log.Printf("ProposalID is 0, rejecting request")
			http.Error(w, "Proposal ID is required", http.StatusBadRequest)
			return
		}

		// Validate action
		if req.Action != "approve" && req.Action != "reject" {
			http.Error(w, "Invalid action. Must be 'approve' or 'reject'", http.StatusBadRequest)
			return
		}

		// Review the proposal
		err := database.ReviewProgramProposal(req.ProposalID, user.ID, req.Action, req.AdminNotes)
		if err != nil {
			log.Printf("Error reviewing program proposal %d by admin %d: %v", req.ProposalID, user.ID, err)
			http.Error(w, "Failed to review program proposal", http.StatusInternalServerError)
			return
		}

		// Convert action to proper status for response
		var status string
		if req.Action == "approve" {
			status = "approved"
		} else if req.Action == "reject" {
			status = "rejected"
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": fmt.Sprintf("Program proposal %s successfully", status),
			"status":  status,
		})
	}
}

// HandleGetUserProposals returns proposals created by the authenticated user
func HandleGetUserProposals(database *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		user := auth.GetUserFromContext(r.Context())
		if user == nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		proposals, err := database.GetUserProgramProposals(user.ID)
		if err != nil {
			log.Printf("Error getting program proposals for user %d: %v", user.ID, err)
			http.Error(w, "Failed to get your program proposals", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(proposals)
	}
}

// HandleDeleteUserProposal handles deleting a user's own proposal
func HandleDeleteUserProposal(database *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodDelete {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		user := auth.GetUserFromContext(r.Context())
		if user == nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Get proposal ID from URL path
		proposalIDStr := r.URL.Path[len("/api/programs/proposals/"):]
		if proposalIDStr == "" {
			http.Error(w, "Proposal ID required", http.StatusBadRequest)
			return
		}

		proposalID := 0
		if _, err := fmt.Sscanf(proposalIDStr, "%d", &proposalID); err != nil {
			http.Error(w, "Invalid proposal ID", http.StatusBadRequest)
			return
		}

		err := database.DeleteUserProgramProposal(proposalID, user.ID)
		if err != nil {
			log.Printf("Error deleting program proposal %d for user %d: %v", proposalID, user.ID, err)
			http.Error(w, "Failed to delete proposal", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Proposal deleted successfully",
		})
	}
}

// HandleUpdateUserProposal handles updating a user's own proposal
func HandleUpdateUserProposal(database *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPut {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		user := auth.GetUserFromContext(r.Context())
		if user == nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Get proposal ID from URL path
		proposalIDStr := r.URL.Path[len("/api/programs/proposals/"):]
		if proposalIDStr == "" {
			http.Error(w, "Proposal ID required", http.StatusBadRequest)
			return
		}

		proposalID := 0
		if _, err := fmt.Sscanf(proposalIDStr, "%d", &proposalID); err != nil {
			http.Error(w, "Invalid proposal ID", http.StatusBadRequest)
			return
		}

		var req models.ProgramProposalRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Validate required fields
		if req.Reason == "" {
			http.Error(w, "Reason is required", http.StatusBadRequest)
			return
		}

		// At least one proposed change must be provided
		if req.ProposedName == nil && req.ProposedDescription == nil &&
			req.ProposedDegreeType == nil && req.ProposedCountry == nil &&
			req.ProposedCity == nil && req.ProposedState == nil && req.ProposedURL == nil {
			http.Error(w, "At least one proposed change must be provided", http.StatusBadRequest)
			return
		}

		// Update the program proposal
		proposal, err := database.UpdateUserProgramProposal(proposalID, user.ID, &req)
		if err != nil {
			log.Printf("Error updating program proposal %d for user %d: %v", proposalID, user.ID, err)
			http.Error(w, "Failed to update program proposal", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"proposal": proposal,
			"message":  "Program proposal updated successfully",
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

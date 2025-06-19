package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"githib.com/jfreeland/mldegrees/backend/api/internal/db"
	"githib.com/jfreeland/mldegrees/backend/api/internal/models"
)

type contextKey string

const UserContextKey contextKey = "user"

// Middleware validates the auth token and adds user to context
func Middleware(database *db.DB) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get token from Authorization header
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				next.ServeHTTP(w, r)
				return
			}

			// Extract token
			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				next.ServeHTTP(w, r)
				return
			}

			token := parts[1]

			// For now, we'll trust the frontend's token which should contain the Google ID
			// In production, you'd validate this token with Google
			googleID := token // Simplified for this implementation

			// Get user from database
			user, err := database.GetUserByGoogleID(googleID)
			if err != nil {
				http.Error(w, "Internal server error", http.StatusInternalServerError)
				return
			}

			if user == nil {
				next.ServeHTTP(w, r)
				return
			}

			// Add user to context
			ctx := context.WithValue(r.Context(), UserContextKey, user)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetUserFromContext retrieves the user from the request context
func GetUserFromContext(ctx context.Context) *models.User {
	user, ok := ctx.Value(UserContextKey).(*models.User)
	if !ok {
		return nil
	}
	return user
}

// RequireAuth ensures the user is authenticated
func RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user := GetUserFromContext(r.Context())
		if user == nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		next(w, r)
	}
}

// HandleAuth handles the authentication callback from the frontend
func HandleAuth(database *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req struct {
			Email    string `json:"email"`
			Name     string `json:"name"`
			GoogleID string `json:"google_id"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Create or update user
		user, err := database.CreateOrUpdateUser(req.Email, req.Name, req.GoogleID)
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to create/update user: %v", err), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(user)
	}
}

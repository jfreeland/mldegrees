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

			// For now, we'll trust the frontend's token which should contain the OAuth ID
			// In production, you'd validate this token with the respective OAuth provider
			oauthID := token // Simplified for this implementation

			// Try to get user by Google ID first, then GitHub ID
			user, err := database.GetUserByGoogleID(oauthID)
			if err != nil {
				fmt.Printf("Auth middleware: Error getting user by Google ID: %v\n", err)
				http.Error(w, "Internal server error", http.StatusInternalServerError)
				return
			}

			// If not found by Google ID, try GitHub ID
			if user == nil {

				user, err = database.GetUserByGitHubID(oauthID)
				if err != nil {
					fmt.Printf("Auth middleware: Error getting user by GitHub ID: %v\n", err)
					http.Error(w, "Internal server error", http.StatusInternalServerError)
					return
				}
			}

			if user == nil {
				fmt.Printf("Auth middleware: User not found with OAuth ID: %s\n", oauthID)
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

// RequireAdmin ensures the user is authenticated and has admin role
func RequireAdmin(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user := GetUserFromContext(r.Context())
		if user == nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		if user.Role != "admin" {
			http.Error(w, "Forbidden: Admin access required", http.StatusForbidden)
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
			GitHubID string `json:"github_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		fmt.Printf("Auth handler: Received request - Email: %s, Name: %s, GoogleID: %s, GitHubID: %s\n",
			req.Email, req.Name, req.GoogleID, req.GitHubID)

		// Create or update user
		var user *models.User
		var err error

		if req.GoogleID != "" {
			fmt.Printf("Auth handler: Creating/updating user with Google ID: %s\n", req.GoogleID)
			user, err = database.CreateOrUpdateUserWithGoogle(req.Email, req.Name, req.GoogleID)
		} else if req.GitHubID != "" {
			fmt.Printf("Auth handler: Creating/updating user with GitHub ID: %s\n", req.GitHubID)
			user, err = database.CreateOrUpdateUserWithGitHub(req.Email, req.Name, req.GitHubID)
		} else {
			fmt.Printf("Auth handler: No OAuth ID provided\n")
			http.Error(w, "Either google_id or github_id must be provided", http.StatusBadRequest)
			return
		}

		if err != nil {
			fmt.Printf("Auth handler: Error creating/updating user: %v\n", err)
			http.Error(w, fmt.Sprintf("Failed to create/update user: %v", err), http.StatusInternalServerError)
			return
		}

		fmt.Printf("Auth handler: Successfully created/updated user: %d (%s)\\n", user.ID, user.Email)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(user)
	}
}

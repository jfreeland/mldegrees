package db

import (
	"database/sql"
	"fmt"

	"githib.com/jfreeland/mldegrees/backend/api/internal/models"
	_ "github.com/lib/pq"
)

type DB struct {
	*sql.DB
}

func New(dataSourceName string) (*DB, error) {
	db, err := sql.Open("postgres", dataSourceName)
	if err != nil {
		return nil, fmt.Errorf("opening database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("connecting to database: %w", err)
	}

	return &DB{db}, nil
}

func (db *DB) Close() error {
	return db.DB.Close()
}

// GetPrograms returns all programs with their ratings and optionally user votes
func (db *DB) GetPrograms(userID *int) ([]models.Program, error) {
	query := `
		SELECT
			p.id,
			p.university_id,
			p.name,
			p.description,
			u.name as university_name,
			COALESCE(SUM(v.vote), 0) as rating
		FROM programs p
		JOIN universities u ON p.university_id = u.id
		LEFT JOIN votes v ON p.id = v.program_id
		GROUP BY p.id, p.university_id, p.name, p.description, u.name
		ORDER BY rating DESC, p.id
	`

	rows, err := db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("querying programs: %w", err)
	}
	defer rows.Close()

	var programs []models.Program
	for rows.Next() {
		var p models.Program
		err := rows.Scan(&p.ID, &p.UniversityID, &p.Name, &p.Description, &p.UniversityName, &p.Rating)
		if err != nil {
			return nil, fmt.Errorf("scanning program: %w", err)
		}

		// Get user's vote if userID is provided
		if userID != nil {
			var vote sql.NullInt64
			err = db.QueryRow("SELECT vote FROM votes WHERE user_id = $1 AND program_id = $2", *userID, p.ID).Scan(&vote)
			if err != nil && err != sql.ErrNoRows {
				return nil, fmt.Errorf("getting user vote: %w", err)
			}
			if vote.Valid {
				v := int(vote.Int64)
				p.UserVote = &v
			}
		}

		programs = append(programs, p)
	}

	return programs, nil
}

// CreateOrUpdateUser creates a new user or updates existing one
func (db *DB) CreateOrUpdateUser(email, name, googleID string) (*models.User, error) {
	var user models.User

	query := `
		INSERT INTO users (email, name, google_id)
		VALUES ($1, $2, $3)
		ON CONFLICT (google_id)
		DO UPDATE SET
			email = EXCLUDED.email,
			name = EXCLUDED.name,
			updated_at = CURRENT_TIMESTAMP
		RETURNING id, email, name, google_id, created_at, updated_at
	`

	err := db.QueryRow(query, email, name, googleID).Scan(
		&user.ID, &user.Email, &user.Name, &user.GoogleID, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("creating/updating user: %w", err)
	}

	return &user, nil
}

// GetUserByGoogleID retrieves a user by their Google ID
func (db *DB) GetUserByGoogleID(googleID string) (*models.User, error) {
	var user models.User

	query := `SELECT id, email, name, google_id, created_at, updated_at FROM users WHERE google_id = $1`
	err := db.QueryRow(query, googleID).Scan(
		&user.ID, &user.Email, &user.Name, &user.GoogleID, &user.CreatedAt, &user.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("getting user: %w", err)
	}

	return &user, nil
}

// Vote creates or updates a user's vote for a program
func (db *DB) Vote(userID, programID, vote int) error {
	if vote != -1 && vote != 1 {
		return fmt.Errorf("invalid vote value: %d", vote)
	}

	query := `
		INSERT INTO votes (user_id, program_id, vote)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id, program_id)
		DO UPDATE SET vote = EXCLUDED.vote, updated_at = CURRENT_TIMESTAMP
	`

	_, err := db.Exec(query, userID, programID, vote)
	if err != nil {
		return fmt.Errorf("creating/updating vote: %w", err)
	}

	return nil
}

// RemoveVote removes a user's vote for a program
func (db *DB) RemoveVote(userID, programID int) error {
	_, err := db.Exec("DELETE FROM votes WHERE user_id = $1 AND program_id = $2", userID, programID)
	if err != nil {
		return fmt.Errorf("removing vote: %w", err)
	}
	return nil
}

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
	return db.GetProgramsWithFilters(userID, nil)
}

// GetProgramsWithFilters returns programs with filtering and sorting options
func (db *DB) GetProgramsWithFilters(userID *int, filters *models.ProgramFilters) ([]models.Program, error) {
	baseQuery := `
		SELECT
			p.id,
			p.university_id,
			p.name,
			p.description,
			p.degree_type,
			p.country,
			p.city,
			p.state,
			p.status,
			p.visibility,
			p.created_at,
			p.updated_at,
			u.name as university_name,
			COALESCE(SUM(v.vote), 0) as rating
		FROM programs p
		JOIN universities u ON p.university_id = u.id
		LEFT JOIN votes v ON p.id = v.program_id
		WHERE p.status = 'active' AND p.visibility = 'approved'`

	var whereConditions []string
	var args []interface{}
	argIndex := 1

	// Add filtering conditions
	if filters != nil {
		if filters.DegreeType != "" {
			whereConditions = append(whereConditions, fmt.Sprintf("AND p.degree_type = $%d", argIndex))
			args = append(args, filters.DegreeType)
			argIndex++
		}
		if filters.Country != "" {
			whereConditions = append(whereConditions, fmt.Sprintf("AND p.country = $%d", argIndex))
			args = append(args, filters.Country)
			argIndex++
		}
		if filters.City != "" {
			whereConditions = append(whereConditions, fmt.Sprintf("AND p.city = $%d", argIndex))
			args = append(args, filters.City)
			argIndex++
		}
		if filters.State != "" {
			whereConditions = append(whereConditions, fmt.Sprintf("AND p.state = $%d", argIndex))
			args = append(args, filters.State)
			argIndex++
		}
	}

	// Add WHERE conditions to query
	for _, condition := range whereConditions {
		baseQuery += " " + condition
	}

	// Add GROUP BY
	baseQuery += `
		GROUP BY p.id, p.university_id, p.name, p.description, p.degree_type, p.country, p.city, p.state, p.status, p.visibility, p.created_at, p.updated_at, u.name`

	// Add ORDER BY
	orderBy := "rating DESC, p.id"
	if filters != nil && filters.SortBy != "" {
		switch filters.SortBy {
		case "name":
			orderBy = "p.name"
		case "created_at":
			orderBy = "p.created_at"
		case "rating":
			orderBy = "rating"
		default:
			orderBy = "rating"
		}

		if filters.SortOrder == "asc" {
			orderBy += " ASC"
		} else {
			orderBy += " DESC"
		}
		orderBy += ", p.id"
	}

	baseQuery += " ORDER BY " + orderBy

	rows, err := db.Query(baseQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("querying programs: %w", err)
	}
	defer rows.Close()

	var programs []models.Program
	for rows.Next() {
		var p models.Program
		var state sql.NullString
		err := rows.Scan(&p.ID, &p.UniversityID, &p.Name, &p.Description, &p.DegreeType, &p.Country, &p.City, &state, &p.Status, &p.Visibility, &p.CreatedAt, &p.UpdatedAt, &p.UniversityName, &p.Rating)
		if err != nil {
			return nil, fmt.Errorf("scanning program: %w", err)
		}

		if state.Valid {
			p.State = &state.String
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
		INSERT INTO users (email, name, google_id, role)
		VALUES ($1, $2, $3, 'user')
		ON CONFLICT (google_id)
		DO UPDATE SET
			email = EXCLUDED.email,
			name = EXCLUDED.name,
			updated_at = CURRENT_TIMESTAMP
		RETURNING id, email, name, google_id, role, created_at, updated_at
	`

	err := db.QueryRow(query, email, name, googleID).Scan(
		&user.ID, &user.Email, &user.Name, &user.GoogleID, &user.Role, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("creating/updating user: %w", err)
	}

	return &user, nil
}

// GetUserByGoogleID retrieves a user by their Google ID
func (db *DB) GetUserByGoogleID(googleID string) (*models.User, error) {
	var user models.User

	query := `SELECT id, email, name, google_id, role, created_at, updated_at FROM users WHERE google_id = $1`
	err := db.QueryRow(query, googleID).Scan(
		&user.ID, &user.Email, &user.Name, &user.GoogleID, &user.Role, &user.CreatedAt, &user.UpdatedAt,
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

// CreateLocalUser creates a local development user
func (db *DB) CreateLocalUser(email, name, role string) (*models.User, error) {
	var user models.User

	query := `
		INSERT INTO users (email, name, google_id, role)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (google_id)
		DO UPDATE SET
			email = EXCLUDED.email,
			name = EXCLUDED.name,
			role = EXCLUDED.role,
			updated_at = CURRENT_TIMESTAMP
		RETURNING id, email, name, google_id, role, created_at, updated_at
	`

	// Use email as google_id for local users with a prefix
	localGoogleID := "local_" + email

	err := db.QueryRow(query, email, name, localGoogleID, role).Scan(
		&user.ID, &user.Email, &user.Name, &user.GoogleID, &user.Role, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("creating local user: %w", err)
	}

	return &user, nil
}

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

// CreateOrUpdateUser creates a new user or updates existing one (deprecated, use specific provider methods)
func (db *DB) CreateOrUpdateUser(email, name, googleID string) (*models.User, error) {
	return db.CreateOrUpdateUserWithGoogle(email, name, googleID)
}

// CreateOrUpdateUserWithGoogle creates a new user or updates existing one with Google OAuth
func (db *DB) CreateOrUpdateUserWithGoogle(email, name, googleID string) (*models.User, error) {
	var user models.User

	query := `
		INSERT INTO users (email, name, google_id, role)
		VALUES ($1, $2, $3, 'user')
		ON CONFLICT (google_id)
		DO UPDATE SET
			email = EXCLUDED.email,
			name = EXCLUDED.name,
			updated_at = CURRENT_TIMESTAMP
		RETURNING id, email, name, google_id, github_id, role, created_at, updated_at
	`

	var googleIDPtr, githubIDPtr sql.NullString
	err := db.QueryRow(query, email, name, googleID).Scan(
		&user.ID, &user.Email, &user.Name, &googleIDPtr, &githubIDPtr, &user.Role, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("creating/updating user: %w", err)
	}

	if googleIDPtr.Valid {
		user.GoogleID = &googleIDPtr.String
	}
	if githubIDPtr.Valid {
		user.GitHubID = &githubIDPtr.String
	}

	return &user, nil
}

// CreateOrUpdateUserWithGitHub creates a new user or updates existing one with GitHub OAuth
func (db *DB) CreateOrUpdateUserWithGitHub(email, name, githubID string) (*models.User, error) {
	var user models.User

	query := `
		INSERT INTO users (email, name, github_id, role)
		VALUES ($1, $2, $3, 'user')
		ON CONFLICT (github_id)
		DO UPDATE SET
			email = EXCLUDED.email,
			name = EXCLUDED.name,
			updated_at = CURRENT_TIMESTAMP
		RETURNING id, email, name, google_id, github_id, role, created_at, updated_at
	`

	var googleIDPtr, githubIDPtr sql.NullString
	err := db.QueryRow(query, email, name, githubID).Scan(
		&user.ID, &user.Email, &user.Name, &googleIDPtr, &githubIDPtr, &user.Role, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("creating/updating user: %w", err)
	}

	if googleIDPtr.Valid {
		user.GoogleID = &googleIDPtr.String
	}
	if githubIDPtr.Valid {
		user.GitHubID = &githubIDPtr.String
	}

	return &user, nil
}

// GetUserByGoogleID retrieves a user by their Google ID
func (db *DB) GetUserByGoogleID(googleID string) (*models.User, error) {
	var user models.User

	query := `SELECT id, email, name, google_id, github_id, role, created_at, updated_at FROM users WHERE google_id = $1`
	var googleIDPtr, githubIDPtr sql.NullString
	err := db.QueryRow(query, googleID).Scan(
		&user.ID, &user.Email, &user.Name, &googleIDPtr, &githubIDPtr, &user.Role, &user.CreatedAt, &user.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("getting user: %w", err)
	}

	if googleIDPtr.Valid {
		user.GoogleID = &googleIDPtr.String
	}
	if githubIDPtr.Valid {
		user.GitHubID = &githubIDPtr.String
	}

	return &user, nil
}

// GetUserByGitHubID retrieves a user by their GitHub ID
func (db *DB) GetUserByGitHubID(githubID string) (*models.User, error) {
	var user models.User

	query := `SELECT id, email, name, google_id, github_id, role, created_at, updated_at FROM users WHERE github_id = $1`
	var googleIDPtr, githubIDPtr sql.NullString
	err := db.QueryRow(query, githubID).Scan(
		&user.ID, &user.Email, &user.Name, &googleIDPtr, &githubIDPtr, &user.Role, &user.CreatedAt, &user.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("getting user: %w", err)
	}

	if googleIDPtr.Valid {
		user.GoogleID = &googleIDPtr.String
	}
	if githubIDPtr.Valid {
		user.GitHubID = &githubIDPtr.String
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
		RETURNING id, email, name, google_id, github_id, role, created_at, updated_at
	`

	// Use email as google_id for local users with a prefix
	localGoogleID := "local_" + email

	var googleIDPtr, githubIDPtr sql.NullString
	err := db.QueryRow(query, email, name, localGoogleID, role).Scan(
		&user.ID, &user.Email, &user.Name, &googleIDPtr, &githubIDPtr, &user.Role, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("creating local user: %w", err)
	}

	if googleIDPtr.Valid {
		user.GoogleID = &googleIDPtr.String
	}
	if githubIDPtr.Valid {
		user.GitHubID = &githubIDPtr.String
	}

	return &user, nil
}

// ProposeProgram creates a new program proposal with pending status
func (db *DB) ProposeProgram(req *models.ProposeRequest) (*models.Program, error) {
	tx, err := db.Begin()
	if err != nil {
		return nil, fmt.Errorf("beginning transaction: %w", err)
	}
	defer tx.Rollback()

	// First, find or create the university
	var universityID int
	err = tx.QueryRow("SELECT id FROM universities WHERE name = $1", req.UniversityName).Scan(&universityID)
	if err == sql.ErrNoRows {
		// Create new university
		err = tx.QueryRow("INSERT INTO universities (name) VALUES ($1) RETURNING id", req.UniversityName).Scan(&universityID)
		if err != nil {
			return nil, fmt.Errorf("creating university: %w", err)
		}
	} else if err != nil {
		return nil, fmt.Errorf("finding university: %w", err)
	}

	// Create the program with pending visibility
	var program models.Program
	query := `
		INSERT INTO programs (university_id, name, description, degree_type, country, city, state, status, visibility)
		VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', 'pending')
		RETURNING id, university_id, name, description, degree_type, country, city, state, status, visibility, created_at, updated_at
	`

	err = tx.QueryRow(query, universityID, req.ProgramName, req.Description, req.DegreeType, req.Country, req.City, req.State).Scan(
		&program.ID, &program.UniversityID, &program.Name, &program.Description, &program.DegreeType,
		&program.Country, &program.City, &program.State, &program.Status, &program.Visibility,
		&program.CreatedAt, &program.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("creating program: %w", err)
	}

	// Get university name for the response
	program.UniversityName = req.UniversityName

	if err = tx.Commit(); err != nil {
		return nil, fmt.Errorf("committing transaction: %w", err)
	}

	return &program, nil
}

// GetPendingPrograms returns all programs with pending visibility for admin review
func (db *DB) GetPendingPrograms() ([]models.Program, error) {
	query := `
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
			u.name as university_name
		FROM programs p
		JOIN universities u ON p.university_id = u.id
		WHERE p.visibility = 'pending'
		ORDER BY p.created_at DESC
	`

	rows, err := db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("querying pending programs: %w", err)
	}
	defer rows.Close()

	var programs []models.Program
	for rows.Next() {
		var p models.Program
		var state sql.NullString
		err := rows.Scan(&p.ID, &p.UniversityID, &p.Name, &p.Description, &p.DegreeType, &p.Country, &p.City, &state, &p.Status, &p.Visibility, &p.CreatedAt, &p.UpdatedAt, &p.UniversityName)
		if err != nil {
			return nil, fmt.Errorf("scanning program: %w", err)
		}

		if state.Valid {
			p.State = &state.String
		}

		programs = append(programs, p)
	}

	return programs, nil
}

// UpdateProgramVisibility updates a program's visibility status (approve/reject)
func (db *DB) UpdateProgramVisibility(programID int, visibility string) error {
	if visibility != "approved" && visibility != "rejected" {
		return fmt.Errorf("invalid visibility status: %s", visibility)
	}

	query := `UPDATE programs SET visibility = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`
	result, err := db.Exec(query, visibility, programID)
	if err != nil {
		return fmt.Errorf("updating program visibility: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("getting rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("program not found")
	}

	return nil
}

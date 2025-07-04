package db

import (
	"database/sql"
	"fmt"
	"time"

	"githib.com/jfreeland/mldegrees/backend/api/internal/migration"
	"githib.com/jfreeland/mldegrees/backend/api/internal/models"
	"github.com/lib/pq"
)

type DB struct {
	*sql.DB
}

func New(dataSourceName string) (*DB, error) {
	db, err := sql.Open("postgres", dataSourceName)
	if err != nil {
		return nil, fmt.Errorf("opening database: %w", err)
	}

	// Configure connection pool to prevent connection issues
	db.SetMaxOpenConns(25)                 // Maximum number of open connections
	db.SetMaxIdleConns(5)                  // Maximum number of idle connections
	db.SetConnMaxLifetime(5 * time.Minute) // Maximum lifetime of a connection

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("connecting to database: %w", err)
	}

	return &DB{db}, nil
}

// RunMigrations runs all pending database migrations
func (db *DB) RunMigrations(migrationsDir string) error {
	migrator := migration.New(db.DB, migrationsDir)
	return migrator.RunPendingMigrations()
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
			p.url,
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
		GROUP BY p.id, p.university_id, p.name, p.description, p.degree_type, p.country, p.city, p.state, p.url, p.status, p.visibility, p.created_at, p.updated_at, u.name`

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
		return nil, fmt.Errorf("querying programs with query '%s' and args %v: %w", baseQuery, args, err)
	}
	defer rows.Close()

	var programs []models.Program
	var programIDs []int
	for rows.Next() {
		var p models.Program
		var state sql.NullString
		var url sql.NullString
		err := rows.Scan(&p.ID, &p.UniversityID, &p.Name, &p.Description, &p.DegreeType, &p.Country, &p.City, &state, &url, &p.Status, &p.Visibility, &p.CreatedAt, &p.UpdatedAt, &p.UniversityName, &p.Rating)
		if err != nil {
			return nil, fmt.Errorf("scanning program: %w", err)
		}

		if state.Valid {
			p.State = &state.String
		}
		if url.Valid {
			p.URL = &url.String
		}

		programs = append(programs, p)
		programIDs = append(programIDs, p.ID)
	}

	// Get all user votes in a single query if userID is provided
	if userID != nil && len(programIDs) > 0 {
		userVotes, err := db.getUserVotesForPrograms(*userID, programIDs)
		if err != nil {
			return nil, fmt.Errorf("getting user votes: %w", err)
		}

		// Map votes to programs
		for i := range programs {
			if vote, exists := userVotes[programs[i].ID]; exists {
				programs[i].UserVote = &vote
			}
		}
	}

	return programs, nil
}

// getUserVotesForPrograms gets all user votes for a list of program IDs in a single query
func (db *DB) getUserVotesForPrograms(userID int, programIDs []int) (map[int]int, error) {
	if len(programIDs) == 0 {
		return make(map[int]int), nil
	}

	// Build the query with placeholders for program IDs
	query := "SELECT program_id, vote FROM votes WHERE user_id = $1 AND program_id = ANY($2)"

	// Convert programIDs to a format PostgreSQL can use
	rows, err := db.Query(query, userID, pq.Array(programIDs))
	if err != nil {
		return nil, fmt.Errorf("querying user votes: %w", err)
	}
	defer rows.Close()

	userVotes := make(map[int]int)
	for rows.Next() {
		var programID, vote int
		if err := rows.Scan(&programID, &vote); err != nil {
			return nil, fmt.Errorf("scanning user vote: %w", err)
		}
		userVotes[programID] = vote
	}

	return userVotes, nil
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
		INSERT INTO programs (university_id, name, description, degree_type, country, city, state, url, status, visibility)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', 'pending')
		RETURNING id, university_id, name, description, degree_type, country, city, state, url, status, visibility, created_at, updated_at
	`

	err = tx.QueryRow(query, universityID, req.ProgramName, req.Description, req.DegreeType, req.Country, req.City, req.State, req.URL).Scan(
		&program.ID, &program.UniversityID, &program.Name, &program.Description, &program.DegreeType,
		&program.Country, &program.City, &program.State, &program.URL, &program.Status, &program.Visibility,
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
			p.url,
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
		var url sql.NullString
		err := rows.Scan(&p.ID, &p.UniversityID, &p.Name, &p.Description, &p.DegreeType, &p.Country, &p.City, &state, &url, &p.Status, &p.Visibility, &p.CreatedAt, &p.UpdatedAt, &p.UniversityName)
		if err != nil {
			return nil, fmt.Errorf("scanning program: %w", err)
		}

		if state.Valid {
			p.State = &state.String
		}
		if url.Valid {
			p.URL = &url.String
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

// GetProgramByID returns a single program by ID for editing
func (db *DB) GetProgramByID(programID int) (*models.Program, error) {
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
			p.url,
			p.status,
			p.visibility,
			p.created_at,
			p.updated_at,
			u.name as university_name
		FROM programs p
		JOIN universities u ON p.university_id = u.id
		WHERE p.id = $1
	`

	var p models.Program
	var state sql.NullString
	var url sql.NullString
	err := db.QueryRow(query, programID).Scan(
		&p.ID, &p.UniversityID, &p.Name, &p.Description, &p.DegreeType,
		&p.Country, &p.City, &state, &url, &p.Status, &p.Visibility,
		&p.CreatedAt, &p.UpdatedAt, &p.UniversityName,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("program not found")
	}
	if err != nil {
		return nil, fmt.Errorf("getting program: %w", err)
	}

	if state.Valid {
		p.State = &state.String
	}
	if url.Valid {
		p.URL = &url.String
	}

	return &p, nil
}

// UpdateProgram updates a program's details
func (db *DB) UpdateProgram(req *models.ProgramUpdateRequest) (*models.Program, error) {
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

	// Update the program
	query := `
		UPDATE programs
		SET university_id = $1, name = $2, description = $3, degree_type = $4,
		    country = $5, city = $6, state = $7, url = $8, updated_at = CURRENT_TIMESTAMP
		WHERE id = $9
		RETURNING id, university_id, name, description, degree_type, country, city, state, url, status, visibility, created_at, updated_at
	`

	var program models.Program
	err = tx.QueryRow(query, universityID, req.Name, req.Description, req.DegreeType, req.Country, req.City, req.State, req.URL, req.ID).Scan(
		&program.ID, &program.UniversityID, &program.Name, &program.Description, &program.DegreeType,
		&program.Country, &program.City, &program.State, &program.URL, &program.Status, &program.Visibility,
		&program.CreatedAt, &program.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("updating program: %w", err)
	}

	// Set university name for the response
	program.UniversityName = req.UniversityName

	if err = tx.Commit(); err != nil {
		return nil, fmt.Errorf("committing transaction: %w", err)
	}

	return &program, nil
}

// GetAllPrograms returns all programs (approved, pending, rejected) for admin management
func (db *DB) GetAllPrograms() ([]models.Program, error) {
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
			p.url,
			p.status,
			p.visibility,
			p.created_at,
			p.updated_at,
			u.name as university_name,
			COALESCE(SUM(v.vote), 0) as rating
		FROM programs p
		JOIN universities u ON p.university_id = u.id
		LEFT JOIN votes v ON p.id = v.program_id
		WHERE p.status = 'active'
		GROUP BY p.id, p.university_id, p.name, p.description, p.degree_type, p.country, p.city, p.state, p.url, p.status, p.visibility, p.created_at, p.updated_at, u.name
		ORDER BY p.visibility, p.created_at DESC
	`

	rows, err := db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("querying all programs: %w", err)
	}
	defer rows.Close()

	var programs []models.Program
	for rows.Next() {
		var p models.Program
		var state sql.NullString
		var url sql.NullString
		err := rows.Scan(&p.ID, &p.UniversityID, &p.Name, &p.Description, &p.DegreeType, &p.Country, &p.City, &state, &url, &p.Status, &p.Visibility, &p.CreatedAt, &p.UpdatedAt, &p.UniversityName, &p.Rating)
		if err != nil {
			return nil, fmt.Errorf("scanning program: %w", err)
		}

		if state.Valid {
			p.State = &state.String
		}
		if url.Valid {
			p.URL = &url.String
		}

		programs = append(programs, p)
	}

	return programs, nil
}

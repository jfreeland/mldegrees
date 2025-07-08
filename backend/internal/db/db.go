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
			p.cost,
			p.status,
			p.visibility,
			p.created_at,
			p.updated_at,
			u.name as university_name,
			COALESCE(AVG(r.rating), 0) as average_rating
		FROM programs p
		JOIN universities u ON p.university_id = u.id
		LEFT JOIN ratings r ON p.id = r.program_id
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
		if filters.Cost != "" {
			whereConditions = append(whereConditions, fmt.Sprintf("AND p.cost = $%d", argIndex))
			args = append(args, filters.Cost)
			argIndex++
		}
	}

	// Add WHERE conditions to query
	for _, condition := range whereConditions {
		baseQuery += " " + condition
	}

	// Add GROUP BY
	baseQuery += `
		GROUP BY p.id, p.university_id, p.name, p.description, p.degree_type, p.country, p.city, p.state, p.url, p.cost, p.status, p.visibility, p.created_at, p.updated_at, u.name`

	// Add ORDER BY
	orderBy := "average_rating DESC, p.id"
	if filters != nil && filters.SortBy != "" {
		switch filters.SortBy {
		case "name":
			orderBy = "p.name"
		case "created_at":
			orderBy = "p.created_at"
		case "rating":
			orderBy = "average_rating"
		default:
			orderBy = "average_rating"
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
		err := rows.Scan(&p.ID, &p.UniversityID, &p.Name, &p.Description, &p.DegreeType, &p.Country, &p.City, &state, &url, &p.Cost, &p.Status, &p.Visibility, &p.CreatedAt, &p.UpdatedAt, &p.UniversityName, &p.AverageRating)
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

	// Get all user votes and ratings in a single query if userID is provided
	if userID != nil && len(programIDs) > 0 {
		userVotes, err := db.getUserVotesForPrograms(*userID, programIDs)
		if err != nil {
			return nil, fmt.Errorf("getting user votes: %w", err)
		}

		userRatings, err := db.getUserRatingsForPrograms(*userID, programIDs)
		if err != nil {
			return nil, fmt.Errorf("getting user ratings: %w", err)
		}

		// Map votes and ratings to programs
		for i := range programs {
			if vote, exists := userVotes[programs[i].ID]; exists {
				programs[i].UserVote = &vote
			}
			if rating, exists := userRatings[programs[i].ID]; exists {
				programs[i].UserRating = &rating
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
		var programID int
		var vote int
		err := rows.Scan(&programID, &vote)
		if err != nil {
			return nil, fmt.Errorf("scanning user vote: %w", err)
		}
		userVotes[programID] = vote
	}

	return userVotes, nil
}

// getUserRatingsForPrograms gets all user ratings for a list of program IDs in a single query
func (db *DB) getUserRatingsForPrograms(userID int, programIDs []int) (map[int]int, error) {
	if len(programIDs) == 0 {
		return make(map[int]int), nil
	}

	// Build the query with placeholders for program IDs
	query := "SELECT program_id, rating FROM ratings WHERE user_id = $1 AND program_id = ANY($2)"

	// Convert programIDs to a format PostgreSQL can use
	rows, err := db.Query(query, userID, pq.Array(programIDs))
	if err != nil {
		return nil, fmt.Errorf("querying user ratings: %w", err)
	}
	defer rows.Close()

	userRatings := make(map[int]int)
	for rows.Next() {
		var programID int
		var rating int
		err := rows.Scan(&programID, &rating)
		if err != nil {
			return nil, fmt.Errorf("scanning user rating: %w", err)
		}
		userRatings[programID] = rating
	}

	return userRatings, nil
}

// GetUserByGoogleID retrieves a user by their Google ID
func (db *DB) GetUserByGoogleID(googleID string) (*models.User, error) {
	var user models.User
	err := db.QueryRow("SELECT id, email, name, google_id, github_id, role, created_at, updated_at FROM users WHERE google_id = $1", googleID).
		Scan(&user.ID, &user.Email, &user.Name, &user.GoogleID, &user.GitHubID, &user.Role, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetUserByGitHubID retrieves a user by their GitHub ID
func (db *DB) GetUserByGitHubID(githubID string) (*models.User, error) {
	var user models.User
	err := db.QueryRow("SELECT id, email, name, google_id, github_id, role, created_at, updated_at FROM users WHERE github_id = $1", githubID).
		Scan(&user.ID, &user.Email, &user.Name, &user.GoogleID, &user.GitHubID, &user.Role, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// CreateOrUpdateUserWithGoogle creates or updates a user with Google OAuth
func (db *DB) CreateOrUpdateUserWithGoogle(email, name, googleID string) (*models.User, error) {
	var user models.User
	err := db.QueryRow(`
		INSERT INTO users (email, name, google_id, role, created_at, updated_at)
		VALUES ($1, $2, $3, 'user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		ON CONFLICT (google_id) DO UPDATE SET
			email = EXCLUDED.email,
			name = EXCLUDED.name,
			updated_at = CURRENT_TIMESTAMP
		RETURNING id, email, name, google_id, github_id, role, created_at, updated_at`,
		email, name, googleID).
		Scan(&user.ID, &user.Email, &user.Name, &user.GoogleID, &user.GitHubID, &user.Role, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("creating/updating user with Google: %w", err)
	}
	return &user, nil
}

// CreateOrUpdateUserWithGitHub creates or updates a user with GitHub OAuth
func (db *DB) CreateOrUpdateUserWithGitHub(email, name, githubID string) (*models.User, error) {
	var user models.User
	err := db.QueryRow(`
		INSERT INTO users (email, name, github_id, role, created_at, updated_at)
		VALUES ($1, $2, $3, 'user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		ON CONFLICT (github_id) DO UPDATE SET
			email = EXCLUDED.email,
			name = EXCLUDED.name,
			updated_at = CURRENT_TIMESTAMP
		RETURNING id, email, name, google_id, github_id, role, created_at, updated_at`,
		email, name, githubID).
		Scan(&user.ID, &user.Email, &user.Name, &user.GoogleID, &user.GitHubID, &user.Role, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("creating/updating user with GitHub: %w", err)
	}
	return &user, nil
}

// RemoveVote removes a user's vote for a program
func (db *DB) RemoveVote(userID, programID int) error {
	_, err := db.Exec("DELETE FROM votes WHERE user_id = $1 AND program_id = $2", userID, programID)
	if err != nil {
		return fmt.Errorf("removing vote: %w", err)
	}
	return nil
}

// Vote adds or updates a user's vote for a program
func (db *DB) Vote(userID, programID, vote int) error {
	_, err := db.Exec(`
		INSERT INTO votes (user_id, program_id, vote, created_at, updated_at)
		VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		ON CONFLICT (user_id, program_id) DO UPDATE SET
			vote = EXCLUDED.vote,
			updated_at = CURRENT_TIMESTAMP`,
		userID, programID, vote)
	if err != nil {
		return fmt.Errorf("voting: %w", err)
	}
	return nil
}

// Rate adds or updates a user's rating for a program
func (db *DB) Rate(userID, programID, rating int) error {
	_, err := db.Exec(`
		INSERT INTO ratings (user_id, program_id, rating, created_at, updated_at)
		VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		ON CONFLICT (user_id, program_id) DO UPDATE SET
			rating = EXCLUDED.rating,
			updated_at = CURRENT_TIMESTAMP`,
		userID, programID, rating)
	if err != nil {
		return fmt.Errorf("rating: %w", err)
	}
	return nil
}

// RemoveRating removes a user's rating for a program
func (db *DB) RemoveRating(userID, programID int) error {
	_, err := db.Exec("DELETE FROM ratings WHERE user_id = $1 AND program_id = $2", userID, programID)
	if err != nil {
		return fmt.Errorf("removing rating: %w", err)
	}
	return nil
}

// CreateLocalUser creates a local user (for testing/admin purposes)
func (db *DB) CreateLocalUser(email, name, role string) (*models.User, error) {
	var user models.User
	// Use email as dummy google_id to satisfy the check constraint
	dummyGoogleID := "local_" + email
	err := db.QueryRow(`
		INSERT INTO users (email, name, google_id, role, created_at, updated_at)
		VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		ON CONFLICT (google_id) DO UPDATE SET
			email = EXCLUDED.email,
			name = EXCLUDED.name,
			role = EXCLUDED.role,
			updated_at = CURRENT_TIMESTAMP
		RETURNING id, email, name, google_id, github_id, role, created_at, updated_at`,
		email, name, dummyGoogleID, role).
		Scan(&user.ID, &user.Email, &user.Name, &user.GoogleID, &user.GitHubID, &user.Role, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("creating local user: %w", err)
	}
	return &user, nil
}

// ProposeProgram creates a new program proposal
func (db *DB) ProposeProgram(req *models.ProposeRequest) (*models.Program, error) {
	// First, find or create the university
	var universityID int
	err := db.QueryRow("SELECT id FROM universities WHERE name = $1", req.UniversityName).Scan(&universityID)
	if err != nil {
		// University doesn't exist, create it
		err = db.QueryRow("INSERT INTO universities (name, created_at, updated_at) VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id", req.UniversityName).Scan(&universityID)
		if err != nil {
			return nil, fmt.Errorf("creating university: %w", err)
		}
	}

	// Create the program
	var program models.Program
	err = db.QueryRow(`
		INSERT INTO programs (university_id, name, description, degree_type, country, city, state, url, cost, status, visibility, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		RETURNING id, university_id, name, description, degree_type, country, city, state, url, cost, status, visibility, created_at, updated_at`,
		universityID, req.ProgramName, req.Description, req.DegreeType, req.Country, req.City, req.State, req.URL, req.Cost).
		Scan(&program.ID, &program.UniversityID, &program.Name, &program.Description, &program.DegreeType, &program.Country, &program.City, &program.State, &program.URL, &program.Cost, &program.Status, &program.Visibility, &program.CreatedAt, &program.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("creating program: %w", err)
	}

	program.UniversityName = req.UniversityName
	return &program, nil
}

// GetPendingPrograms retrieves all programs with pending visibility
func (db *DB) GetPendingPrograms() ([]models.Program, error) {
	rows, err := db.Query(`
		SELECT p.id, p.university_id, p.name, p.description, p.degree_type, p.country, p.city, p.state, p.url, p.cost, p.status, p.visibility, p.created_at, p.updated_at, u.name as university_name
		FROM programs p
		JOIN universities u ON p.university_id = u.id
		WHERE p.visibility = 'pending'
		ORDER BY p.created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("querying pending programs: %w", err)
	}
	defer rows.Close()

	var programs []models.Program
	for rows.Next() {
		var p models.Program
		var state sql.NullString
		var url sql.NullString
		err := rows.Scan(&p.ID, &p.UniversityID, &p.Name, &p.Description, &p.DegreeType, &p.Country, &p.City, &state, &url, &p.Cost, &p.Status, &p.Visibility, &p.CreatedAt, &p.UpdatedAt, &p.UniversityName)
		if err != nil {
			return nil, fmt.Errorf("scanning pending program: %w", err)
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

// UpdateProgramVisibility updates a program's visibility status
func (db *DB) UpdateProgramVisibility(programID int, visibility string) error {
	_, err := db.Exec("UPDATE programs SET visibility = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", visibility, programID)
	if err != nil {
		return fmt.Errorf("updating program visibility: %w", err)
	}
	return nil
}

// GetAllPrograms retrieves all programs (for admin use)
func (db *DB) GetAllPrograms() ([]models.Program, error) {
	return db.GetAllProgramsWithFilters(nil)
}

// GetAllProgramsWithFilters retrieves all programs with filtering (for admin use)
func (db *DB) GetAllProgramsWithFilters(filters *models.ProgramFilters) ([]models.Program, error) {
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
			p.cost,
			p.status,
			p.visibility,
			p.created_at,
			p.updated_at,
			u.name as university_name,
			COALESCE(AVG(r.rating), 0) as average_rating
		FROM programs p
		JOIN universities u ON p.university_id = u.id
		LEFT JOIN ratings r ON p.id = r.program_id
		WHERE p.status = 'active'`

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
		if filters.Cost != "" {
			whereConditions = append(whereConditions, fmt.Sprintf("AND p.cost = $%d", argIndex))
			args = append(args, filters.Cost)
			argIndex++
		}
	}

	// Add WHERE conditions to query
	for _, condition := range whereConditions {
		baseQuery += " " + condition
	}

	// Add GROUP BY
	baseQuery += `
		GROUP BY p.id, p.university_id, p.name, p.description, p.degree_type, p.country, p.city, p.state, p.url, p.cost, p.status, p.visibility, p.created_at, p.updated_at, u.name`

	// Add ORDER BY
	orderBy := "p.created_at DESC, p.id"
	if filters != nil && filters.SortBy != "" {
		switch filters.SortBy {
		case "name":
			orderBy = "p.name"
		case "university_name":
			orderBy = "u.name"
		case "degree_type":
			orderBy = "p.degree_type"
		case "country":
			orderBy = "p.country"
		case "visibility":
			orderBy = "p.visibility"
		case "created_at":
			orderBy = "p.created_at"
		default:
			orderBy = "p.created_at"
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
		return nil, fmt.Errorf("querying all programs with filters: %w", err)
	}
	defer rows.Close()

	var programs []models.Program
	for rows.Next() {
		var p models.Program
		var state sql.NullString
		var url sql.NullString
		err := rows.Scan(&p.ID, &p.UniversityID, &p.Name, &p.Description, &p.DegreeType, &p.Country, &p.City, &state, &url, &p.Cost, &p.Status, &p.Visibility, &p.CreatedAt, &p.UpdatedAt, &p.UniversityName, &p.AverageRating)
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

// GetProgramByID retrieves a program by its ID
func (db *DB) GetProgramByID(programID int) (*models.Program, error) {
	var p models.Program
	var state sql.NullString
	var url sql.NullString
	err := db.QueryRow(`
		SELECT p.id, p.university_id, p.name, p.description, p.degree_type, p.country, p.city, p.state, p.url, p.cost, p.status, p.visibility, p.created_at, p.updated_at, u.name as university_name, COALESCE(AVG(r.rating), 0) as average_rating
		FROM programs p
		JOIN universities u ON p.university_id = u.id
		LEFT JOIN ratings r ON p.id = r.program_id
		WHERE p.id = $1
		GROUP BY p.id, p.university_id, p.name, p.description, p.degree_type, p.country, p.city, p.state, p.url, p.cost, p.status, p.visibility, p.created_at, p.updated_at, u.name`,
		programID).
		Scan(&p.ID, &p.UniversityID, &p.Name, &p.Description, &p.DegreeType, &p.Country, &p.City, &state, &url, &p.Cost, &p.Status, &p.Visibility, &p.CreatedAt, &p.UpdatedAt, &p.UniversityName, &p.AverageRating)
	if err != nil {
		return nil, fmt.Errorf("getting program by ID: %w", err)
	}

	if state.Valid {
		p.State = &state.String
	}
	if url.Valid {
		p.URL = &url.String
	}

	return &p, nil
}

// UpdateProgram updates a program's information
func (db *DB) UpdateProgram(req *models.ProgramUpdateRequest) (*models.Program, error) {
	// First, find or create the university
	var universityID int
	err := db.QueryRow("SELECT id FROM universities WHERE name = $1", req.UniversityName).Scan(&universityID)
	if err != nil {
		// University doesn't exist, create it
		err = db.QueryRow("INSERT INTO universities (name, created_at, updated_at) VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id", req.UniversityName).Scan(&universityID)
		if err != nil {
			return nil, fmt.Errorf("creating university: %w", err)
		}
	}

	// Update the program
	var program models.Program
	var state sql.NullString
	var url sql.NullString
	err = db.QueryRow(`
		UPDATE programs SET
			university_id = $1,
			name = $2,
			description = $3,
			degree_type = $4,
			country = $5,
			city = $6,
			state = $7,
			url = $8,
			cost = $9,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $10
		RETURNING id, university_id, name, description, degree_type, country, city, state, url, cost, status, visibility, created_at, updated_at`,
		universityID, req.Name, req.Description, req.DegreeType, req.Country, req.City, req.State, req.URL, req.Cost, req.ID).
		Scan(&program.ID, &program.UniversityID, &program.Name, &program.Description, &program.DegreeType, &program.Country, &program.City, &state, &url, &program.Cost, &program.Status, &program.Visibility, &program.CreatedAt, &program.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("updating program: %w", err)
	}

	if state.Valid {
		program.State = &state.String
	}
	if url.Valid {
		program.URL = &url.String
	}

	program.UniversityName = req.UniversityName
	return &program, nil
}

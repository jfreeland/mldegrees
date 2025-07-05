package migration

import (
	"crypto/sha256"
	"database/sql"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

type Migration struct {
	Filename  string
	Content   string
	Checksum  string
	AppliedAt *time.Time
}

type Migrator struct {
	db            *sql.DB
	migrationsDir string
}

func New(db *sql.DB, migrationsDir string) *Migrator {
	return &Migrator{
		db:            db,
		migrationsDir: migrationsDir,
	}
}

// RunPendingMigrations runs all pending migrations
func (m *Migrator) RunPendingMigrations() error {
	// Ensure migrations table exists
	if err := m.ensureMigrationsTable(); err != nil {
		return fmt.Errorf("ensuring migrations table: %w", err)
	}

	// Get all migration files
	migrationFiles, err := m.getMigrationFiles()
	if err != nil {
		return fmt.Errorf("getting migration files: %w", err)
	}

	// Get applied migrations from database
	appliedMigrations, err := m.getAppliedMigrations()
	if err != nil {
		return fmt.Errorf("getting applied migrations: %w", err)
	}

	// Find pending migrations
	pendingMigrations := m.findPendingMigrations(migrationFiles, appliedMigrations)

	// Run pending migrations
	for _, migration := range pendingMigrations {
		if err := m.runMigration(migration); err != nil {
			return fmt.Errorf("running migration %s: %w", migration.Filename, err)
		}
		fmt.Printf("✓ Applied migration: %s\n", migration.Filename)
	}

	if len(pendingMigrations) == 0 {
		fmt.Println("No pending migrations to run")
	} else {
		fmt.Printf("Successfully applied %d migrations\n", len(pendingMigrations))
	}

	return nil
}

// ensureMigrationsTable creates the migrations table if it doesn't exist
func (m *Migrator) ensureMigrationsTable() error {
	query := `
		CREATE TABLE IF NOT EXISTS migrations (
			id SERIAL PRIMARY KEY,
			filename VARCHAR(255) NOT NULL UNIQUE,
			applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			checksum VARCHAR(64)
		);

		CREATE INDEX IF NOT EXISTS idx_migrations_filename ON migrations(filename);
	`

	_, err := m.db.Exec(query)
	return err
}

// getMigrationFiles reads all .sql files from the migrations directory
func (m *Migrator) getMigrationFiles() ([]Migration, error) {
	var migrations []Migration

	err := filepath.WalkDir(m.migrationsDir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		if d.IsDir() || !strings.HasSuffix(path, ".sql") {
			return nil
		}

		content, err := os.ReadFile(path)
		if err != nil {
			return fmt.Errorf("reading file %s: %w", path, err)
		}

		filename := filepath.Base(path)
		checksum := fmt.Sprintf("%x", sha256.Sum256(content))

		migrations = append(migrations, Migration{
			Filename: filename,
			Content:  string(content),
			Checksum: checksum,
		})

		return nil
	})

	if err != nil {
		return nil, err
	}

	// Sort migrations by filename to ensure consistent order
	sort.Slice(migrations, func(i, j int) bool {
		return migrations[i].Filename < migrations[j].Filename
	})

	return migrations, nil
}

// getAppliedMigrations gets all migrations that have been applied from the database
func (m *Migrator) getAppliedMigrations() (map[string]Migration, error) {
	query := `SELECT filename, applied_at, checksum FROM migrations ORDER BY applied_at`

	rows, err := m.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	applied := make(map[string]Migration)
	for rows.Next() {
		var migration Migration
		var checksum sql.NullString

		err := rows.Scan(&migration.Filename, &migration.AppliedAt, &checksum)
		if err != nil {
			return nil, err
		}

		if checksum.Valid {
			migration.Checksum = checksum.String
		}

		applied[migration.Filename] = migration
	}

	return applied, nil
}

// findPendingMigrations compares file migrations with applied migrations
func (m *Migrator) findPendingMigrations(fileMigrations []Migration, appliedMigrations map[string]Migration) []Migration {
	var pending []Migration

	for _, fileMigration := range fileMigrations {
		if appliedMigration, exists := appliedMigrations[fileMigration.Filename]; exists {
			// Check if checksum matches (optional integrity check)
			if appliedMigration.Checksum != "" && appliedMigration.Checksum != fileMigration.Checksum {
				fmt.Printf("⚠ Warning: Migration %s has different checksum than when applied\n", fileMigration.Filename)
			}
			continue
		}

		pending = append(pending, fileMigration)
	}

	return pending
}

// runMigration executes a single migration
func (m *Migrator) runMigration(migration Migration) error {
	tx, err := m.db.Begin()
	if err != nil {
		return fmt.Errorf("beginning transaction: %w", err)
	}
	defer tx.Rollback()

	// Execute the migration SQL
	_, err = tx.Exec(migration.Content)
	if err != nil {
		return fmt.Errorf("executing migration SQL: %w", err)
	}

	// Record the migration as applied
	_, err = tx.Exec(
		`INSERT INTO migrations (filename, checksum) VALUES ($1, $2)`,
		migration.Filename,
		migration.Checksum,
	)
	if err != nil {
		return fmt.Errorf("recording migration: %w", err)
	}

	return tx.Commit()
}

// GetMigrationStatus returns the status of all migrations
func (m *Migrator) GetMigrationStatus() ([]Migration, error) {
	fileMigrations, err := m.getMigrationFiles()
	if err != nil {
		return nil, fmt.Errorf("getting migration files: %w", err)
	}

	appliedMigrations, err := m.getAppliedMigrations()
	if err != nil {
		return nil, fmt.Errorf("getting applied migrations: %w", err)
	}

	var status []Migration
	for _, fileMigration := range fileMigrations {
		if appliedMigration, exists := appliedMigrations[fileMigration.Filename]; exists {
			fileMigration.AppliedAt = appliedMigration.AppliedAt
		}
		status = append(status, fileMigration)
	}

	return status, nil
}

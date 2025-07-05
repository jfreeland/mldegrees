#!/bin/bash

# Database setup script for ML Degrees
# This script sets up a fresh database using the migration system

echo "Setting up ML Degrees database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is not set"
  echo "Example: export DATABASE_URL='postgres://user:password@localhost/mldegrees'"
  exit 1
fi

# Function to check if database exists and is accessible
check_database() {
  echo "Checking database connection..."
  if psql "$DATABASE_URL" -c '\q' 2>/dev/null; then
    echo "✓ Database connection successful"
    return 0
  else
    echo "✗ Cannot connect to database"
    echo "Please ensure:"
    echo "  1. PostgreSQL is running"
    echo "  2. Database exists"
    echo "  3. DATABASE_URL is correct"
    return 1
  fi
}

# Function to drop all tables (for fresh setup)
drop_all_tables() {
  echo "Dropping all existing tables..."
  psql "$DATABASE_URL" <<'EOF'
-- Drop views first
DROP VIEW IF EXISTS user_stats CASCADE;
DROP VIEW IF EXISTS program_ratings CASCADE;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS programs CASCADE;
DROP TABLE IF EXISTS universities CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS migrations CASCADE;

-- Reset sequences if they exist
DROP SEQUENCE IF EXISTS users_id_seq CASCADE;
DROP SEQUENCE IF EXISTS universities_id_seq CASCADE;
DROP SEQUENCE IF EXISTS programs_id_seq CASCADE;
DROP SEQUENCE IF EXISTS votes_id_seq CASCADE;
DROP SEQUENCE IF EXISTS migrations_id_seq CASCADE;

EOF

  if [ $? -eq 0 ]; then
    echo "✓ All tables dropped successfully"
  else
    echo "✗ Failed to drop tables"
    exit 1
  fi
}

# Function to run migrations using Go
run_migrations() {
  echo "Building migration runner..."

  # Create a temporary migration runner
  cat >migrate_temp.go <<'EOF'
package main

import (
	"fmt"
	"log"

	"githib.com/jfreeland/mldegrees/backend/api/internal/config"
	"githib.com/jfreeland/mldegrees/backend/api/internal/db"
)

func main() {
	cfg := config.Load()

	database, err := db.New(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	fmt.Println("Running database migrations...")
	if err := database.RunMigrations("migrations"); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}
	fmt.Println("✓ Database migrations completed successfully!")
}
EOF

  # Run the migration
  echo "Running migrations..."
  go run migrate_temp.go

  local exit_code=$?

  # Clean up temporary file
  rm -f migrate_temp.go

  return $exit_code
}

# Main execution flow
main() {
  # Check database connection
  if ! check_database; then
    exit 1
  fi

  # Ask user if they want to drop existing tables
  echo ""
  echo "⚠️  WARNING: This will drop ALL existing tables and data!"
  read -p "Do you want to proceed with a fresh database setup? (y/N): " -n 1 -r
  echo

  if [[ $REPLY =~ ^[Yy]$ ]]; then
    drop_all_tables
  else
    echo "Skipping table drop. Will attempt to run migrations on existing database."
  fi

  # Run migrations
  if run_migrations; then
    echo ""
    echo "🎉 Database setup completed successfully!"
    echo ""
    echo "The database now includes:"
    echo "  ✓ Migration tracking system"
    echo "  ✓ User authentication (Google & GitHub OAuth)"
    echo "  ✓ University and program management"
    echo "  ✓ Voting system with ratings"
    echo "  ✓ Admin user for development"
    echo "  ✓ Sample data from top universities"
    echo "  ✓ Performance indexes and views"
    echo ""
    echo "Admin user created:"
    echo "  Email: admin@mldegrees.dev"
    echo "  Role: admin"
    echo ""
    echo "You can now start the backend server!"
  else
    echo "✗ Database setup failed"
    exit 1
  fi
}

# Run main function
main

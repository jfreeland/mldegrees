#!/bin/bash

# Database setup script for ML Degrees

echo "Setting up ML Degrees database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is not set"
    echo "Example: export DATABASE_URL='postgres://user:password@localhost/mldegrees'"
    exit 1
fi

# Run all migrations in order
echo "Running migrations..."

# List of migrations to run in order
migrations=(
    "001_complete_schema.sql"
    "002_seed_data.sql"
    "003_add_user_roles.sql"
    "004_add_program_metadata.sql"
    "005_add_github_auth.sql"
    "006_add_program_url.sql"
)

for migration in "${migrations[@]}"; do
    if [ -f "migrations/$migration" ]; then
        echo "Running migration: $migration"
        psql $DATABASE_URL < "migrations/$migration"

        if [ $? -eq 0 ]; then
            echo "✓ $migration completed successfully"
        else
            echo "✗ Failed to run $migration"
            exit 1
        fi
    else
        echo "⚠ Migration file not found: $migration (skipping)"
    fi
done

echo "Database setup complete!"
echo ""
echo "The database now includes:"
echo "- Users table with role support and GitHub authentication"
echo "- Universities and programs with full metadata and URLs"
echo "- Voting system"
echo "- Filtering and sorting indexes"
echo "- Sample data for 5 universities with approved programs including real URLs"

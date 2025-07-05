#!/bin/bash

# GitHub authentication migration script for ML Degrees

echo "Adding GitHub authentication support to existing database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is not set"
    echo "Example: export DATABASE_URL='postgres://user:password@localhost/mldegrees'"
    exit 1
fi

# Run GitHub migration
echo "Running GitHub authentication migration..."
psql $DATABASE_URL < migrations/005_add_github_auth.sql

if [ $? -eq 0 ]; then
    echo "✓ GitHub authentication migration completed successfully"
    echo ""
    echo "Users can now authenticate with both Google and GitHub!"
else
    echo "✗ Failed to run GitHub migration"
    exit 1
fi

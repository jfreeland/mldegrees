#!/bin/bash

# Database setup script for ML Degrees

echo "Setting up ML Degrees database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is not set"
    echo "Example: export DATABASE_URL='postgres://user:password@localhost/mldegrees'"
    exit 1
fi

# Run complete schema migration
echo "Creating database schema..."
psql $DATABASE_URL < migrations/001_complete_schema.sql

if [ $? -eq 0 ]; then
    echo "✓ Schema created successfully"
else
    echo "✗ Failed to create schema"
    exit 1
fi

# Seed data
echo "Seeding data..."
psql $DATABASE_URL < migrations/002_seed_data.sql

if [ $? -eq 0 ]; then
    echo "✓ Data seeded successfully"
else
    echo "✗ Failed to seed data"
    exit 1
fi

echo "Database setup complete!"
echo ""
echo "The database now includes:"
echo "- Users table with role support"
echo "- Universities and programs with full metadata"
echo "- Voting system"
echo "- Filtering and sorting indexes"
echo "- Sample data for 5 universities with approved programs"

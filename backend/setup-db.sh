#!/bin/bash

# Database setup script for ML Degrees

echo "Setting up ML Degrees database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is not set"
    echo "Example: export DATABASE_URL='postgres://user:password@localhost/mldegrees'"
    exit 1
fi

# Run migrations
echo "Running migrations..."
psql $DATABASE_URL < migrations/001_initial_schema.sql

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

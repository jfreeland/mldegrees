-- Create migrations table to track which migrations have been run
-- This must be the first migration to enable tracking

CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(64)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_migrations_filename ON migrations(filename);

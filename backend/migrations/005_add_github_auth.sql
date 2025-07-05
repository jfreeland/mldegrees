-- Add GitHub authentication support
-- Add github_id column to users table

ALTER TABLE users ADD COLUMN IF NOT EXISTS github_id VARCHAR(255) UNIQUE;

-- Update the constraint to allow either google_id or github_id to be null, but not both
ALTER TABLE users ALTER COLUMN google_id DROP NOT NULL;

-- Add a check constraint to ensure at least one OAuth ID is present
ALTER TABLE users ADD CONSTRAINT check_oauth_id CHECK (
    (google_id IS NOT NULL AND google_id != '') OR
    (github_id IS NOT NULL AND github_id != '')
);

-- Create index for github_id lookups
CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);

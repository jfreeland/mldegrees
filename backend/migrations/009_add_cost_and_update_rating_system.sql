-- Add cost field to programs table and update rating system
-- Cost scale: Free, $, $$, $$$
-- Rating scale: 1-5 (1 = low value for money, 5 = high value for money)

-- Add cost field to programs table
ALTER TABLE programs ADD COLUMN cost VARCHAR(10) NOT NULL DEFAULT 'Free'
    CHECK (cost IN ('Free', '$', '$$', '$$$'));

-- Create new ratings table to replace the simple vote system
CREATE TABLE IF NOT EXISTS ratings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, program_id)
);

-- Migrate existing votes to ratings
-- Convert +1 votes to rating of 4, -1 votes to rating of 2
-- This gives us a reasonable starting point for the new rating system
INSERT INTO ratings (user_id, program_id, rating, created_at, updated_at)
SELECT
    user_id,
    program_id,
    CASE
        WHEN vote = 1 THEN 4
        WHEN vote = -1 THEN 2
        ELSE 3
    END as rating,
    created_at,
    updated_at
FROM votes;

-- Keep the votes table for now to avoid breaking existing code
-- We'll remove it in a future migration after updating all references

-- Create indexes for performance optimization
-- These indexes support common query patterns in the application

-- User table indexes
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Program table indexes for filtering and searching
CREATE INDEX IF NOT EXISTS idx_programs_university_id ON programs(university_id);
CREATE INDEX IF NOT EXISTS idx_programs_degree_type ON programs(degree_type);
CREATE INDEX IF NOT EXISTS idx_programs_country ON programs(country);
CREATE INDEX IF NOT EXISTS idx_programs_city ON programs(city);
CREATE INDEX IF NOT EXISTS idx_programs_state ON programs(state);
CREATE INDEX IF NOT EXISTS idx_programs_status ON programs(status);
CREATE INDEX IF NOT EXISTS idx_programs_visibility ON programs(visibility);
CREATE INDEX IF NOT EXISTS idx_programs_created_at ON programs(created_at);

-- Vote table indexes for aggregation queries
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_program_id ON votes(program_id);
CREATE INDEX IF NOT EXISTS idx_votes_vote ON votes(vote);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_programs_status_visibility ON programs(status, visibility);
CREATE INDEX IF NOT EXISTS idx_programs_country_city ON programs(country, city);
CREATE INDEX IF NOT EXISTS idx_votes_program_vote ON votes(program_id, vote);

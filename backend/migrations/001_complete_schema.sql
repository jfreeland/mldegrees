-- Complete ML Degrees Database Schema
-- Consolidated migration including all features

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    google_id VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create universities table
CREATE TABLE IF NOT EXISTS universities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create programs table with all metadata
CREATE TABLE IF NOT EXISTS programs (
    id SERIAL PRIMARY KEY,
    university_id INTEGER REFERENCES universities(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    degree_type VARCHAR(50) NOT NULL DEFAULT 'masters' CHECK (degree_type IN ('bachelors', 'masters', 'certificate')),
    country VARCHAR(100) NOT NULL DEFAULT 'United States',
    city VARCHAR(100) NOT NULL DEFAULT '',
    state VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    visibility VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (visibility IN ('approved', 'pending', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    program_id INTEGER REFERENCES programs(id) ON DELETE CASCADE,
    vote SMALLINT CHECK (vote IN (-1, 1)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, program_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_program_id ON votes(program_id);
CREATE INDEX IF NOT EXISTS idx_programs_university_id ON programs(university_id);
CREATE INDEX IF NOT EXISTS idx_programs_degree_type ON programs(degree_type);
CREATE INDEX IF NOT EXISTS idx_programs_country ON programs(country);
CREATE INDEX IF NOT EXISTS idx_programs_city ON programs(city);
CREATE INDEX IF NOT EXISTS idx_programs_state ON programs(state);
CREATE INDEX IF NOT EXISTS idx_programs_status ON programs(status);
CREATE INDEX IF NOT EXISTS idx_programs_visibility ON programs(visibility);

-- Create view for program ratings
CREATE OR REPLACE VIEW program_ratings AS
SELECT
    p.id,
    p.university_id,
    p.name,
    p.description,
    p.degree_type,
    p.country,
    p.city,
    p.state,
    p.status,
    p.visibility,
    p.created_at,
    p.updated_at,
    u.name as university_name,
    COALESCE(SUM(v.vote), 0) as rating
FROM programs p
JOIN universities u ON p.university_id = u.id
LEFT JOIN votes v ON p.id = v.program_id
GROUP BY p.id, p.university_id, p.name, p.description, p.degree_type, p.country, p.city, p.state, p.status, p.visibility, p.created_at, p.updated_at, u.name;

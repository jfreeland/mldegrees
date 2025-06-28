-- Add metadata fields to programs table
ALTER TABLE programs
ADD COLUMN degree_type VARCHAR(50) NOT NULL DEFAULT 'masters',
ADD COLUMN country VARCHAR(100) NOT NULL DEFAULT 'United States',
ADD COLUMN city VARCHAR(100) NOT NULL DEFAULT '',
ADD COLUMN state VARCHAR(100),
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
ADD COLUMN visibility VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (visibility IN ('approved', 'pending', 'rejected'));

-- Add indexes for filtering
CREATE INDEX idx_programs_degree_type ON programs(degree_type);
CREATE INDEX idx_programs_country ON programs(country);
CREATE INDEX idx_programs_city ON programs(city);
CREATE INDEX idx_programs_state ON programs(state);
CREATE INDEX idx_programs_status ON programs(status);
CREATE INDEX idx_programs_visibility ON programs(visibility);

-- Update the program_ratings view to include new fields
DROP VIEW IF EXISTS program_ratings;
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

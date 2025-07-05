-- Create database views for common queries
-- These views simplify application code and provide consistent data access

-- Program ratings view with all program details and calculated ratings
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
    p.url,
    p.status,
    p.visibility,
    p.created_at,
    p.updated_at,
    u.name as university_name,
    COALESCE(SUM(v.vote), 0) as rating,
    COUNT(v.vote) as vote_count,
    COUNT(CASE WHEN v.vote = 1 THEN 1 END) as upvotes,
    COUNT(CASE WHEN v.vote = -1 THEN 1 END) as downvotes
FROM programs p
JOIN universities u ON p.university_id = u.id
LEFT JOIN votes v ON p.id = v.program_id
GROUP BY p.id, p.university_id, p.name, p.description, p.degree_type,
         p.country, p.city, p.state, p.url, p.status, p.visibility,
         p.created_at, p.updated_at, u.name;

-- User statistics view
CREATE OR REPLACE VIEW user_stats AS
SELECT
    u.id,
    u.email,
    u.name,
    u.role,
    u.created_at,
    COUNT(v.id) as total_votes,
    COUNT(CASE WHEN v.vote = 1 THEN 1 END) as upvotes_given,
    COUNT(CASE WHEN v.vote = -1 THEN 1 END) as downvotes_given
FROM users u
LEFT JOIN votes v ON u.id = v.user_id
GROUP BY u.id, u.email, u.name, u.role, u.created_at;

-- Create initial admin user for development
-- This user can be used for testing admin functionality

INSERT INTO users (email, name, google_id, role) VALUES
    ('admin@mldegrees.dev', 'Admin User', 'local_admin@mldegrees.dev', 'admin')
ON CONFLICT (google_id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = CURRENT_TIMESTAMP;

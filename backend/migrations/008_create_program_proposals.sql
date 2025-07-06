-- Create program_proposals table for tracking proposed changes to existing programs
-- This allows users to suggest modifications to programs and admins to review them

CREATE TABLE IF NOT EXISTS program_proposals (
    id SERIAL PRIMARY KEY,
    program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Proposed changes (NULL means no change proposed for that field)
    proposed_name VARCHAR(255),
    proposed_description TEXT,
    proposed_degree_type VARCHAR(50) CHECK (proposed_degree_type IN ('bachelors', 'masters', 'certificate', 'phd')),
    proposed_country VARCHAR(100),
    proposed_city VARCHAR(100),
    proposed_state VARCHAR(100),
    proposed_url TEXT,

    -- Proposal metadata
    reason TEXT, -- Why the user is proposing this change
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT, -- Admin can add notes when reviewing
    reviewed_by INTEGER REFERENCES users(id), -- Admin who reviewed the proposal
    reviewed_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX idx_program_proposals_program_id ON program_proposals(program_id);
CREATE INDEX idx_program_proposals_user_id ON program_proposals(user_id);
CREATE INDEX idx_program_proposals_status ON program_proposals(status);
CREATE INDEX idx_program_proposals_reviewed_by ON program_proposals(reviewed_by);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_program_proposals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_program_proposals_updated_at
    BEFORE UPDATE ON program_proposals
    FOR EACH ROW
    EXECUTE FUNCTION update_program_proposals_updated_at();

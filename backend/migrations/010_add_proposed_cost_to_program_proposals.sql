-- Add proposed_cost column to program_proposals table
-- This allows users to propose cost changes for existing programs

ALTER TABLE program_proposals
ADD COLUMN proposed_cost VARCHAR(10) CHECK (proposed_cost IN ('Free', '$', '$$', '$$$'));

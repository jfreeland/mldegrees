-- Seed initial university data
-- These are well-known institutions with strong ML/AI programs

INSERT INTO universities (name) VALUES
    ('Stanford University'),
    ('Massachusetts Institute of Technology'),
    ('Carnegie Mellon University'),
    ('University of California, Berkeley'),
    ('University of Toronto'),
    ('Georgia Institute of Technology'),
    ('University of Washington'),
    ('Cornell University'),
    ('University of Illinois at Urbana-Champaign'),
    ('University of California, San Diego')
ON CONFLICT (name) DO NOTHING;

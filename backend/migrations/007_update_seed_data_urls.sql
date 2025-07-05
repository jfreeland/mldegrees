-- Update seed data to include URLs for existing programs
-- This migration ensures that when the database is set up fresh, programs will have URLs

-- Update Stanford University programs
UPDATE programs SET url = 'https://cs.stanford.edu/degrees/mscs/'
WHERE name = 'MS in Computer Science - AI Track'
AND university_id = (SELECT id FROM universities WHERE name = 'Stanford University');

-- Update MIT programs
UPDATE programs SET url = 'https://www.eecs.mit.edu/academics/graduate-programs/masters-of-engineering-program/'
WHERE name = 'Master of Engineering in AI and Decision Making'
AND university_id = (SELECT id FROM universities WHERE name = 'MIT');

-- Update Carnegie Mellon University programs
UPDATE programs SET url = 'https://www.ml.cmu.edu/academics/machine-learning-masters-curriculum.html'
WHERE name = 'Master of Science in Machine Learning'
AND university_id = (SELECT id FROM universities WHERE name = 'Carnegie Mellon University');

-- Update UC Berkeley programs
UPDATE programs SET url = 'https://eecs.berkeley.edu/academics/graduate/research-programs/masters'
WHERE name = 'Master of Engineering in EECS - ML Focus'
AND university_id = (SELECT id FROM universities WHERE name = 'UC Berkeley');

-- Update University of Toronto programs
UPDATE programs SET url = 'https://web.cs.toronto.edu/graduate/mscac'
WHERE name = 'Master of Science in Applied Computing - ML'
AND university_id = (SELECT id FROM universities WHERE name = 'University of Toronto');

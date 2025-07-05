-- Add URL field to programs table
ALTER TABLE programs ADD COLUMN url TEXT;

-- Add real URLs to existing programs
-- Stanford University - MS in Computer Science - AI Track
UPDATE programs SET url = 'https://cs.stanford.edu/degrees/mscs/'
WHERE name = 'MS in Computer Science - AI Track'
AND university_id = (SELECT id FROM universities WHERE name = 'Stanford University');

-- MIT - Master of Engineering in AI and Decision Making
UPDATE programs SET url = 'https://www.eecs.mit.edu/academics/graduate-programs/masters-of-engineering-program/'
WHERE name = 'Master of Engineering in AI and Decision Making'
AND university_id = (SELECT id FROM universities WHERE name = 'MIT');

-- Carnegie Mellon University - Master of Science in Machine Learning
UPDATE programs SET url = 'https://www.ml.cmu.edu/academics/machine-learning-masters-curriculum.html'
WHERE name = 'Master of Science in Machine Learning'
AND university_id = (SELECT id FROM universities WHERE name = 'Carnegie Mellon University');

-- UC Berkeley - Master of Engineering in EECS - ML Focus
UPDATE programs SET url = 'https://eecs.berkeley.edu/academics/graduate/research-programs/masters'
WHERE name = 'Master of Engineering in EECS - ML Focus'
AND university_id = (SELECT id FROM universities WHERE name = 'UC Berkeley');

-- University of Toronto - Master of Science in Applied Computing - ML
UPDATE programs SET url = 'https://web.cs.toronto.edu/graduate/mscac'
WHERE name = 'Master of Science in Applied Computing - ML'
AND university_id = (SELECT id FROM universities WHERE name = 'University of Toronto');

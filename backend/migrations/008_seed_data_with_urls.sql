-- Enhanced seed data with URLs included
-- This migration provides a complete setup for fresh databases

-- Clear existing data if any (for fresh setups)
-- Note: This should only be run on fresh databases
DELETE FROM votes WHERE id > 0;
DELETE FROM programs WHERE id > 0;
DELETE FROM universities WHERE id > 0;

-- Reset sequences
ALTER SEQUENCE universities_id_seq RESTART WITH 1;
ALTER SEQUENCE programs_id_seq RESTART WITH 1;
ALTER SEQUENCE votes_id_seq RESTART WITH 1;

-- Insert universities
INSERT INTO universities (name) VALUES
    ('Stanford University'),
    ('MIT'),
    ('Carnegie Mellon University'),
    ('UC Berkeley'),
    ('University of Toronto');

-- Insert programs with URLs
INSERT INTO programs (university_id, name, description, degree_type, country, city, state, url, status, visibility) VALUES
    (1, 'MS in Computer Science - AI Track',
     'Stanford''s AI track focuses on deep learning, computer vision, and natural language processing. Students work closely with faculty at the Stanford AI Lab and have access to cutting-edge research in machine learning, robotics, and human-centered AI systems.',
     'masters', 'United States', 'Stanford', 'CA',
     'https://cs.stanford.edu/degrees/mscs/',
     'active', 'approved'),

    (2, 'Master of Engineering in AI and Decision Making',
     'MIT''s program combines machine learning with decision science, preparing students to build AI systems that can make complex decisions. The curriculum emphasizes both theoretical foundations and practical applications in areas like autonomous systems and healthcare.',
     'masters', 'United States', 'Cambridge', 'MA',
     'https://www.eecs.mit.edu/academics/graduate-programs/masters-of-engineering-program/',
     'active', 'approved'),

    (3, 'Master of Science in Machine Learning',
     'CMU''s ML program is one of the first of its kind, offering rigorous training in statistical machine learning, deep learning, and AI systems. Students benefit from CMU''s strong industry connections and can specialize in areas like computer vision or language technologies.',
     'masters', 'United States', 'Pittsburgh', 'PA',
     'https://www.ml.cmu.edu/academics/machine-learning-masters-curriculum.html',
     'active', 'approved'),

    (4, 'Master of Engineering in EECS - ML Focus',
     'Berkeley''s program emphasizes the intersection of machine learning with systems and theory. Students learn to build scalable ML systems and work on projects ranging from reinforcement learning to fairness in AI, with strong connections to Silicon Valley.',
     'masters', 'United States', 'Berkeley', 'CA',
     'https://eecs.berkeley.edu/academics/graduate/research-programs/masters',
     'active', 'approved'),

    (5, 'Master of Science in Applied Computing - ML',
     'Home to pioneers like Geoffrey Hinton, Toronto''s program offers world-class training in deep learning and neural networks. The Vector Institute provides additional resources and industry partnerships for students interested in advancing AI research.',
     'masters', 'Canada', 'Toronto', 'ON',
     'https://web.cs.toronto.edu/graduate/mscac',
     'active', 'approved');

-- Add some additional high-quality programs with URLs
INSERT INTO programs (university_id, name, description, degree_type, country, city, state, url, status, visibility) VALUES
    (1, 'MS in Artificial Intelligence',
     'Stanford''s dedicated AI program offers specialized tracks in computer vision, natural language processing, and robotics. Students engage with cutting-edge research and have access to industry partnerships in Silicon Valley.',
     'masters', 'United States', 'Stanford', 'CA',
     'https://ai.stanford.edu/degrees/',
     'active', 'approved'),

    (2, 'Master of Science in EECS - AI Track',
     'MIT''s EECS program with AI specialization combines theoretical foundations with practical applications. Students work on projects ranging from autonomous systems to computational biology.',
     'masters', 'United States', 'Cambridge', 'MA',
     'https://www.eecs.mit.edu/academics/graduate-programs/masters-of-science-program/',
     'active', 'approved'),

    (3, 'Master of Science in Computer Science - ML Track',
     'CMU''s CS program offers a machine learning track that complements the dedicated ML program. Students can focus on systems, theory, or applications of machine learning.',
     'masters', 'United States', 'Pittsburgh', 'PA',
     'https://csd.cmu.edu/academics/masters/overview',
     'active', 'approved');

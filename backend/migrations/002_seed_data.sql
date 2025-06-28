-- Seed data for universities and programs
INSERT INTO universities (name) VALUES
    ('Stanford University'),
    ('MIT'),
    ('Carnegie Mellon University'),
    ('UC Berkeley'),
    ('University of Toronto');

-- Get university IDs (assuming they're inserted in order)
INSERT INTO programs (university_id, name, description, degree_type, country, city, state, status, visibility) VALUES
    (1, 'MS in Computer Science - AI Track', 'Stanford''s AI track focuses on deep learning, computer vision, and natural language processing. Students work closely with faculty at the Stanford AI Lab and have access to cutting-edge research in machine learning, robotics, and human-centered AI systems.', 'masters', 'United States', 'Stanford', 'CA', 'active', 'approved'),
    (2, 'Master of Engineering in AI and Decision Making', 'MIT''s program combines machine learning with decision science, preparing students to build AI systems that can make complex decisions. The curriculum emphasizes both theoretical foundations and practical applications in areas like autonomous systems and healthcare.', 'masters', 'United States', 'Cambridge', 'MA', 'active', 'approved'),
    (3, 'Master of Science in Machine Learning', 'CMU''s ML program is one of the first of its kind, offering rigorous training in statistical machine learning, deep learning, and AI systems. Students benefit from CMU''s strong industry connections and can specialize in areas like computer vision or language technologies.', 'masters', 'United States', 'Pittsburgh', 'PA', 'active', 'approved'),
    (4, 'Master of Engineering in EECS - ML Focus', 'Berkeley''s program emphasizes the intersection of machine learning with systems and theory. Students learn to build scalable ML systems and work on projects ranging from reinforcement learning to fairness in AI, with strong connections to Silicon Valley.', 'masters', 'United States', 'Berkeley', 'CA', 'active', 'approved'),
    (5, 'Master of Science in Applied Computing - ML', 'Home to pioneers like Geoffrey Hinton, Toronto''s program offers world-class training in deep learning and neural networks. The Vector Institute provides additional resources and industry partnerships for students interested in advancing AI research.', 'masters', 'Canada', 'Toronto', 'ON', 'active', 'approved');

-- Add some sample votes (these would normally come from real users)
-- Note: In production, these would be added through the API after users authenticate

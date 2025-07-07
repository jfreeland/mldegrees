import { University } from "@/types/university";

export const mockUniversities: University[] = [
  {
    id: "1",
    name: "Stanford University",
    programName: "MS in Computer Science - AI Track",
    description: "Stanford's AI track focuses on deep learning, computer vision, and natural language processing. Students work closely with faculty at the Stanford AI Lab and have access to cutting-edge research in machine learning, robotics, and human-centered AI systems.",
    degreeType: "masters",
    country: "United States",
    city: "Stanford",
    state: "CA",
    cost: "$$$",
    status: "active",
    visibility: "approved",
    average_rating: 4.2,
    userVote: null
  },
  {
    id: "2",
    name: "MIT",
    programName: "Master of Engineering in AI and Decision Making",
    description: "MIT's program combines machine learning with decision science, preparing students to build AI systems that can make complex decisions. The curriculum emphasizes both theoretical foundations and practical applications in areas like autonomous systems and healthcare.",
    degreeType: "masters",
    country: "United States",
    city: "Cambridge",
    state: "MA",
    cost: "$$$",
    status: "active",
    visibility: "approved",
    average_rating: 4.5,
    userVote: 1
  },
  {
    id: "3",
    name: "Carnegie Mellon University",
    programName: "Master of Science in Machine Learning",
    description: "CMU's ML program is one of the first of its kind, offering rigorous training in statistical machine learning, deep learning, and AI systems. Students benefit from CMU's strong industry connections and can specialize in areas like computer vision or language technologies.",
    degreeType: "masters",
    country: "United States",
    city: "Pittsburgh",
    state: "PA",
    cost: "$$$",
    status: "active",
    visibility: "approved",
    average_rating: 4.1,
    userVote: null
  },
  {
    id: "4",
    name: "UC Berkeley",
    programName: "Master of Engineering in EECS - ML Focus",
    description: "Berkeley's program emphasizes the intersection of machine learning with systems and theory. Students learn to build scalable ML systems and work on projects ranging from reinforcement learning to fairness in AI, with strong connections to Silicon Valley.",
    degreeType: "masters",
    country: "United States",
    city: "Berkeley",
    state: "CA",
    cost: "$$",
    status: "active",
    visibility: "approved",
    average_rating: 3.8,
    userVote: -1
  },
  {
    id: "5",
    name: "University of Toronto",
    programName: "Master of Science in Applied Computing - ML",
    description: "Home to pioneers like Geoffrey Hinton, Toronto's program offers world-class training in deep learning and neural networks. The Vector Institute provides additional resources and industry partnerships for students interested in advancing AI research.",
    degreeType: "masters",
    country: "Canada",
    city: "Toronto",
    state: "ON",
    cost: "$$",
    status: "active",
    visibility: "approved",
    average_rating: 4.0,
    userVote: null
  }
];

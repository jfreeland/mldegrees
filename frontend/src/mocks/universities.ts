import { University } from "@/types/university";

export const mockUniversities: University[] = [
  {
    id: "1",
    name: "Stanford University",
    programName: "MS in Computer Science - AI Track",
    description: "Stanford's AI track focuses on deep learning, computer vision, and natural language processing. Students work closely with faculty at the Stanford AI Lab and have access to cutting-edge research in machine learning, robotics, and human-centered AI systems.",
    rating: 42,
    userVote: null
  },
  {
    id: "2",
    name: "MIT",
    programName: "Master of Engineering in AI and Decision Making",
    description: "MIT's program combines machine learning with decision science, preparing students to build AI systems that can make complex decisions. The curriculum emphasizes both theoretical foundations and practical applications in areas like autonomous systems and healthcare.",
    rating: 38,
    userVote: 1
  },
  {
    id: "3",
    name: "Carnegie Mellon University",
    programName: "Master of Science in Machine Learning",
    description: "CMU's ML program is one of the first of its kind, offering rigorous training in statistical machine learning, deep learning, and AI systems. Students benefit from CMU's strong industry connections and can specialize in areas like computer vision or language technologies.",
    rating: 35,
    userVote: null
  },
  {
    id: "4",
    name: "UC Berkeley",
    programName: "Master of Engineering in EECS - ML Focus",
    description: "Berkeley's program emphasizes the intersection of machine learning with systems and theory. Students learn to build scalable ML systems and work on projects ranging from reinforcement learning to fairness in AI, with strong connections to Silicon Valley.",
    rating: 28,
    userVote: -1
  },
  {
    id: "5",
    name: "University of Toronto",
    programName: "Master of Science in Applied Computing - ML",
    description: "Home to pioneers like Geoffrey Hinton, Toronto's program offers world-class training in deep learning and neural networks. The Vector Institute provides additional resources and industry partnerships for students interested in advancing AI research.",
    rating: 25,
    userVote: null
  }
];
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "AI & ML Degree Guide",
  description: "Complete guide to understanding AI vs ML degrees, degree types (Bachelor's, Master's, PhD), program types, and how to choose the right machine learning program for your career goals.",
  keywords: ["AI degree guide", "ML degree guide", "machine learning education", "artificial intelligence programs", "computer science degrees", "data science programs"],
  openGraph: {
    title: "Complete Guide to AI & ML Degrees - Choose the Right Program",
    description: "Understand the differences between AI and ML degrees, explore degree types, and learn how to choose the perfect machine learning program for your career.",
    url: "https://mldegrees.com/guide",
  },
  twitter: {
    title: "Complete Guide to AI & ML Degrees - Choose the Right Program",
    description: "Understand the differences between AI and ML degrees, explore degree types, and learn how to choose the perfect machine learning program for your career.",
  },
  alternates: {
    canonical: "https://mldegrees.com/guide",
  },
}

export default function GuidePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Understanding AI & ML Degrees
      </h1>

      <div className="space-y-12">
        {/* AI vs ML Section */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Artificial Intelligence vs Machine Learning
          </h2>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-blue-600 dark:text-blue-400 mb-3">
                  Artificial Intelligence (AI)
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  AI is the broader field focused on creating systems that can perform tasks that typically require human intelligence.
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Natural language processing</li>
                  <li>• Computer vision</li>
                  <li>• Robotics</li>
                  <li>• Expert systems</li>
                  <li>• Planning and reasoning</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-green-600 dark:text-green-400 mb-3">
                  Machine Learning (ML)
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  ML is a subset of AI that focuses on algorithms that can learn and improve from data without being explicitly programmed.
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Supervised learning</li>
                  <li>• Unsupervised learning</li>
                  <li>• Deep learning</li>
                  <li>• Neural networks</li>
                  <li>• Statistical modeling</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Degree Types Section */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Degree Types Explained
          </h2>
          <div className="space-y-6">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">
                Bachelor&apos;s Degree (BS/BA)
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Undergraduate degree typically taking 4 years to complete. Provides foundational knowledge in computer science, mathematics, and introductory AI/ML concepts.
              </p>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Best for:</strong> Entry-level positions, career changers, building fundamental skills
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">
                Master&apos;s Degree (MS/MEng/MCS)
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Graduate degree typically taking 1-2 years. Offers specialized coursework in AI/ML with options for thesis research or professional focus.
              </p>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Best for:</strong> Career advancement, specialization, research preparation, mid-career professionals
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">
                Doctoral Degree (PhD)
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Advanced research degree typically taking 4-6 years. Focuses on original research, dissertation, and preparing for academic or senior research roles.
              </p>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Best for:</strong> Academic careers, research leadership, cutting-edge industry research positions
              </div>
            </div>
          </div>
        </section>

        {/* Program Types Section */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Types of AI/ML Programs
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Computer Science with AI/ML Focus
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Traditional CS degree with specialized tracks in artificial intelligence and machine learning.
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">
                  Data Science
                </h3>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Interdisciplinary field combining statistics, programming, and domain expertise to extract insights from data.
                </p>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <h3 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                  Artificial Intelligence
                </h3>
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  Dedicated AI programs covering broad aspects of intelligent systems, from robotics to natural language processing.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <h3 className="font-medium text-orange-900 dark:text-orange-100 mb-2">
                  Machine Learning Engineering
                </h3>
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  Focus on building and deploying ML systems in production environments, emphasizing software engineering skills.
                </p>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h3 className="font-medium text-red-900 dark:text-red-100 mb-2">
                  Computational Mathematics/Statistics
                </h3>
                <p className="text-sm text-red-800 dark:text-red-200">
                  Mathematical foundation for ML with emphasis on statistical theory and computational methods.
                </p>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                <h3 className="font-medium text-indigo-900 dark:text-indigo-100 mb-2">
                  Interdisciplinary Programs
                </h3>
                <p className="text-sm text-indigo-800 dark:text-indigo-200">
                  Programs combining AI/ML with specific domains like healthcare, finance, or cognitive science.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Choosing a Program Section */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Choosing the Right Program
          </h2>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <h3 className="text-lg font-medium text-yellow-900 dark:text-yellow-100 mb-3">
              Consider These Factors:
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-yellow-800 dark:text-yellow-200">
              <ul className="space-y-2">
                <li>• <strong>Career Goals:</strong> Research vs. industry application</li>
                <li>• <strong>Background:</strong> Your current education and experience</li>
                <li>• <strong>Time Commitment:</strong> Full-time vs. part-time options</li>
                <li>• <strong>Learning Style:</strong> Theoretical vs. hands-on approach</li>
              </ul>
              <ul className="space-y-2">
                <li>• <strong>Specialization:</strong> Broad AI vs. specific ML focus</li>
                <li>• <strong>Industry Connections:</strong> Internships and job placement</li>
                <li>• <strong>Research Opportunities:</strong> Faculty expertise and projects</li>
                <li>• <strong>Location & Format:</strong> On-campus vs. online options</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

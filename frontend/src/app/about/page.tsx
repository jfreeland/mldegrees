import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "About ML Degrees",
  description: "Learn about ML Degrees platform, our mission to help students find the best machine learning programs, privacy policy, and how to use our comprehensive program database.",
  openGraph: {
    title: "About ML Degrees - Comprehensive ML Program Directory",
    description: "Learn about our mission to help students find the best machine learning programs from universities worldwide.",
    url: "https://mldegrees.com/about",
  },
  twitter: {
    title: "About ML Degrees - Comprehensive ML Program Directory",
    description: "Learn about our mission to help students find the best machine learning programs from universities worldwide.",
  },
  alternates: {
    canonical: "https://mldegrees.com/about",
  },
}

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        About Machine Learning Degrees
      </h1>

      <div className="prose prose-lg dark:prose-invert max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Our Mission
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Machine Learning Degrees is a comprehensive directory of machine learning
            and AI degree programs from universities worldwide. We help prospective
            students discover and compare programs to find the right educational path
            for their career in artificial intelligence.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            What We Offer
          </h2>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
            <li>
              <strong>Program Directory:</strong> Browse machine learning degrees from
              universities around the world.
            </li>
            <li>
              <strong>Cost Information:</strong> Understand the investment required for
              different programs.
            </li>
            <li>
              <strong>Degree Types:</strong> Find Bachelor&apos;s, Master&apos;s, and
              Certificate programs.
            </li>
            <li>
              <strong>Location Data:</strong> Discover programs by country, state, or city.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Ideas & Feedback
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Have an idea for how to make this site more useful? Know of a program we
            should add? Let us know at{' '}
            <a href="mailto:contact@mldegrees.com" className="text-blue-600 dark:text-blue-400 hover:underline">
              contact@mldegrees.com
            </a>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Privacy Policy
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            We take your privacy seriously:
          </p>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
            <li>
              <strong>No Account Required:</strong> Browse all programs without signing up.
            </li>
            <li>
              <strong>Minimal Tracking:</strong> We use basic analytics to improve the site.
            </li>
            <li>
              <strong>No Data Selling:</strong> We do not sell or share your information.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Contact
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Questions or suggestions? Contact us at{' '}
            <a href="mailto:contact@mldegrees.com" className="text-blue-600 dark:text-blue-400 hover:underline">
              contact@mldegrees.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}

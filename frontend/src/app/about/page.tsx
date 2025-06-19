export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        About ML Degrees
      </h1>

      <div className="prose prose-lg dark:prose-invert max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Our Mission
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            ML Degrees helps prospective students find the best Machine Learning and AI graduate programs
            by providing community-driven ratings and insights. Our platform allows users to vote on
            programs they have experience with, helping others make informed decisions about their education.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Privacy Policy
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            We take your privacy seriously. Here&apos;s what you need to know:
          </p>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
            <li>
              <strong>Minimal Data Collection:</strong> We only collect your email address and name from
              Google when you sign in. We do not store or access any other personal information.
            </li>
            <li>
              <strong>No Data Sharing:</strong> We do not sell, trade, or share your personal information
              with third parties.
            </li>
            <li>
              <strong>Voting Privacy:</strong> Your individual votes are private. We only display
              aggregate ratings for each program.
            </li>
            <li>
              <strong>Data Usage:</strong> Your email is used solely for authentication purposes and
              to prevent duplicate voting.
            </li>
            <li>
              <strong>Data Deletion:</strong> You can request deletion of your account and all associated
              data at any time by contacting us.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            How It Works
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Sign in with your Google account to vote on ML degree programs. Each user can vote once
            per program, either upvoting (+1) or downvoting (-1) based on their experience or knowledge
            of the program. The aggregate score helps other users identify highly-regarded programs.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Contact
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            If you have any questions about our privacy practices or would like to request data deletion,
            please contact us at privacy@mldegrees.com
          </p>
        </section>
      </div>
    </div>
  );
}

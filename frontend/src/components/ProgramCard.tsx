import { Program } from "@/types/program";

interface ProgramCardProps {
  program: Program;
}

export default function ProgramCard({ program }: ProgramCardProps) {
  const getCostDisplay = (cost: string) => {
    switch (cost) {
      case 'Free': return 'Free';
      case '$': return 'Low Cost';
      case '$$': return 'Medium Cost';
      case '$$$': return 'High Cost';
      default: return cost;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex-1">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
          {program.universityName}
        </h2>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg text-gray-700 dark:text-gray-300">
            {program.name}
          </h3>
          {program.url && (
            <a
              href={program.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              aria-label="Visit program page"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {program.degreeType}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            {program.city}, {program.state ? `${program.state}, ` : ''}{program.country}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            {getCostDisplay(program.cost)}
          </span>
        </div>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          {program.description}
        </p>
      </div>
    </div>
  );
}

import { Program } from "@/types/program";
import { programPath } from "@/lib/slugify";
import Link from "next/link";

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

  const getCostColor = (cost: string) => {
    switch (cost) {
      case 'Free': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case '$': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case '$$': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case '$$$': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <Link
      href={programPath(program.universityName, program.name)}
      className="block group"
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 h-full flex flex-col">
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
            {program.universityName}
          </p>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
            {program.name}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 leading-relaxed">
            {program.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
            {program.degreeType}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
            {program.city}{program.state ? `, ${program.state}` : ''}, {program.country}
          </span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCostColor(program.cost)}`}>
            {getCostDisplay(program.cost)}
          </span>
        </div>
      </div>
    </Link>
  );
}

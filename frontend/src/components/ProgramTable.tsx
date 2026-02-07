import { Program } from "@/types/program";
import { programPath } from "@/lib/slugify";
import Link from "next/link";

interface ProgramTableProps {
  programs: Program[];
}

function getCostDisplay(cost: string) {
  switch (cost) {
    case 'Free': return 'Free';
    case '$': return 'Low Cost';
    case '$$': return 'Medium';
    case '$$$': return 'High';
    default: return cost;
  }
}

function getCostColor(cost: string) {
  switch (cost) {
    case 'Free': return 'text-green-700 dark:text-green-400';
    case '$': return 'text-blue-700 dark:text-blue-400';
    case '$$': return 'text-yellow-700 dark:text-yellow-400';
    case '$$$': return 'text-red-700 dark:text-red-400';
    default: return 'text-gray-700 dark:text-gray-400';
  }
}

export default function ProgramTable({ programs }: ProgramTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800 text-left text-gray-500 dark:text-gray-400">
            <th className="px-4 py-3 font-medium">Program</th>
            <th className="px-4 py-3 font-medium hidden sm:table-cell">University</th>
            <th className="px-4 py-3 font-medium hidden md:table-cell">Location</th>
            <th className="px-4 py-3 font-medium">Cost</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {programs.map((program) => (
            <tr key={program.id} className="bg-white dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-gray-700/50 transition-colors">
              <td className="px-4 py-3">
                <Link
                  href={programPath(program.universityName, program.name)}
                  className="text-gray-900 dark:text-white font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {program.name}
                </Link>
                <span className="sm:hidden block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {program.universityName}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                {program.universityName}
              </td>
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell whitespace-nowrap">
                {program.city}{program.state ? `, ${program.state}` : ''}, {program.country}
              </td>
              <td className={`px-4 py-3 font-medium whitespace-nowrap ${getCostColor(program.cost)}`}>
                {getCostDisplay(program.cost)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

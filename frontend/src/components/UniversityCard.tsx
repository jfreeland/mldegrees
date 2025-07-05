"use client";

import { useState } from "react";
import { University } from "@/types/university";

interface UniversityCardProps {
  university: University;
  onVote: (universityId: string, vote: 1 | -1) => void;
}

export default function UniversityCard({
  university,
  onVote,
}: UniversityCardProps) {
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (vote: 1 | -1) => {
    if (isVoting) return;
    setIsVoting(true);
    try {
      onVote(university.id, vote);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex gap-4">
      <div className="flex flex-col items-center justify-start space-y-2">
        <button
          onClick={() => handleVote(1)}
          disabled={isVoting}
          className={`p-2 rounded-md transition-colors ${
            university.userVote === 1
              ? "bg-green-500 text-white"
              : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label="Upvote"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
        </button>

        <span className="text-lg font-semibold text-gray-900 dark:text-white">
          {university.rating}
        </span>

        <button
          onClick={() => handleVote(-1)}
          disabled={isVoting}
          className={`p-2 rounded-md transition-colors ${
            university.userVote === -1
              ? "bg-red-500 text-white"
              : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label="Downvote"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      <div className="flex-1">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
          {university.name}
        </h2>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg text-gray-700 dark:text-gray-300">
            {university.programName}
          </h3>
          {university.url && (
            <a
              href={university.url}
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
            {university.degreeType}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            {university.city}, {university.state ? `${university.state}, ` : ''}{university.country}
          </span>
        </div>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          {university.description}
        </p>
      </div>
    </div>
  );
}

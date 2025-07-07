"use client";

import { useState } from "react";
import { University } from "@/types/university";

interface UniversityCardProps {
  university: University;
  onVote: (universityId: string, vote: 1 | -1) => void; // Keep for backward compatibility
  onRate?: (universityId: string, rating: number) => void;
  onProposeChanges?: (university: University) => void;
}

export default function UniversityCard({
  university,
  onVote,
  onRate,
  onProposeChanges,
}: UniversityCardProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [isRating, setIsRating] = useState(false);

  const handleVote = async (vote: 1 | -1) => {
    if (isVoting) return;
    setIsVoting(true);
    try {
      onVote(university.id, vote);
    } finally {
      setIsVoting(false);
    }
  };

  const handleRate = async (rating: number) => {
    if (isRating || !onRate) return;
    setIsRating(true);
    try {
      onRate(university.id, rating);
    } finally {
      setIsRating(false);
    }
  };

  const getCostDisplay = (cost: string) => {
    switch (cost) {
      case 'Free': return '🆓 Free';
      case '$': return '💰 $';
      case '$$': return '💰💰 $$';
      case '$$$': return '💰💰💰 $$$';
      default: return cost;
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          onClick={() => handleRate(i)}
          disabled={isRating}
          className={`text-2xl transition-colors disabled:cursor-not-allowed ${
            university.user_rating && i <= university.user_rating
              ? 'text-yellow-400'
              : 'text-gray-300 hover:text-yellow-400'
          }`}
        >
          ★
        </button>
      );
    }
    return stars;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex gap-4">
      <div className="flex flex-col items-center justify-start space-y-3">
        <div className="text-center">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Value Rating
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {university.average_rating ? university.average_rating.toFixed(1) : 'N/A'}
          </div>
          <div className="text-xs text-gray-400">
            out of 5
          </div>
        </div>

        {onRate && (
          <div className="flex flex-col items-center space-y-1">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Rate this program:
            </div>
            <div className="flex space-x-1">
              {renderStars()}
            </div>
          </div>
        )}
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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            {getCostDisplay(university.cost)}
          </span>
        </div>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
          {university.description}
        </p>

        {onProposeChanges && (
          <div className="flex justify-end">
            <button
              onClick={() => onProposeChanges(university)}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Propose Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

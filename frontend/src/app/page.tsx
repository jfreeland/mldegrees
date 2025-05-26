"use client";

import { useState, useEffect } from "react";
import UniversityCard from "@/components/UniversityCard";
import { University } from "@/types/university";
import { mockUniversities } from "@/mocks/universities";

export default function Home() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    try {
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      setUniversities(mockUniversities);
      setLoading(false);
    } catch (err) {
      setError("Failed to load universities");
      setLoading(false);
    }
  };

  const handleVote = async (universityId: string, vote: 1 | -1) => {
    // Optimistically update the UI
    setUniversities(prevUniversities =>
      prevUniversities.map(uni => {
        if (uni.id === universityId) {
          const currentVote = uni.userVote;
          let ratingChange = 0;
          let newUserVote: 1 | -1 | null;
          
          if (currentVote === vote) {
            // User is removing their vote
            ratingChange = -vote;
            newUserVote = null;
          } else if (currentVote === null) {
            // User is voting for the first time
            ratingChange = vote;
            newUserVote = vote;
          } else {
            // User is changing their vote (from -1 to +1 or vice versa)
            ratingChange = vote - (currentVote || 0);
            newUserVote = vote;
          }
          
          return { ...uni, userVote: newUserVote, rating: uni.rating + ratingChange };
        }
        return uni;
      })
    );

    // In a real app, you would make an API call here
    try {
      // const response = await fetch(`/api/universities/${universityId}/vote`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ vote })
      // });
      // if (!response.ok) throw new Error('Vote failed');
    } catch (err) {
      // Revert on error
      fetchUniversities();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-gray-600 dark:text-gray-400">Loading universities...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-red-600 dark:text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Machine Learning Graduate Programs
      </h1>
      <div className="space-y-6">
        {universities.map(university => (
          <UniversityCard
            key={university.id}
            university={university}
            onVote={handleVote}
          />
        ))}
      </div>
    </div>
  );
}
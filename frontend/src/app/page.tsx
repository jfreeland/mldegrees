"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import UniversityCard from "@/components/UniversityCard";
import { University } from "@/types/university";

export default function Home() {
  const { data: session } = useSession();
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUniversities = useCallback(async () => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add auth header if user is signed in
      if (session?.user && (session.user as any).googleId) {
        headers['Authorization'] = `Bearer ${(session.user as any).googleId}`;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/programs`, {
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch programs');
      }

      const data = await response.json();

      // Transform backend data to match frontend University type
      const transformedData: University[] = data.map((program: any) => ({
        id: program.id.toString(),
        name: program.university_name,
        programName: program.name,
        description: program.description,
        rating: program.rating,
        userVote: program.user_vote || null,
      }));

      setUniversities(transformedData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching universities:', err);
      setError("Failed to load universities");
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchUniversities();
  }, [fetchUniversities]);

  const handleVote = async (universityId: string, vote: 1 | -1) => {
    if (!session) {
      alert("Please sign in to vote");
      return;
    }

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
            ratingChange = vote * 2; // Need to account for removing old vote and adding new
            newUserVote = vote;
          }

          return { ...uni, userVote: newUserVote, rating: (uni.rating || 0) + ratingChange };
        }
        return uni;
      })
    );

    try {
      const currentUni = universities.find(u => u.id === universityId);
      const actualVote = currentUni?.userVote === vote ? 0 : vote; // 0 means remove vote

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(session.user as any).googleId}`,
        },
        body: JSON.stringify({
          program_id: parseInt(universityId),
          vote: actualVote
        })
      });

      if (!response.ok) {
        throw new Error('Vote failed');
      }
    } catch (err) {
      console.error('Vote error:', err);
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
      {!session && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <p className="text-blue-800 dark:text-blue-200">
            Sign in with Google to vote on programs and help others find the best ML degrees!
          </p>
        </div>
      )}
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

"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import UniversityCard from "@/components/UniversityCard";
import { University } from "@/types/university";

interface Filters {
  degreeType: string;
  country: string;
  city: string;
  state: string;
  sortBy: string;
  sortOrder: string;
}

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    degreeType: '',
    country: '',
    city: '',
    state: '',
    sortBy: 'rating',
    sortOrder: 'desc'
  });

  // Extract unique location options from universities data
  const locationOptions = {
    countries: [...new Set(universities.map(u => u.country).filter(Boolean))].sort(),
    cities: [...new Set(universities.map(u => u.city).filter(Boolean))].sort(),
    states: [...new Set(universities.map(u => u.state).filter(Boolean))].sort()
  };

  const fetchUniversities = useCallback(async () => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add auth header if user is signed in
      if (session?.user && (session.user as any).googleId) {
        headers['Authorization'] = `Bearer ${(session.user as any).googleId}`;
      }

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filters.degreeType) queryParams.append('degree_type', filters.degreeType);
      if (filters.country) queryParams.append('country', filters.country);
      if (filters.city) queryParams.append('city', filters.city);
      if (filters.state) queryParams.append('state', filters.state);
      if (filters.sortBy) queryParams.append('sort_by', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sort_order', filters.sortOrder);

      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/programs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url, {
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch programs');
      }

      const data = await response.json();

      // Ensure data is an array before transforming
      const programsArray = Array.isArray(data) ? data : [];

      // Transform backend data to match frontend University type
      const transformedData: University[] = programsArray.map((program: any) => ({
        id: program.id.toString(),
        name: program.university_name,
        programName: program.name,
        description: program.description,
        degreeType: program.degree_type,
        country: program.country,
        city: program.city,
        state: program.state,
        status: program.status,
        visibility: program.visibility,
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
  }, [session, filters]);

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
      {!session && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <p className="text-blue-800 dark:text-blue-200">
            Sign in with Google to vote on programs and help others find the best ML degrees!
          </p>
        </div>
      )}

      {/* Navigation Actions */}
      <div className="flex flex-wrap gap-4 mb-6">
        {session && (
          <button
            onClick={() => router.push('/propose')}
            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Propose New Program
          </button>
        )}
        {session && (session.user as any)?.role === 'admin' && (
          <button
            onClick={() => router.push('/admin')}
            className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Admin Dashboard
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filter & Sort</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Degree Type
            </label>
            <select
              value={filters.degreeType}
              onChange={(e) => setFilters(prev => ({ ...prev, degreeType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Types</option>
              <option value="bachelors">Bachelor&apos;s</option>
              <option value="masters">Master&apos;s</option>
              <option value="certificate">Certificate</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Country
            </label>
            <select
              value={filters.country}
              onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Countries</option>
              {locationOptions.countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              City
            </label>
            <select
              value={filters.city}
              onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Cities</option>
              {locationOptions.cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              State
            </label>
            <select
              value={filters.state}
              onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All States</option>
              {locationOptions.states.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="rating">Rating</option>
              <option value="name">Name</option>
              <option value="created_at">Date Added</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Order
            </label>
            <select
              value={filters.sortOrder}
              onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={() => setFilters({
              degreeType: '',
              country: '',
              city: '',
              state: '',
              sortBy: 'rating',
              sortOrder: 'desc'
            })}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

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

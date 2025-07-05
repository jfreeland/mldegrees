'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { University } from '@/types/university';

interface AdminProgramAction {
  program_id: number;
  action: 'approve' | 'reject';
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pendingPrograms, setPendingPrograms] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchPendingPrograms = useCallback(async () => {
    if (!session?.user) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/admin/programs`, {
        headers: {
          'Authorization': `Bearer ${(session.user as any).googleId}`,
        },
      });

      if (response.ok) {
        const programs = await response.json();
        setPendingPrograms(programs);
      } else if (response.status === 403) {
        setMessage({ type: 'error', text: 'Access denied. Admin privileges required.' });
      } else {
        setMessage({ type: 'error', text: 'Failed to fetch pending programs.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while fetching programs.' });
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      router.push('/');
      return;
    }

    // Check if user is admin (this should be handled by the backend, but we can add client-side check too)
    fetchPendingPrograms();
  }, [session, status, router, fetchPendingPrograms]);

  const handleProgramAction = async (programId: number, action: 'approve' | 'reject') => {
    if (!session?.user) return;

    setActionLoading(programId);
    setMessage(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/admin/programs/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(session.user as any).googleId}`,
        },
        body: JSON.stringify({
          program_id: programId,
          action: action,
        } as AdminProgramAction),
      });

      if (response.ok) {
        const result = await response.json();
        setMessage({ type: 'success', text: result.message });
        // Remove the program from the pending list
        setPendingPrograms(prev => prev.filter(p => parseInt(p.id) !== programId));
      } else {
        const error = await response.text();
        setMessage({ type: 'error', text: error || `Failed to ${action} program.` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `An error occurred while ${action}ing the program.` });
    } finally {
      setActionLoading(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You must be logged in as an administrator to access this page.
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Review and manage pending program proposals
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {!pendingPrograms || pendingPrograms.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 text-center">
            <div className="text-gray-500 dark:text-gray-400 text-lg">
              No pending programs to review
            </div>
            <p className="text-gray-400 dark:text-gray-500 mt-2">
              All program proposals have been processed.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingPrograms.map((program) => (
              <div key={program.id} className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {program.programName}
                    </h2>
                    <p className="text-lg text-gray-700 dark:text-gray-300 mt-1">
                      {program.name}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {program.degreeType}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      Pending Review
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {program.description}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {program.city}{program.state && `, ${program.state}`}, {program.country}
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleProgramAction(parseInt(program.id), 'reject')}
                      disabled={actionLoading === parseInt(program.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors"
                    >
                      {actionLoading === parseInt(program.id) ? 'Processing...' : 'Reject'}
                    </button>
                    <button
                      onClick={() => handleProgramAction(parseInt(program.id), 'approve')}
                      disabled={actionLoading === parseInt(program.id)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors"
                    >
                      {actionLoading === parseInt(program.id) ? 'Processing...' : 'Approve'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

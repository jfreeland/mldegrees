'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { University, ProgramProposal } from '@/types/university';
import ProgramEditForm from '@/components/ProgramEditForm';

interface Program {
  id: number;
  university_id: number;
  name: string;
  description: string;
  degree_type: string;
  country: string;
  city: string;
  state?: string;
  url?: string;
  cost: string;
  status: string;
  visibility: string;
  created_at: string;
  updated_at: string;
  university_name: string;
  rating?: number;
}

interface AdminProgramAction {
  program_id: number;
  action: 'approve' | 'reject';
}

interface Filters {
  degreeType: string;
  country: string;
  city: string;
  state: string;
  cost: string;
  sortBy: string;
  sortOrder: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pendingPrograms, setPendingPrograms] = useState<University[]>([]);
  const [allPrograms, setAllPrograms] = useState<Program[]>([]);
  const [proposals, setProposals] = useState<ProgramProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'proposals' | 'all'>('pending');
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [filters, setFilters] = useState<Filters>({
    degreeType: '',
    country: '',
    city: '',
    state: '',
    cost: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  // Extract unique location options from programs data
  const locationOptions = {
    countries: [...new Set(allPrograms.map((p) => p.country).filter(Boolean))].sort(),
    cities: [...new Set(allPrograms.map((p) => p.city).filter(Boolean))].sort(),
    states: [...new Set(allPrograms.map((p) => p.state).filter(Boolean))].sort(),
  };

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
        setPendingPrograms([]);
      } else {
        setMessage({ type: 'error', text: 'Failed to fetch pending programs.' });
        setPendingPrograms([]);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while fetching programs.' });
      setPendingPrograms([]);
    } finally {
      setLoading(false);
    }
  }, [session]);

  const fetchAllPrograms = useCallback(async () => {
    if (!session?.user) return;

    try {
      // Build query parameters for filtering
      const queryParams = new URLSearchParams();
      if (filters.degreeType) queryParams.append('degree_type', filters.degreeType);
      if (filters.country) queryParams.append('country', filters.country);
      if (filters.city) queryParams.append('city', filters.city);
      if (filters.state) queryParams.append('state', filters.state);
      if (filters.cost) queryParams.append('cost', filters.cost);
      if (filters.sortBy) queryParams.append('sort_by', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sort_order', filters.sortOrder);

      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/admin/programs/all${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${(session.user as any).googleId}`,
        },
      });

      if (response.ok) {
        const programs = await response.json();
        setAllPrograms(programs);
      } else if (response.status === 403) {
        setMessage({ type: 'error', text: 'Access denied. Admin privileges required.' });
        setAllPrograms([]);
      } else {
        setMessage({ type: 'error', text: 'Failed to fetch all programs.' });
        setAllPrograms([]);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while fetching programs.' });
      setAllPrograms([]);
    }
  }, [session, filters]);

  const fetchProposals = useCallback(async () => {
    if (!session?.user) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/admin/proposals?status=pending`, {
        headers: {
          'Authorization': `Bearer ${(session.user as any).googleId}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProposals(data);
      } else if (response.status === 403) {
        setMessage({ type: 'error', text: 'Access denied. Admin privileges required.' });
        setProposals([]);
      } else {
        setMessage({ type: 'error', text: 'Failed to fetch proposals.' });
        setProposals([]);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while fetching proposals.' });
      setProposals([]);
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
    fetchAllPrograms();
    fetchProposals();
  }, [session, status, router, fetchPendingPrograms, fetchAllPrograms, fetchProposals]);

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
        // Refresh all programs to show updated status
        fetchAllPrograms();
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

  const handleEditProgram = (program: Program) => {
    setEditingProgram(program);
  };

  const handleSaveProgram = (updatedProgram: Program) => {
    setMessage({ type: 'success', text: 'Program updated successfully' });
    setEditingProgram(null);
    // Refresh both lists
    fetchPendingPrograms();
    fetchAllPrograms();
  };

  const handleCancelEdit = () => {
    setEditingProgram(null);
  };

  const handleProposalReview = async (proposalId: number, action: 'approve' | 'reject', adminNotes?: string) => {
    if (!session?.user) return;

    setActionLoading(proposalId);
    setMessage(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/admin/proposals/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(session.user as any).googleId}`,
        },
        body: JSON.stringify({
          proposal_id: proposalId,
          action: action,
          admin_notes: adminNotes,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setMessage({ type: 'success', text: result.message });
        // Remove the proposal from the pending list
        setProposals(prev => prev.filter(p => p.id !== proposalId));
        // Refresh all programs to show updated data if approved
        if (action === 'approve') {
          fetchAllPrograms();
        }
      } else {
        const error = await response.text();
        setMessage({ type: 'error', text: error || `Failed to ${action} proposal.` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `An error occurred while ${action}ing the proposal.` });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (visibility: string) => {
    switch (visibility) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
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
            Review and manage program proposals
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pending'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Pending Programs ({pendingPrograms?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('proposals')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'proposals'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Program Proposals ({proposals?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                All Programs ({allPrograms?.length || 0})
              </button>
            </nav>
          </div>
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

        {/* Pending Programs Tab */}
        {activeTab === 'pending' && (
          <>
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
          </>
        )}

        {/* Program Proposals Tab */}
        {activeTab === 'proposals' && (
          <>
            {!proposals || proposals.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 text-center">
                <div className="text-gray-500 dark:text-gray-400 text-lg">
                  No pending program proposals to review
                </div>
                <p className="text-gray-400 dark:text-gray-500 mt-2">
                  All program change proposals have been processed.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {proposals.map((proposal) => (
                  <div key={proposal.id} className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {proposal.program_name} - {proposal.university_name}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Proposed by {proposal.user_name} ({proposal.user_email}) on{' '}
                          {new Date(proposal.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        Pending Review
                      </span>
                    </div>

                    <div className="mb-4">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">Reason for Changes:</h3>
                      <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                        {proposal.reason}
                      </p>
                    </div>

                    <div className="mb-4">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">Proposed Changes:</h3>
                      <div className="space-y-2">
                        {proposal.proposed_name && (
                          <div className="flex">
                            <span className="font-medium text-gray-600 dark:text-gray-400 w-32">Name:</span>
                            <span className="text-gray-900 dark:text-white">{proposal.proposed_name}</span>
                          </div>
                        )}
                        {proposal.proposed_description && (
                          <div className="flex">
                            <span className="font-medium text-gray-600 dark:text-gray-400 w-32">Description:</span>
                            <span className="text-gray-900 dark:text-white">{proposal.proposed_description}</span>
                          </div>
                        )}
                        {proposal.proposed_degree_type && (
                          <div className="flex">
                            <span className="font-medium text-gray-600 dark:text-gray-400 w-32">Degree Type:</span>
                            <span className="text-gray-900 dark:text-white">{proposal.proposed_degree_type}</span>
                          </div>
                        )}
                        {proposal.proposed_country && (
                          <div className="flex">
                            <span className="font-medium text-gray-600 dark:text-gray-400 w-32">Country:</span>
                            <span className="text-gray-900 dark:text-white">{proposal.proposed_country}</span>
                          </div>
                        )}
                        {proposal.proposed_city && (
                          <div className="flex">
                            <span className="font-medium text-gray-600 dark:text-gray-400 w-32">City:</span>
                            <span className="text-gray-900 dark:text-white">{proposal.proposed_city}</span>
                          </div>
                        )}
                        {proposal.proposed_state && (
                          <div className="flex">
                            <span className="font-medium text-gray-600 dark:text-gray-400 w-32">State:</span>
                            <span className="text-gray-900 dark:text-white">{proposal.proposed_state}</span>
                          </div>
                        )}
                        {proposal.proposed_url && (
                          <div className="flex">
                            <span className="font-medium text-gray-600 dark:text-gray-400 w-32">URL:</span>
                            <a
                              href={proposal.proposed_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {proposal.proposed_url}
                            </a>
                          </div>
                        )}
                        {proposal.proposed_cost && (
                          <div className="flex">
                            <span className="font-medium text-gray-600 dark:text-gray-400 w-32">Cost:</span>
                            <span className="text-gray-900 dark:text-white">
                              {proposal.proposed_cost === 'Free' ? 'Free' :
                               proposal.proposed_cost === '$' ? 'Low Cost' :
                               proposal.proposed_cost === '$$' ? 'Medium Cost' :
                               proposal.proposed_cost === '$$$' ? 'High Cost' :
                               proposal.proposed_cost}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => handleProposalReview(proposal.id, 'reject')}
                        disabled={actionLoading === proposal.id}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors"
                      >
                        {actionLoading === proposal.id ? 'Processing...' : 'Reject'}
                      </button>
                      <button
                        onClick={() => handleProposalReview(proposal.id, 'approve')}
                        disabled={actionLoading === proposal.id}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors"
                      >
                        {actionLoading === proposal.id ? 'Processing...' : 'Approve & Apply Changes'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* All Programs Tab */}
        {activeTab === 'all' && (
          <>
            {/* Filters for All Programs */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Filter & Sort Programs
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Degree Type
                  </label>
                  <select
                    value={filters.degreeType}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, degreeType: e.target.value }))
                    }
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, country: e.target.value }))
                    }
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Countries</option>
                    {locationOptions.countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City
                  </label>
                  <select
                    value={filters.city}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, city: e.target.value }))
                    }
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Cities</option>
                    {locationOptions.cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    State
                  </label>
                  <select
                    value={filters.state}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, state: e.target.value }))
                    }
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All States</option>
                    {locationOptions.states.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cost
                  </label>
                  <select
                    value={filters.cost}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, cost: e.target.value }))
                    }
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Costs</option>
                    <option value="Free">Free</option>
                    <option value="$">Low Cost</option>
                    <option value="$$">Medium Cost</option>
                    <option value="$$$">High Cost</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, sortBy: e.target.value }))
                    }
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="created_at">Date Added</option>
                    <option value="name">Name</option>
                    <option value="university_name">University</option>
                    <option value="degree_type">Degree Type</option>
                    <option value="country">Country</option>
                    <option value="visibility">Status</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Order
                  </label>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, sortOrder: e.target.value }))
                    }
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <button
                  onClick={() =>
                    setFilters({
                      degreeType: '',
                      country: '',
                      city: '',
                      state: '',
                      cost: '',
                      sortBy: 'created_at',
                      sortOrder: 'desc',
                    })
                  }
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {!allPrograms || allPrograms.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 text-center">
                <div className="text-gray-500 dark:text-gray-400 text-lg">
                  No programs found
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {allPrograms.map((program) => (
                  <div key={program.id} className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {program.name}
                        </h2>
                        <p className="text-lg text-gray-700 dark:text-gray-300 mt-1">
                          {program.university_name}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {program.degree_type}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {program.cost === 'Free' ? 'Free' :
                           program.cost === '$' ? 'Low Cost' :
                           program.cost === '$$' ? 'Medium Cost' :
                           program.cost === '$$$' ? 'High Cost' :
                           program.cost}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(program.visibility)}`}>
                          {program.visibility.charAt(0).toUpperCase() + program.visibility.slice(1)}
                        </span>
                        {program.rating !== undefined && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            Rating: {program.rating}
                          </span>
                        )}
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
                        {program.url && (
                          <a
                            href={program.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Program URL
                          </a>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleEditProgram(program)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                          Edit
                        </button>
                        {program.visibility === 'pending' && (
                          <>
                            <button
                              onClick={() => handleProgramAction(program.id, 'reject')}
                              disabled={actionLoading === program.id}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors"
                            >
                              {actionLoading === program.id ? 'Processing...' : 'Reject'}
                            </button>
                            <button
                              onClick={() => handleProgramAction(program.id, 'approve')}
                              disabled={actionLoading === program.id}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors"
                            >
                              {actionLoading === program.id ? 'Processing...' : 'Approve'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
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

      {/* Edit Program Modal */}
      {editingProgram && (
        <ProgramEditForm
          program={editingProgram}
          onSave={handleSaveProgram}
          onCancel={handleCancelEdit}
        />
      )}
    </div>
  );
}

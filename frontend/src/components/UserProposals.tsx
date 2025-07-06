'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { ProgramProposal } from '@/types/university';

export default function UserProposals() {
  const { data: session } = useSession();
  const [proposals, setProposals] = useState<ProgramProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProposal, setEditingProposal] = useState<ProgramProposal | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [showApproved, setShowApproved] = useState(false);

  const fetchUserProposals = useCallback(async () => {
    try {
      const authToken = (session?.user as any)?.googleId || (session?.user as any)?.githubId;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/programs/proposals/user`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch proposals');
      }

      const data = await response.json();
      setProposals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load proposals');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session?.user) {
      fetchUserProposals();
    }
  }, [session, fetchUserProposals]);

  const deleteProposal = useCallback(async (proposalId: number) => {
    try {
      const authToken = (session?.user as any)?.googleId || (session?.user as any)?.githubId;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/programs/proposals/${proposalId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete proposal');
      }

      // Remove the proposal from the local state
      setProposals(prev => prev.filter(p => p.id !== proposalId));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete proposal');
    }
  }, [session]);

  const updateProposal = useCallback(async (proposalId: number, updatedData: any) => {
    try {
      const authToken = (session?.user as any)?.googleId || (session?.user as any)?.githubId;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/programs/proposals/${proposalId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        throw new Error('Failed to update proposal');
      }

      const result = await response.json();

      // Update the proposal in the local state
      setProposals(prev => prev.map(p => p.id === proposalId ? result.proposal : p));
      setEditingProposal(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update proposal');
    }
  }, [session]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!session?.user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-300">Please log in to view your proposals.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-300">Loading your proposals...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400">Error: {error}</p>
        <button
          onClick={fetchUserProposals}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!proposals || proposals.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-300">You haven&apos;t submitted any program change proposals yet.</p>
      </div>
    );
  }

  // Filter proposals based on showApproved state (now shows only pending by default)
  const filteredProposals = (proposals || []).filter(proposal =>
    showApproved || proposal.status === 'pending'
  );

  if (filteredProposals.length === 0 && !showApproved) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Your Program Change Proposals</h2>

          <label className="flex items-center gap-2 text-gray-300">
            <input
              type="checkbox"
              checked={showApproved}
              onChange={(e) => setShowApproved(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
            />
            Show completed proposals
          </label>
        </div>

        <div className="text-center py-8">
          <p className="text-gray-300">No pending proposals. Check &quot;Show completed proposals&quot; to see approved and rejected proposals.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Your Program Change Proposals</h2>

        <label className="flex items-center gap-2 text-gray-300">
          <input
            type="checkbox"
            checked={showApproved}
            onChange={(e) => setShowApproved(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
          />
          Show completed proposals
        </label>
      </div>

      <div className="space-y-4">
        {filteredProposals.map((proposal) => (
          <div key={proposal.id} className="bg-gray-800 border border-gray-600 rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {proposal.program_name} - {proposal.university_name}
                </h3>
                <p className="text-sm text-gray-300">
                  Submitted on {formatDate(proposal.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(proposal.status)}`}>
                  {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                </span>
                {(proposal.status === 'pending' || proposal.status === 'rejected') && (
                  <div className="flex gap-2">
                    {proposal.status === 'pending' && (
                      <button
                        onClick={() => setEditingProposal(proposal)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteConfirm(proposal.id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-white mb-2">Reason for Changes:</h4>
                <p className="text-gray-300 bg-gray-700 p-3 rounded-md">{proposal.reason}</p>
              </div>

              <div>
                <h4 className="font-medium text-white mb-2">Proposed Changes:</h4>
                <div className="space-y-2">
                  {proposal.proposed_name && (
                    <div className="flex">
                      <span className="font-medium text-gray-300 w-24">Name:</span>
                      <span className="text-white">{proposal.proposed_name}</span>
                    </div>
                  )}
                  {proposal.proposed_description && (
                    <div className="flex">
                      <span className="font-medium text-gray-300 w-24">Description:</span>
                      <span className="text-white">{proposal.proposed_description}</span>
                    </div>
                  )}
                  {proposal.proposed_degree_type && (
                    <div className="flex">
                      <span className="font-medium text-gray-300 w-24">Degree Type:</span>
                      <span className="text-white">{proposal.proposed_degree_type}</span>
                    </div>
                  )}
                  {proposal.proposed_country && (
                    <div className="flex">
                      <span className="font-medium text-gray-300 w-24">Country:</span>
                      <span className="text-white">{proposal.proposed_country}</span>
                    </div>
                  )}
                  {proposal.proposed_city && (
                    <div className="flex">
                      <span className="font-medium text-gray-300 w-24">City:</span>
                      <span className="text-white">{proposal.proposed_city}</span>
                    </div>
                  )}
                  {proposal.proposed_state && (
                    <div className="flex">
                      <span className="font-medium text-gray-300 w-24">State:</span>
                      <span className="text-white">{proposal.proposed_state}</span>
                    </div>
                  )}
                  {proposal.proposed_url && (
                    <div className="flex">
                      <span className="font-medium text-gray-300 w-24">URL:</span>
                      <a
                        href={proposal.proposed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        {proposal.proposed_url}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {proposal.status !== 'pending' && (
                <div>
                  <h4 className="font-medium text-white mb-2">Review Details:</h4>
                  <div className="bg-gray-700 p-3 rounded-md">
                    <p className="text-sm text-gray-300">
                      Reviewed by {proposal.reviewer_name || 'Administrator'} on{' '}
                      {proposal.reviewed_at && formatDate(proposal.reviewed_at)}
                    </p>
                    {proposal.admin_notes && (
                      <div className="mt-2">
                        <span className="font-medium text-gray-200">Admin Notes:</span>
                        <p className="text-gray-300 mt-1">{proposal.admin_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Confirm Delete</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this proposal? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteProposal(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form Dialog */}
      {editingProposal && (
        <EditProposalForm
          proposal={editingProposal}
          onSave={updateProposal}
          onCancel={() => setEditingProposal(null)}
        />
      )}
    </div>
  );
}

// Edit Proposal Form Component
interface EditProposalFormProps {
  proposal: ProgramProposal;
  onSave: (proposalId: number, data: any) => void;
  onCancel: () => void;
}

function EditProposalForm({ proposal, onSave, onCancel }: EditProposalFormProps) {
  const [formData, setFormData] = useState({
    reason: proposal.reason,
    proposed_name: proposal.proposed_name || '',
    proposed_description: proposal.proposed_description || '',
    proposed_degree_type: proposal.proposed_degree_type || '',
    proposed_country: proposal.proposed_country || '',
    proposed_city: proposal.proposed_city || '',
    proposed_state: proposal.proposed_state || '',
    proposed_url: proposal.proposed_url || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert empty strings to null for optional fields
    const submitData = {
      reason: formData.reason,
      proposed_name: formData.proposed_name || null,
      proposed_description: formData.proposed_description || null,
      proposed_degree_type: formData.proposed_degree_type || null,
      proposed_country: formData.proposed_country || null,
      proposed_city: formData.proposed_city || null,
      proposed_state: formData.proposed_state || null,
      proposed_url: formData.proposed_url || null,
    };

    onSave(proposal.id, submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Edit Proposal</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Reason for Changes *
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Proposed Name
              </label>
              <input
                type="text"
                value={formData.proposed_name}
                onChange={(e) => setFormData(prev => ({ ...prev, proposed_name: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Proposed Description
              </label>
              <textarea
                value={formData.proposed_description}
                onChange={(e) => setFormData(prev => ({ ...prev, proposed_description: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Proposed Degree Type
              </label>
              <select
                value={formData.proposed_degree_type}
                onChange={(e) => setFormData(prev => ({ ...prev, proposed_degree_type: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select degree type</option>
                <option value="masters">Masters</option>
                <option value="phd">PhD</option>
                <option value="certificate">Certificate</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Proposed Country
              </label>
              <input
                type="text"
                value={formData.proposed_country}
                onChange={(e) => setFormData(prev => ({ ...prev, proposed_country: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Proposed City
              </label>
              <input
                type="text"
                value={formData.proposed_city}
                onChange={(e) => setFormData(prev => ({ ...prev, proposed_city: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Proposed State
              </label>
              <input
                type="text"
                value={formData.proposed_state}
                onChange={(e) => setFormData(prev => ({ ...prev, proposed_state: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Proposed URL
              </label>
              <input
                type="url"
                value={formData.proposed_url}
                onChange={(e) => setFormData(prev => ({ ...prev, proposed_url: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

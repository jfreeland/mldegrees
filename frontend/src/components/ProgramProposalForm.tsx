'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { University, ProgramProposalRequest } from '@/types/university';

interface ProgramProposalFormProps {
  program: University;
  onSubmit: (proposal: ProgramProposalRequest) => void;
  onCancel: () => void;
}

export default function ProgramProposalForm({ program, onSubmit, onCancel }: ProgramProposalFormProps) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    proposed_name: '',
    proposed_description: '',
    proposed_degree_type: '',
    proposed_country: '',
    proposed_city: '',
    proposed_state: '',
    proposed_url: '',
    reason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user) {
      alert('You must be logged in to propose changes');
      return;
    }

    if (!formData.reason.trim()) {
      alert('Please provide a reason for your proposed changes');
      return;
    }

    // Check if at least one field is being changed
    const hasChanges = Object.entries(formData).some(([key, value]) => {
      if (key === 'reason') return false;
      return value.trim() !== '';
    });

    if (!hasChanges) {
      alert('Please propose at least one change to the program');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build the proposal object with only non-empty fields
      const proposal: ProgramProposalRequest = {
        program_id: parseInt(program.id),
        reason: formData.reason.trim()
      };

      if (formData.proposed_name.trim()) proposal.proposed_name = formData.proposed_name.trim();
      if (formData.proposed_description.trim()) proposal.proposed_description = formData.proposed_description.trim();
      if (formData.proposed_degree_type.trim()) proposal.proposed_degree_type = formData.proposed_degree_type.trim();
      if (formData.proposed_country.trim()) proposal.proposed_country = formData.proposed_country.trim();
      if (formData.proposed_city.trim()) proposal.proposed_city = formData.proposed_city.trim();
      if (formData.proposed_state.trim()) proposal.proposed_state = formData.proposed_state.trim();
      if (formData.proposed_url.trim()) proposal.proposed_url = formData.proposed_url.trim();

      onSubmit(proposal);
    } catch (error) {
      console.error('Error submitting proposal:', error);
      alert('Failed to submit proposal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 bg-gray-800 relative">
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-500 rounded-full p-1"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-2xl font-bold text-white mb-4 pr-8">
            Propose Changes to {program.programName}
          </h2>
          <p className="text-gray-300 mb-6">
            Suggest improvements to this program. Only fill in the fields you want to change.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 bg-gray-800">
            {/* Current Program Info */}
            <div className="bg-gray-700 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-white mb-2">Current Program Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-200">
                <div><span className="font-medium text-white">University:</span> {program.name}</div>
                <div><span className="font-medium text-white">Program:</span> {program.programName}</div>
                <div><span className="font-medium text-white">Degree Type:</span> {program.degreeType}</div>
                <div><span className="font-medium text-white">Country:</span> {program.country}</div>
                <div><span className="font-medium text-white">City:</span> {program.city}</div>
                {program.state && <div><span className="font-medium text-white">State:</span> {program.state}</div>}
                {program.url && <div><span className="font-medium text-white">URL:</span> <a href={program.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{program.url}</a></div>}
              </div>
              <div className="mt-2">
                <span className="font-medium text-white">Description:</span>
                <p className="text-gray-200 mt-1">{program.description}</p>
              </div>
            </div>

            {/* Proposed Changes */}
            <div className="space-y-4">
              <h3 className="font-semibold text-white">Proposed Changes</h3>

              <div>
                <label htmlFor="proposed_name" className="block text-sm font-medium text-gray-200 mb-1">
                  Program Name
                </label>
                <input
                  type="text"
                  id="proposed_name"
                  name="proposed_name"
                  value={formData.proposed_name}
                  onChange={handleInputChange}
                  placeholder={`Current: ${program.programName}`}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white placeholder-gray-400"
                />
              </div>

              <div>
                <label htmlFor="proposed_description" className="block text-sm font-medium text-gray-200 mb-1">
                  Description
                </label>
                <textarea
                  id="proposed_description"
                  name="proposed_description"
                  value={formData.proposed_description}
                  onChange={handleInputChange}
                  placeholder={`Current: ${program.description}`}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white placeholder-gray-400"
                />
              </div>

              <div>
                <label htmlFor="proposed_degree_type" className="block text-sm font-medium text-gray-200 mb-1">
                  Degree Type
                </label>
                <select
                  id="proposed_degree_type"
                  name="proposed_degree_type"
                  value={formData.proposed_degree_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
                >
                  <option value="">Keep current: {program.degreeType}</option>
                  <option value="bachelors">Bachelor&apos;s</option>
                  <option value="masters">Master&apos;s</option>
                  <option value="phd">PhD</option>
                  <option value="certificate">Certificate</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="proposed_country" className="block text-sm font-medium text-gray-200 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    id="proposed_country"
                    name="proposed_country"
                    value={formData.proposed_country}
                    onChange={handleInputChange}
                    placeholder={`Current: ${program.country}`}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label htmlFor="proposed_city" className="block text-sm font-medium text-gray-200 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    id="proposed_city"
                    name="proposed_city"
                    value={formData.proposed_city}
                    onChange={handleInputChange}
                    placeholder={`Current: ${program.city}`}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="proposed_state" className="block text-sm font-medium text-gray-200 mb-1">
                  State/Province (optional)
                </label>
                <input
                  type="text"
                  id="proposed_state"
                  name="proposed_state"
                  value={formData.proposed_state}
                  onChange={handleInputChange}
                  placeholder={program.state ? `Current: ${program.state}` : 'Add state/province'}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white placeholder-gray-400"
                />
              </div>

              <div>
                <label htmlFor="proposed_url" className="block text-sm font-medium text-gray-200 mb-1">
                  Program URL (optional)
                </label>
                <input
                  type="url"
                  id="proposed_url"
                  name="proposed_url"
                  value={formData.proposed_url}
                  onChange={handleInputChange}
                  placeholder={program.url ? `Current: ${program.url}` : 'Add program URL'}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white placeholder-gray-400"
                />
              </div>

              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-200 mb-1">
                  Reason for Changes <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  placeholder="Please explain why you're proposing these changes..."
                  rows={3}
                  required
                  className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white placeholder-gray-400"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

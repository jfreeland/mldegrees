export interface University {
  id: string;
  name: string;
  programName: string;
  description: string;
  degreeType: string;
  country: string;
  city: string;
  state?: string;
  url?: string;
  status: string;
  visibility: string;
  rating: number;
  userVote?: 1 | -1 | null;
}

export interface VoteRequest {
  universityId: string;
  vote: 1 | -1;
}

export interface UniversitiesResponse {
  universities: University[];
  total: number;
}

export interface ProposeRequest {
  university_name: string;
  program_name: string;
  description: string;
  degree_type: string;
  country: string;
  city: string;
  state?: string;
  url?: string;
}

export interface ProposeResponse {
  program: University;
  message: string;
}

export interface ProgramProposal {
  id: number;
  program_id: number;
  user_id: number;
  proposed_name?: string;
  proposed_description?: string;
  proposed_degree_type?: string;
  proposed_country?: string;
  proposed_city?: string;
  proposed_state?: string;
  proposed_url?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  reviewed_by?: number;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  program_name?: string;
  university_name?: string;
  reviewer_name?: string;
}

export interface ProgramProposalRequest {
  program_id: number;
  proposed_name?: string;
  proposed_description?: string;
  proposed_degree_type?: string;
  proposed_country?: string;
  proposed_city?: string;
  proposed_state?: string;
  proposed_url?: string;
  reason: string;
}

export interface ProgramProposalReviewRequest {
  proposal_id: number;
  action: 'approve' | 'reject';
  admin_notes?: string;
}

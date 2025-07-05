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

export interface Program {
  id: string;
  name: string;
  universityName: string;
  description: string;
  degreeType: string;
  country: string;
  city: string;
  state?: string;
  url?: string;
  cost: 'Free' | '$' | '$$' | '$$$';
}

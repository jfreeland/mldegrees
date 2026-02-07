import { createClient } from "@/lib/supabase/server";
import ProgramCard from "@/components/ProgramCard";
import StructuredData from "@/components/StructuredData";
import AdUnit from "@/components/AdUnit";
import { Program } from "@/types/program";

interface ProgramRow {
  id: number;
  name: string;
  description: string;
  degree_type: string;
  country: string;
  city: string;
  state: string | null;
  url: string | null;
  cost: string | null;
  universities: {
    name: string;
  } | { name: string }[] | null;
}

async function getPrograms(): Promise<Program[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('programs')
    .select(`
      id,
      name,
      description,
      degree_type,
      country,
      city,
      state,
      url,
      cost,
      universities (
        name
      )
    `)
    .eq('status', 'active')
    .eq('visibility', 'approved')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching programs:', error);
    return [];
  }

  return ((data as unknown as ProgramRow[]) || []).map((p) => {
    const uni = Array.isArray(p.universities) ? p.universities[0] : p.universities;
    return {
      id: p.id.toString(),
      name: p.name,
      universityName: uni?.name || 'Unknown University',
      description: p.description,
      degreeType: p.degree_type,
      country: p.country,
      city: p.city,
      state: p.state || undefined,
      url: p.url || undefined,
      cost: (p.cost as Program['cost']) || 'Free',
    };
  });
}

export default async function Home() {
  const programs = await getPrograms();

  return (
    <>
      <StructuredData programs={programs} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Machine Learning Degree Programs
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover machine learning and AI degree programs from universities worldwide.
            Find the perfect program to advance your career in artificial intelligence.
          </p>
        </div>

        {/* Top ad unit */}
        <AdUnit slot="top-banner" className="mb-6" />

        {programs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              No programs available at this time. Check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {programs.map((program, index) => (
              <div key={program.id}>
                <ProgramCard program={program} />
                {/* Insert ad after every 5 programs */}
                {(index + 1) % 5 === 0 && index < programs.length - 1 && (
                  <AdUnit slot={`in-feed-${Math.floor(index / 5)}`} className="mt-6" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Bottom ad unit */}
        <AdUnit slot="bottom-banner" className="mt-8" />
      </div>
    </>
  );
}

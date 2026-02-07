import { createClient } from "@/lib/supabase/server";
import ProgramCard from "@/components/ProgramCard";
import ProgramTableInteractive from "@/components/ProgramTableInteractive";
import StructuredData from "@/components/StructuredData";
import AdUnit from "@/components/AdUnit";
import { Program } from "@/types/program";
import Link from "next/link";

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
  value_rating: string | null;
  format: string | null;
  featured: boolean;
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
      value_rating,
      format,
      featured,
      universities (
        name
      )
    `)
    .eq('status', 'active')
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
      valueRating: (p.value_rating as Program['valueRating']) || 'good',
      format: (p.format as Program['format']) || 'on-campus',
      featured: p.featured,
    };
  });
}

function getCountryCount(programs: Program[]): number {
  return new Set(programs.map(p => p.country)).size;
}

export default async function Home() {
  const programs = await getPrograms();

  const featured = programs.filter(p => p.featured);

  return (
    <>
      <StructuredData programs={programs} />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-10 sm:py-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                Find Your ML & AI Degree
              </h1>
              <p className="text-blue-100 text-sm sm:text-base max-w-xl">
                Compare {programs.length} machine learning programs from {new Set(programs.map(p => p.universityName)).size} universities
                in {getCountryCount(programs)} countries.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <a
                href="#programs"
                className="inline-flex items-center px-5 py-2.5 bg-white text-indigo-700 text-sm font-semibold rounded-lg hover:bg-blue-50 transition-colors shadow"
              >
                Browse Programs
              </a>
              <Link
                href="/guide"
                className="inline-flex items-center px-5 py-2.5 border border-white/30 text-white text-sm font-semibold rounded-lg hover:bg-white/10 transition-colors"
              >
                Degree Guide
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 mt-10">
        {/* Top ad unit */}
        <AdUnit slot="top-banner" className="mb-8" />

        {/* Featured Programs */}
        {featured.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Featured Programs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </div>
          </section>
        )}

        <AdUnit slot="in-feed-0" className="mb-8" />

        {/* All Programs — single interactive table */}
        <section id="programs" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            All Programs
          </h2>
          <ProgramTableInteractive programs={programs} />
        </section>

        {/* Bottom ad unit */}
        <AdUnit slot="bottom-banner" className="mb-8" />
      </div>
    </>
  );
}

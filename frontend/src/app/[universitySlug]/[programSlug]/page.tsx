import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";
import { notFound } from "next/navigation";
import Link from "next/link";
import AdUnit from "@/components/AdUnit";
import type { Metadata } from "next";

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
  universities: { name: string } | { name: string }[] | null;
}

async function getAllPrograms(): Promise<ProgramRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("programs")
    .select(
      `id, name, description, degree_type, country, city, state, url, cost, value_rating, format, universities (name)`
    )
    .eq("status", "active");

  if (error || !data) return [];
  return data as unknown as ProgramRow[];
}

function getUniversityName(p: ProgramRow): string {
  const uni = Array.isArray(p.universities) ? p.universities[0] : p.universities;
  return uni?.name || "Unknown University";
}

function findProgram(
  programs: ProgramRow[],
  universitySlug: string,
  programSlug: string
): ProgramRow | undefined {
  return programs.find(
    (p) =>
      slugify(getUniversityName(p)) === universitySlug &&
      slugify(p.name) === programSlug
  );
}

export async function generateStaticParams() {
  const programs = await getAllPrograms();
  return programs.map((p) => ({
    universitySlug: slugify(getUniversityName(p)),
    programSlug: slugify(p.name),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ universitySlug: string; programSlug: string }>;
}): Promise<Metadata> {
  const { universitySlug, programSlug } = await params;
  const programs = await getAllPrograms();
  const program = findProgram(programs, universitySlug, programSlug);
  if (!program) return { title: "Program Not Found" };

  const universityName = getUniversityName(program);
  const location = [program.city, program.state, program.country]
    .filter(Boolean)
    .join(", ");

  return {
    title: `${program.name} - ${universityName}`,
    description: `${program.description.slice(0, 155)}...`,
    openGraph: {
      title: `${program.name} at ${universityName}`,
      description: program.description,
      url: `https://mldegrees.com/${universitySlug}/${programSlug}`,
    },
    twitter: {
      title: `${program.name} at ${universityName}`,
      description: `${program.degree_type} program in ${location}. ${program.description.slice(0, 100)}...`,
    },
    alternates: {
      canonical: `https://mldegrees.com/${universitySlug}/${programSlug}`,
    },
  };
}

function getDegreeLabel(type: string): string {
  const labels: Record<string, string> = {
    masters: "Master's Degree",
    bachelors: "Bachelor's Degree",
    phd: "Doctoral (PhD)",
    certificate: "Certificate",
  };
  return labels[type] || type;
}

function getCostInfo(cost: string | null): { label: string; color: string } {
  switch (cost) {
    case "Free":
      return { label: "Free", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" };
    case "$":
      return { label: "Low Cost (Under $10K)", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" };
    case "$$":
      return { label: "Medium Cost ($10K–$30K)", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" };
    case "$$$":
      return { label: "High Cost ($30K+)", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" };
    default:
      return { label: cost || "Unknown", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" };
  }
}

function getValueInfo(value: string | null): { label: string; color: string } {
  switch (value) {
    case "excellent":
      return { label: "Excellent Value", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" };
    case "good":
      return { label: "Good Value", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" };
    case "fair":
      return { label: "Fair Value", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" };
    default:
      return { label: "Not Rated", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" };
  }
}

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ universitySlug: string; programSlug: string }>;
}) {
  const { universitySlug, programSlug } = await params;
  const programs = await getAllPrograms();
  const program = findProgram(programs, universitySlug, programSlug);
  if (!program) notFound();

  const universityName = getUniversityName(program);
  const physicalLocation = [program.city, program.state, program.country]
    .filter(Boolean)
    .join(", ");
  const location = program.format === 'online'
    ? 'Online'
    : program.format === 'hybrid'
      ? `${physicalLocation} / Online`
      : physicalLocation;
  const costInfo = getCostInfo(program.cost);
  const valueInfo = getValueInfo(program.value_rating);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: program.name,
    description: program.description,
    provider: {
      "@type": "EducationalOrganization",
      name: universityName,
      address: {
        "@type": "PostalAddress",
        addressLocality: program.city,
        addressRegion: program.state,
        addressCountry: program.country,
      },
    },
    educationalCredentialAwarded: getDegreeLabel(program.degree_type),
    url: program.url,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Home
          </Link>
          <span className="mx-2">›</span>
          <span className="text-gray-900 dark:text-white">{program.name}</span>
        </nav>

        <AdUnit slot="program-top-banner" className="mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8">
              <div className="mb-6">
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                  {universityName}
                </p>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  {program.name}
                </h1>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                    {getDegreeLabel(program.degree_type)}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${costInfo.color}`}>
                    {costInfo.label}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${valueInfo.color}`}>
                    {valueInfo.label}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  About This Program
                </h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                  {program.description}
                </p>
              </div>

              {program.url && (
                <div className="mt-8">
                  <a
                    href={program.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-md hover:shadow-lg"
                  >
                    Visit Program Website
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Facts
              </h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">University</dt>
                  <dd className="text-gray-900 dark:text-white font-medium">{universityName}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Location</dt>
                  <dd className="text-gray-900 dark:text-white font-medium">{location}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Degree Type</dt>
                  <dd className="text-gray-900 dark:text-white font-medium">{getDegreeLabel(program.degree_type)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Cost</dt>
                  <dd className="text-gray-900 dark:text-white font-medium">{costInfo.label}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Value Rating</dt>
                  <dd className="text-gray-900 dark:text-white font-medium">{valueInfo.label}</dd>
                </div>
              </dl>
            </div>

            <AdUnit slot="program-sidebar" format="rectangle" className="sticky top-24" />
          </div>
        </div>

        <AdUnit slot="program-bottom-banner" className="mt-8" />

        {/* Back to listings */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Browse All Programs
          </Link>
        </div>
      </div>
    </>
  );
}

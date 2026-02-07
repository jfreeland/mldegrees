import { Program } from "@/types/program";

interface StructuredDataProps {
  programs: Program[];
}

export default function StructuredData({ programs }: StructuredDataProps) {
  const generateStructuredData = () => {
    const organizationData = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Machine Learning (ML) Degrees",
      description:
        "Discover and compare machine learning degree programs, certificates, and courses from universities worldwide.",
      url: "https://mldegrees.com",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://mldegrees.com/?search={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    };

    const coursesData = programs.slice(0, 10).map((program) => ({
      "@context": "https://schema.org",
      "@type": "Course",
      name: program.name,
      description: program.description,
      provider: {
        "@type": "EducationalOrganization",
        name: program.universityName,
        address: {
          "@type": "PostalAddress",
          addressLocality: program.city,
          addressRegion: program.state,
          addressCountry: program.country,
        },
      },
      educationalCredentialAwarded: program.degreeType,
      url: program.url,
    }));

    return {
      organization: organizationData,
      courses: coursesData,
    };
  };

  const structuredData = generateStructuredData();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData.organization),
        }}
      />
      {structuredData.courses.map((course, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(course),
          }}
        />
      ))}
    </>
  );
}

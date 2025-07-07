import { University } from '@/types/university'

interface StructuredDataProps {
  universities: University[]
}

export default function StructuredData({ universities }: StructuredDataProps) {
  const generateStructuredData = () => {
    const organizationData = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "ML Degrees",
      "description": "Discover and compare machine learning degree programs, certificates, and courses from universities worldwide.",
      "url": "https://mldegrees.com",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://mldegrees.com/?search={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    }

    const coursesData = universities.slice(0, 10).map(university => ({
      "@context": "https://schema.org",
      "@type": "Course",
      "name": university.programName,
      "description": university.description,
      "provider": {
        "@type": "EducationalOrganization",
        "name": university.name,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": university.city,
          "addressRegion": university.state,
          "addressCountry": university.country
        }
      },
      "educationalCredentialAwarded": university.degreeType,
      "url": university.url,
      "aggregateRating": university.average_rating ? {
        "@type": "AggregateRating",
        "ratingValue": university.average_rating,
        "ratingCount": 1,
        "bestRating": 5,
        "worstRating": 1
      } : undefined
    }))

    return {
      organization: organizationData,
      courses: coursesData
    }
  }

  const structuredData = generateStructuredData()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData.organization)
        }}
      />
      {structuredData.courses.map((course, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(course)
          }}
        />
      ))}
    </>
  )
}

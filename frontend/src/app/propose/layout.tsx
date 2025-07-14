import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Propose New Program",
  description: "Submit a new machine learning degree program for review and inclusion in our database.",
  openGraph: {
    title: "Propose New ML Program - ML Degrees",
    description: "Submit a new machine learning degree program for review and inclusion in our database.",
    url: "https://mldegrees.com/propose",
  },
  twitter: {
    title: "Propose New ML Program - ML Degrees",
    description: "Submit a new machine learning degree program for review and inclusion in our database.",
  },
  alternates: {
    canonical: "https://mldegrees.com/propose",
  },
};

export default function ProposeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

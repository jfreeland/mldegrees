import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "My Proposals",
  description: "View and manage your submitted ML degree program proposals and their review status.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "https://mldegrees.com/proposals",
  },
};

export default function ProposalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

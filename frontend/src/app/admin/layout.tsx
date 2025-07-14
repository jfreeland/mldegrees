import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Administrative dashboard for managing ML degree program proposals, reviews, and approvals.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "https://mldegrees.com/admin",
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

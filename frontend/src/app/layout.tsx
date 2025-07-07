import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Titlebar from "@/components/Titlebar";
import AuthProvider from "@/components/AuthProvider";
import MetricsProvider from "@/components/MetricsProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mldegrees.com"),
  title: {
    default: "ML Degrees - Find Machine Learning Degrees Worldwide",
    template: "%s | ML Degrees",
  },
  description:
    "Discover and compare machine learning degree programs, certificates, and courses from universities worldwide. Find the perfect ML education path for your career goals.",
  keywords: [
    "machine learning",
    "degrees",
    "programs",
    "universities",
    "AI",
    "artificial intelligence",
    "data science",
    "computer science",
    "education",
  ],
  authors: [{ name: "ML Degrees Team" }],
  creator: "ML Degrees",
  publisher: "ML Degrees",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://mldegrees.com",
    siteName: "ML Degrees",
    title: "ML Degrees - Find Machine Learning Programs Worldwide",
    description:
      "Discover and compare machine learning degree programs, certificates, and courses from universities worldwide. Find the perfect ML education path for your career goals.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ML Degrees - Machine Learning Education Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ML Degrees - Find Machine Learning Programs Worldwide",
    description:
      "Discover and compare machine learning degree programs, certificates, and courses from universities worldwide.",
    images: ["/og-image.png"],
    creator: "@mldegrees",
  },
  alternates: {
    canonical: "https://mldegrees.com",
  },
  verification: {
    google: "google-site-verification-token",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <MetricsProvider>
            <Titlebar />
            <main className="min-h-screen">{children}</main>
          </MetricsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

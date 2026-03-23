import type { Metadata } from "next";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search services",
  robots: { index: false, follow: true },
  alternates: { canonical: `${BASE_URL}/search` },
};

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    service?: string;
    city?: string;
    sort?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const { q, service, city, sort } = params;

  return (
    <main className="min-h-screen px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">Search services</h1>
      <p className="text-gray-600 mb-4">
        This page will host the full search experience (filters, map, etc.) and
        is marked as noindex for SEO.
      </p>
      <pre className="mt-4 rounded bg-gray-100 p-4 text-sm text-gray-800">
        {JSON.stringify({ q, service, city, sort }, null, 2)}
      </pre>
    </main>
  );
}



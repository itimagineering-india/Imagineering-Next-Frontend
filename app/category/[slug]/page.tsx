import type { Metadata } from "next";
import Link from "next/link";
import { getCategories, getCategoryBySlug, searchServices } from "@/lib/api";
import { BASE_URL } from "@/lib/constants";
import { getCategoryTitle, getCategoryCityTitle, getCategoryCityDescription } from "@/lib/seo";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";

type Params = { slug: string };

export const revalidate = 1800;
export const dynamicParams = true;

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) {
    return { robots: { index: false, follow: true } };
  }

  const title = getCategoryTitle(category);
  const description = `Browse popular ${category.name} services across India on Imagineering India.`;
  const url = `${BASE_URL}/category/${category.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) {
    return (
      <main className="min-h-screen px-4 py-10">
        <h1 className="text-2xl font-semibold mb-4">Category not found</h1>
        <p className="text-gray-600">The requested category does not exist.</p>
      </main>
    );
  }

  // For now, show a generic listing (nationwide) and hints to city pages.
  const { services } = await searchServices({
    categorySlug: category.slug,
    page: 1,
    limit: 20,
    sort: "-rating",
  });

  const baseUrl = BASE_URL;

  return (
    <main className="min-h-screen px-4 py-10">
      <h1 className="text-3xl font-bold mb-4">
        Best {category.name} Services
      </h1>
      <p className="text-gray-600 mb-8 max-w-2xl">
        Discover verified {category.name.toLowerCase()} providers across India.
        Choose your city to see more accurate local results.
      </p>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Popular listings</h2>
        {services.length === 0 && (
          <p className="text-gray-500">No services available yet.</p>
        )}
        <ul className="space-y-3">
          {services.map((s) => (
            <li key={s.id} className="border rounded p-3">
              <div className="font-medium">{s.title}</div>
              {s.location?.city && (
                <div className="text-sm text-gray-600">
                  {getCategoryCityTitle(category.name, s.location.city)}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <BreadcrumbJsonLd
        id={`breadcrumb-category-${category.slug}`}
        items={[
          { name: "Home", item: `${baseUrl}/` },
          {
            name: category.name,
            item: `${baseUrl}/category/${category.slug}`,
          },
        ]}
      />
    </main>
  );
}


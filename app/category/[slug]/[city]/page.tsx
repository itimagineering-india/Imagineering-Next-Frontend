import type { Metadata } from "next";
import { getCategoryBySlug, searchServices } from "@/lib/api";
import { BASE_URL } from "@/lib/constants";
import {
  getCategoryCityTitle,
  getCategoryCityDescription,
} from "@/lib/seo";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { LocalBusinessJsonLd } from "@/components/seo/LocalBusinessJsonLd";

type Params = { slug: string; city: string };

export const revalidate = 900;
export const dynamicParams = true;

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { slug, city } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) {
    return { robots: { index: false, follow: true } };
  }

  const title = getCategoryCityTitle(category.name, city);
  const description = getCategoryCityDescription(category.name, city);
  const url = `${BASE_URL}/category/${category.slug}/${city}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
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

export default async function CategoryCityPage({ params }: { params: Promise<Params> }) {
  const { slug, city: citySlug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) {
    return (
      <main className="min-h-screen px-4 py-10">
        <h1 className="text-2xl font-semibold mb-4">Category not found</h1>
      </main>
    );
  }

  const { services } = await searchServices({
    categorySlug: category.slug,
    locationText: citySlug,
    page: 1,
    limit: 20,
    sort: "-rating",
  });

  const baseUrl = "https://www.imagineeringindia.com";
  const title = getCategoryCityTitle(category.name, citySlug);

  const ratings = services
    .map((s) => s.rating)
    .filter((r): r is number => typeof r === "number" && r > 0);
  const averageRating =
    ratings.length > 0
      ? Number(
          (ratings.reduce((acc, r) => acc + r, 0) / ratings.length).toFixed(1),
        )
      : undefined;
  const reviewCount = services
    .map((s) => s.reviewCount || 0)
    .reduce((acc, v) => acc + v, 0);

  return (
    <main className="min-h-screen px-4 py-10">
      <h1 className="text-3xl font-bold mb-4">
        {category.name} in {citySlug}
      </h1>
      <p className="text-gray-600 mb-8 max-w-2xl">
        {getCategoryCityDescription(category.name, citySlug)}
      </p>

      <section>
        <h2 className="text-xl font-semibold mb-3">
          Top {category.name} providers
        </h2>
        {services.length === 0 && (
          <p className="text-gray-500">
            No services available in this city yet.
          </p>
        )}
        <ul className="space-y-3">
          {services.map((s) => (
            <li key={s.id} className="border rounded p-3">
              <div className="font-medium">{s.title}</div>
              {s.location?.address && (
                <div className="text-sm text-gray-600">{s.location.address}</div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <BreadcrumbJsonLd
        id={`breadcrumb-category-${category.slug}-${citySlug}`}
        items={[
          { name: "Home", item: `${baseUrl}/` },
          {
            name: category.name,
            item: `${baseUrl}/category/${category.slug}`,
          },
          {
            name: `${category.name} in ${citySlug}`,
            item: `${baseUrl}/category/${category.slug}/${citySlug}`,
          },
        ]}
      />

      <LocalBusinessJsonLd
        id={`localbusiness-${category.slug}-${citySlug}`}
        name={title}
        url={`${baseUrl}/category/${category.slug}/${citySlug}`}
        city={citySlug}
        averageRating={averageRating}
        reviewCount={reviewCount}
      />
    </main>
  );
}


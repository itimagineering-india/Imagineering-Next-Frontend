import type { Metadata } from "next";
import { getCategoryBySlug, searchServices } from "@/lib/api";
import { BASE_URL } from "@/lib/constants";
import {
  getCategoryCityLocalityTitle,
  getCategoryCityLocalityDescription,
} from "@/lib/seo";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { LocalBusinessJsonLd } from "@/components/seo/LocalBusinessJsonLd";

type Params = { slug: string; city: string; locality: string };

export const revalidate = 900;
export const dynamicParams = true;

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { slug, city, locality } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) {
    return { robots: { index: false, follow: true } };
  }

  const title = getCategoryCityLocalityTitle(
    category.name,
    city,
    locality,
  );
  const description = getCategoryCityLocalityDescription(
    category.name,
    city,
    locality,
  );
  const url = `${BASE_URL}/category/${category.slug}/${city}/${locality}`;

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

export default async function CategoryCityLocalityPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug, city, locality } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) {
    return (
      <main className="min-h-screen px-4 py-10">
        <h1 className="text-2xl font-semibold mb-4">Category not found</h1>
      </main>
    );
  }

  const locationText = `${locality}, ${city}`;

  const { services } = await searchServices({
    categorySlug: category.slug,
    locationText,
    page: 1,
    limit: 20,
    sort: "-rating",
  });

  const baseUrl = "https://www.imagineeringindia.com";
  const title = getCategoryCityLocalityTitle(category.name, city, locality);

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
        {category.name} in {locality}, {city}
      </h1>
      <p className="text-gray-600 mb-8 max-w-2xl">
        {getCategoryCityLocalityDescription(category.name, city, locality)}
      </p>

      <section>
        <h2 className="text-xl font-semibold mb-3">
          Top {category.name} providers in {locality}
        </h2>
        {services.length === 0 && (
          <p className="text-gray-500">
            No services available in this locality yet.
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
        id={`breadcrumb-category-${category.slug}-${city}-${locality}`}
        items={[
          { name: "Home", item: `${baseUrl}/` },
          {
            name: category.name,
            item: `${baseUrl}/category/${category.slug}`,
          },
          {
            name: `${category.name} in ${city}`,
            item: `${baseUrl}/category/${category.slug}/${city}`,
          },
          {
            name: `${category.name} in ${locality}, ${city}`,
            item: `${baseUrl}/category/${category.slug}/${city}/${locality}`,
          },
        ]}
      />

      <LocalBusinessJsonLd
        id={`localbusiness-${category.slug}-${city}-${locality}`}
        name={title}
        url={`${baseUrl}/category/${category.slug}/${city}/${locality}`}
        city={city}
        locality={locality}
        averageRating={averageRating}
        reviewCount={reviewCount}
      />
    </main>
  );
}


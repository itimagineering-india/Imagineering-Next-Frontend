import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryBySlug, searchServices } from "@/lib/api";
import { BASE_URL } from "@/lib/constants";

type Params = { service: string; city: string };

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { service, city } = await params;
  const category = await getCategoryBySlug(service);
  if (!category) {
    return { robots: { index: false, follow: false } };
  }

  const cityName = city.replace(/-/g, " ");
  const title = `${category.name} in ${cityName} | Imagineering India`;
  const description = `Find verified ${category.name.toLowerCase()} providers in ${cityName}. Compare ratings, prices and book online.`;
  const url = `${BASE_URL}/services/${service}/${city}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { service, city } = await params;
  const category = await getCategoryBySlug(service);
  if (!category) notFound();

  const { services } = await searchServices({
    categorySlug: service,
    locationText: city.replace(/-/g, " "),
    limit: 20,
  });

  const cityName = city.replace(/-/g, " ");

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-4">
        {category.name} in {cityName}
      </h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">
          Why book {category.name.toLowerCase()} in {cityName} with us
        </h2>
        <p className="text-gray-600">
          We connect you with vetted {category.name.toLowerCase()} providers in{" "}
          {cityName}. Compare ratings, prices and availability, then book online
          in minutes.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">
          Top {category.name} in {cityName}
        </h2>
        {services.length === 0 ? (
          <p className="text-gray-600">No providers found in this area yet.</p>
        ) : (
          <ul className="space-y-3">
            {services.map((s) => (
              <li key={s.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <Link href={`/service/${s.slug || s.id}`} className="block">
                  <strong className="text-lg">{s.title}</strong>
                  {s.location?.city && (
                    <span className="text-gray-600 ml-2">– {s.location.city}</span>
                  )}
                  {typeof s.rating === "number" && (
                    <span className="ml-2">
                      ⭐ {s.rating} ({s.reviewCount ?? 0} reviews)
                    </span>
                  )}
                  {s.price != null && (
                    <span className="ml-2 font-medium">
                      ₹{s.price}
                      {s.priceType === "hourly" ? "/hr" : ""}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

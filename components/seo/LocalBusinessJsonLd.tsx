 "use client";

import Script from "next/script";

export function LocalBusinessJsonLd({
  id,
  name,
  url,
  city,
  locality,
  state,
  averageRating,
  reviewCount,
}: {
  id: string;
  name: string;
  url: string;
  city: string;
  locality?: string;
  state?: string;
  averageRating?: number;
  reviewCount?: number;
}) {
  const addressParts = [locality, city, state].filter(Boolean).join(", ");

  const jsonLd: any = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name,
    url,
    address: {
      "@type": "PostalAddress",
      addressLocality: city,
      streetAddress: addressParts || undefined,
      addressRegion: state,
      addressCountry: "IN",
    },
    areaServed: {
      "@type": "City",
      name: city,
    },
  };

  if (averageRating && reviewCount && reviewCount > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: averageRating,
      reviewCount,
    };
  }

  return (
    <Script
      id={id}
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}



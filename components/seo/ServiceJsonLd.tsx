"use client";

import Script from "next/script";

export function ServiceJsonLd({
  id,
  name,
  description,
  url,
  categoryName,
  providerName,
}: {
  id: string;
  name: string;
  description?: string;
  url: string;
  categoryName?: string;
  providerName?: string;
}) {
  const jsonLd: any = {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    url,
    description,
  };

  if (categoryName) {
    jsonLd.serviceType = categoryName;
  }

  if (providerName) {
    jsonLd.provider = {
      "@type": "Organization",
      name: providerName,
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


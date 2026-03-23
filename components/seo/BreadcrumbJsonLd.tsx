 "use client";

import Script from "next/script";

type BreadcrumbItem = {
  name: string;
  item: string;
};

export function BreadcrumbJsonLd({
  id,
  items,
}: {
  id: string;
  items: BreadcrumbItem[];
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: it.name,
      item: it.item,
    })),
  };

  return (
    <Script
      id={id}
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}


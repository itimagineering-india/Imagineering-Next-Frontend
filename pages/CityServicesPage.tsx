"use client";
import { useLayoutEffect } from "react";
import { useParams } from "next/navigation";
import { getCityBySlug } from "@/constants/cities";
import { getCitySeoContent } from "@/constants/citySeoContent";
import NotFound from "@/pages/NotFound";
import Services from "@/pages/Services";

export async function getServerSideProps() { return { props: {} }; }

const SITE_NAME = "Imagineering India";

function setMetaTag(
  attr: "name" | "property",
  attrValue: string,
  content: string
) {
  let el = document.head.querySelector(`meta[${attr}="${attrValue}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export default function CityServicesPage() {
  const params = useParams();
  const citySlug = typeof params?.citySlug === "string" ? params.citySlug : params?.citySlug?.[0];
  const city = citySlug ? getCityBySlug(citySlug) : undefined;
  const seoContent = citySlug ? getCitySeoContent(citySlug) : null;

  useLayoutEffect(() => {
    if (!city) return;
    const title = seoContent?.metaTitle ?? `Contractors & Local Services in ${city.name} | ${SITE_NAME}`;
    const description = seoContent?.metaDescription ?? `Find verified contractors and local services in ${city.name}. Compare quotes, read reviews, and book plumbing, electrical, painting, carpentry, and more. Trusted service providers in ${city.name}.`;
    const keywords = seoContent?.metaKeywords ?? `contractors ${city.name}, local services ${city.name}, service providers ${city.name}, verified contractors, ${city.name} services, Imagineering India`;

    // Update <title>
    document.title = title;

    // Update meta description (primary)
    setMetaTag("name", "description", description);

    // Update meta keywords
    setMetaTag("name", "keywords", keywords);

    // Update meta name="title" (if used)
    setMetaTag("name", "title", title);

    // Update Open Graph
    setMetaTag("property", "og:title", title);
    setMetaTag("property", "og:description", description);

    // Update Twitter
    setMetaTag("name", "twitter:title", title);
    setMetaTag("name", "twitter:description", description);

    // FAQ schema for SEO (when city has FAQ content)
    if (seoContent?.faq?.length) {
      const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: seoContent.faq.map((q) => ({
          "@type": "Question",
          name: q.question,
          acceptedAnswer: { "@type": "Answer", text: q.answer },
        })),
      };
      const schemaId = "city-faq-schema";
      const existing = document.getElementById(schemaId);
      if (existing) existing.remove();
      const script = document.createElement("script");
      script.id = schemaId;
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(faqSchema);
      document.head.appendChild(script);
    }

    return () => {
      document.title = `${SITE_NAME} - Find Verified Service Providers Near You`;
      setMetaTag("name", "description", "Connect with verified service providers for machines, contractors, logistics, and spaces. Get transparent pricing, location-based matches, and real reviews. Trusted service marketplace in India.");
      setMetaTag("name", "keywords", "service providers, contractors, logistics, machine rental, space rental, service marketplace, verified providers, India services, find services near me, service booking");
      setMetaTag("name", "title", "Imagineering India - Find Verified Service Providers Near You");
      setMetaTag("property", "og:title", "Imagineering India - Find Verified Service Providers Near You");
      setMetaTag("property", "og:description", "Connect with verified service providers for machines, contractors, logistics, and spaces. Get transparent pricing, location-based matches, and real reviews.");
      setMetaTag("name", "twitter:title", "Imagineering India - Find Verified Service Providers Near You");
      setMetaTag("name", "twitter:description", "Connect with verified service providers for machines, contractors, logistics, and spaces. Get transparent pricing, location-based matches, and real reviews.");
      const schema = document.getElementById("city-faq-schema");
      if (schema) schema.remove();
    };
  }, [city, seoContent]);

  if (!citySlug || !city) {
    return <NotFound />;
  }

  const cityIntro = seoContent
    ? { title: seoContent.h1, description: seoContent.intro }
    : {
        title: `Local Services in ${city.name}`,
        description: `Find verified contractors and service providers in ${city.name}. Browse by category, compare quotes, and book plumbing, electrical, painting, HVAC, interior design, and more.`,
      };

  return (
    <Services
      fixedLocationText={city.name}
      fixedLat={city.lat}
      fixedLng={city.lng}
      cityIntro={cityIntro}
      seoContent={seoContent}
    />
  );
}

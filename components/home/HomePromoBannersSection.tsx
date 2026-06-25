"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type PromoBanner = {
  id: string;
  href: string;
  image: string;
  alt: string;
  external?: boolean;
};

const IMAGIMITRA_DOWNLOAD_URL =
  "https://play.google.com/store/apps/details?id=com.imagineeringindia.imagimitra";

const PROMO_BANNERS: PromoBanner[] = [
  {
    id: "jobs",
    href: "/jobs",
    image: "https://dwkazjggpovin.cloudfront.net/banners/job+banner.png",
    alt: "Browse jobs on Imagineering India",
  },
  {
    id: "bulk-hire",
    href: "/dashboard/provider/manpower-crew",
    image: "https://dwkazjggpovin.cloudfront.net/banners/1782369550709-nolw38ryhpi.png",
    alt: "Bulk hire labour on Imagineering India",
  },
  {
    id: "imagimitra",
    href: IMAGIMITRA_DOWNLOAD_URL,
    image:
      "https://dwkazjggpovin.cloudfront.net/banners/1782369657484-opx4varjuu.png",
    alt: "Download ImagiMitra provider app",
    external: true,
  },
];

function PromoBannerLink({
  banner,
  children,
}: {
  banner: PromoBanner;
  children: ReactNode;
}) {
  if (banner.external) {
    return (
      <a
        href={banner.href}
        target="_blank"
        rel="noopener noreferrer"
        className="block min-w-0"
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={banner.href} className="block min-w-0">
      {children}
    </Link>
  );
}

export function HomePromoBannersSection() {
  return (
    <section className="relative overflow-hidden py-8 md:py-12">
      <div className="home-shell">
        <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6">
          {PROMO_BANNERS.map((banner) => (
            <PromoBannerLink key={banner.id} banner={banner}>
              <img
                src={banner.image}
                alt={banner.alt}
                className="block h-auto w-full rounded-lg border bg-card object-cover sm:rounded-xl md:rounded-2xl"
                loading="lazy"
              />
            </PromoBannerLink>
          ))}
        </div>
      </div>
    </section>
  );
}

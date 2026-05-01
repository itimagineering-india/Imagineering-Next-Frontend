"use client";

import Link from "next/link";

const LABOUR_BG = "https://dwkazjggpovin.cloudfront.net/banners/bulk%20hire%20banner.png";

export function BulkHireLabourCta() {
  return (
    <section className="relative border-y border-border/80 bg-muted/30 px-4 sm:px-6 md:px-10 lg:px-12">
      <div className="mx-auto w-full max-w-7xl py-8 mobile:py-10 smallTablet:py-12">
        <Link href="/dashboard/provider/manpower-crew" className="block max-w-full">
          <img
            src={LABOUR_BG}
            alt="Bulk hire labour on Imagineering India"
            className="block h-auto w-full max-w-full rounded-2xl border bg-card"
            loading="lazy"
          />
        </Link>
      </div>
    </section>
  );
}


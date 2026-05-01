"use client";

import Link from "next/link";

const LABOUR_BG = "https://dwkazjggpovin.cloudfront.net/banners/bulk%20hire%20banner.png";

export function BulkHireLabourCta() {
  return (
    <section className="relative border-y border-border/80 bg-muted/30">
      <div className="layout-shell py-8 mobile:py-10 smallTablet:py-12">
        <Link href="/dashboard/provider/manpower-crew" className="block">
          <img
            src={LABOUR_BG}
            alt="Bulk hire labour on Imagineering India"
            className="w-full rounded-2xl border bg-card h-auto block"
            loading="lazy"
          />
        </Link>
      </div>
    </section>
  );
}


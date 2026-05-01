"use client";

import Link from "next/link";

const JOB_BANNER_URL = "https://dwkazjggpovin.cloudfront.net/banners/job+banner.png";

export function JobsSection() {
  return (
    <section className="relative py-8 md:py-12 lg:py-12 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <Link href="/jobs" className="block">
          <img
            src={JOB_BANNER_URL}
            alt="Browse jobs on Imagineering India"
            className="w-full rounded-2xl border bg-card h-auto block"
            loading="lazy"
          />
        </Link>
      </div>
    </section>
  );
}


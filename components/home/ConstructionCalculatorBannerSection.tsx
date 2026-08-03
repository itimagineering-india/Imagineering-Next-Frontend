"use client";

import Link from "next/link";

const CALCULATOR_HREF = "/construction-calculator";
const CALCULATOR_BANNER_IMAGE =
  "https://dwkazjggpovin.cloudfront.net/banners/1783670227397-8kotj1f7tm4.png";

export function ConstructionCalculatorBannerSection() {
  return (
    <section className="relative py-4 md:py-6" aria-label="Construction cost calculator">
      <div className="home-shell">
        <Link
          href={CALCULATOR_HREF}
          className="group block w-full overflow-hidden rounded-xl md:rounded-2xl border border-slate-200/80 bg-card shadow-sm transition hover:shadow-md"
        >
          <img
            src={CALCULATOR_BANNER_IMAGE}
            alt="Construction cost calculator — estimate materials, labour and BOQ on Imagineering India"
            className="block h-auto w-full object-contain transition duration-300 group-hover:opacity-95"
            loading="lazy"
          />
        </Link>
      </div>
    </section>
  );
}

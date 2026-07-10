"use client";

import Link from "next/link";

const CALCULATOR_HREF = "/construction-calculator";
const CALCULATOR_BANNER_IMAGE =
  "https://dwkazjggpovin.cloudfront.net/banners/1783670227397-8kotj1f7tm4.png";

export function ConstructionCalculatorBannerSection() {
  return (
    <section className="w-full" aria-label="Construction cost calculator">
      <Link href={CALCULATOR_HREF} className="group block w-full">
        <img
          src={CALCULATOR_BANNER_IMAGE}
          alt="Construction cost calculator — estimate materials, labour and BOQ on Imagineering India"
          className="block h-auto w-full object-cover"
          loading="lazy"
        />
      </Link>
    </section>
  );
}

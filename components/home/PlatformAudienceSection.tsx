"use client";

import Link from "next/link";

const USER_BANNER =
  "https://dwkazjggpovin.cloudfront.net/banners/ChatGPT Image Mar 16, 2026, 06_28_56 PM.png";
const PROVIDER_BANNER =
  "https://dwkazjggpovin.cloudfront.net/banners/bulk%20hire%20banner.png";
const USER_APP_DOWNLOAD_URL = "https://play.google.com/store/apps/details?id=com.servicespheremobile";
const PROVIDER_APP_DOWNLOAD_URL = "https://play.google.com/store/apps/details?id=com.imagineeringindia.imagimitra";

export function PlatformAudienceSection() {
  return (
    <section className="border-y border-border/80 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:px-8 md:py-14">
        <div className="mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold">
            Find Services or Grow Your Business
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl text-sm sm:text-base">
            Choose the experience that fits your goal: hire trusted professionals with
            Imagineering India or grow as a provider with Imagimitra.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
            <img
              src={USER_BANNER}
              alt="Imagineering India for users"
              className="h-44 w-full object-cover"
              loading="lazy"
            />
            <div className="p-6 sm:p-7 space-y-4">
              <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                For Users
              </p>
              <h3 className="text-2xl font-bold">Imagineering India</h3>
              <p className="text-sm text-muted-foreground">
                Find verified services near you in minutes.
              </p>
              <ul className="space-y-2 text-sm text-foreground/90">
                <li>Verified providers for every major category</li>
                <li>Trusted services with clear ratings and reviews</li>
                <li>Fast booking with quick response options</li>
              </ul>
              <div className="pt-1 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/services"
                  className="inline-flex items-center justify-center w-full sm:w-auto rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  Explore Services
                </Link>
                <a
                  href={USER_APP_DOWNLOAD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full sm:w-auto rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
                >
                  Download App (Play Store)
                </a>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
            <img
              src={PROVIDER_BANNER}
              alt="Imagimitra for providers"
              className="h-44 w-full object-cover"
              loading="lazy"
            />
            <div className="p-6 sm:p-7 space-y-4">
              <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                For Providers
              </p>
              <h3 className="text-2xl font-bold">Imagimitra</h3>
              <p className="text-sm text-muted-foreground">
                Get more work and manage your provider growth in one app.
              </p>
              <ul className="space-y-2 text-sm text-foreground/90">
                <li>Verified provider profile for trust and visibility</li>
                <li>Smart lead and booking management tools</li>
                <li>Faster customer response and conversion flow</li>
              </ul>
              <div className="pt-1 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/signup?role=provider"
                  className="inline-flex items-center justify-center w-full sm:w-auto rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  Join as Provider
                </Link>
                <a
                  href={PROVIDER_APP_DOWNLOAD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full sm:w-auto rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
                >
                  Download App (Play Store)
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

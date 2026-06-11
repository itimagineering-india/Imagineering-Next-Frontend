"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

const USER_BANNER =
  "https://dwkazjggpovin.cloudfront.net/banners/ChatGPT Image Mar 16, 2026, 06_28_56 PM.png";
const PROVIDER_BANNER =
  "https://dwkazjggpovin.cloudfront.net/banners/bulk%20hire%20banner.png";
const USER_APP_DOWNLOAD_URL = "https://play.google.com/store/apps/details?id=com.servicespheremobile";
const PROVIDER_APP_DOWNLOAD_URL = "https://play.google.com/store/apps/details?id=com.imagineeringindia.imagimitra";

export function PlatformAudienceSection() {
  const { t } = useTranslation("home");
  const userBenefits = t("audience.usersBenefits", { returnObjects: true }) as string[];
  const providerBenefits = t("audience.providersBenefits", { returnObjects: true }) as string[];

  return (
    <section className="border-y border-border/80 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:px-8 md:py-16">
        <div className="mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold">
            {t("audience.heading")}
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl text-sm sm:text-base">
            {t("audience.description")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
            <img
              src={USER_BANNER}
              alt="Imagineering India for users"
              className="w-full h-auto max-h-56 object-contain bg-muted/30"
              loading="lazy"
            />
            <div className="p-6 sm:p-8 space-y-4">
              <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                {t("audience.usersLabel")}
              </p>
              <h3 className="text-2xl font-bold">{t("audience.usersTitle")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("audience.usersDescription")}
              </p>
              <ul className="space-y-2 text-sm text-foreground/90">
                {userBenefits.map((benefit) => (
                  <li key={benefit}>{benefit}</li>
                ))}
              </ul>
              <div className="pt-1 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/services"
                  className="inline-flex items-center justify-center w-full sm:w-auto rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  {t("audience.exploreServices")}
                </Link>
                <a
                  href={USER_APP_DOWNLOAD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full sm:w-auto rounded-lg border border-border px-6 py-3 text-sm font-medium hover:bg-accent transition-colors"
                >
                  {t("audience.downloadApp")}
                </a>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
            <img
              src={PROVIDER_BANNER}
              alt="Imagimitra for providers"
              className="w-full h-auto max-h-56 object-contain bg-muted/30"
              loading="lazy"
            />
            <div className="p-6 sm:p-8 space-y-4">
              <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                {t("audience.providersLabel")}
              </p>
              <h3 className="text-2xl font-bold">{t("audience.providersTitle")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("audience.providersDescription")}
              </p>
              <ul className="space-y-2 text-sm text-foreground/90">
                {providerBenefits.map((benefit) => (
                  <li key={benefit}>{benefit}</li>
                ))}
              </ul>
              <div className="pt-1 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/signup?role=provider"
                  className="inline-flex items-center justify-center w-full sm:w-auto rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  {t("audience.joinProvider")}
                </Link>
                <a
                  href={PROVIDER_APP_DOWNLOAD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full sm:w-auto rounded-lg border border-border px-6 py-3 text-sm font-medium hover:bg-accent transition-colors"
                >
                  {t("audience.downloadApp")}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

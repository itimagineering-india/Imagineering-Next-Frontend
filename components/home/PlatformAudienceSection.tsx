"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CalendarCheck,
  IndianRupee,
  ShieldCheck,
  Star,
  Target,
  Zap,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const USER_BANNER =
  "https://dwkazjggpovin.cloudfront.net/banners/Screenshot%202026-04-22%20at%205.32.21%E2%80%AFPM.png";
const PROVIDER_BANNER =
  "https://dwkazjggpovin.cloudfront.net/banners/Screenshot%202026-04-22%20at%205.32.54%E2%80%AFPM.png";
const USER_APP_DOWNLOAD_URL = "https://play.google.com/store/apps/details?id=com.servicespheremobile";
const PROVIDER_APP_DOWNLOAD_URL = "https://play.google.com/store/apps/details?id=com.imagineeringindia.imagimitra";

const USER_BENEFIT_ICONS = [ShieldCheck, Star, Zap] as const;
const PROVIDER_BENEFIT_ICONS = [Target, IndianRupee, CalendarCheck] as const;

function asStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function PlayStoreIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M4.05 2.3c-.38.2-.63.6-.63 1.04v17.32c0 .44.25.84.63 1.04l9.72-9.7L4.05 2.3Zm11.17 6.45L5.3 2.74l10.4 6.02-1.48-.01Zm2.38 1.38 2.55 1.47c.9.52.9 1.82 0 2.34l-2.58 1.5-2.18-2.12 2.21-2.19ZM5.3 21.26l9.9-6.01 1.5-.02-11.4 6.03Z"
      />
    </svg>
  );
}

function FeatureTags({
  items,
  icons,
}: {
  items: string[];
  icons: readonly LucideIcon[];
}) {
  if (items.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item, index) => {
        const Icon = icons[index] ?? ShieldCheck;
        return (
          <li
            key={item}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
          >
            <Icon className="h-3 w-3 text-slate-700" strokeWidth={2.25} aria-hidden />
            {item}
          </li>
        );
      })}
    </ul>
  );
}

function DevicePreview({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="mt-6 w-full">
      <div className="rounded-[1.25rem] bg-slate-900 p-1.5 shadow-md">
        <div className="overflow-hidden rounded-[0.95rem] bg-white">
          <img
            src={src}
            alt={alt}
            width={1631}
            height={813}
            decoding="async"
            loading="lazy"
            className="block h-auto w-full object-contain [transform:translateZ(0)]"
          />
        </div>
      </div>
    </div>
  );
}

function PathCtas({
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
}) {
  return (
    <div className="mt-auto flex flex-col gap-2.5 pt-6 sm:flex-row sm:items-center">
      <Link
        href={primaryHref}
        className="inline-flex h-11 min-h-11 items-center justify-center gap-1.5 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {primaryLabel}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
      <a
        href={secondaryHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-11 min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-foreground"
      >
        <PlayStoreIcon className="h-4 w-4" />
        {secondaryLabel}
      </a>
    </div>
  );
}

function AudiencePath({
  eyebrow,
  title,
  description,
  benefits,
  icons,
  imageSrc,
  imageAlt,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  eyebrow: string;
  title: string;
  description: string;
  benefits: string[];
  icons: readonly LucideIcon[];
  imageSrc: string;
  imageAlt: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
}) {
  return (
    <article
      className={cn(
        "group flex h-full flex-col rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50 to-white p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(15,23,42,0.04)] sm:p-6",
        "transition-shadow duration-300 hover:shadow-xl"
      )}
    >
      <span className="inline-flex w-fit rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {eyebrow}
      </span>
      <h3 className="mt-3 text-xl font-semibold leading-snug tracking-tight text-slate-900 sm:text-[1.35rem]">
        {title}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
        {description}
      </p>

      <DevicePreview src={imageSrc} alt={imageAlt} />

      <div className="mt-6">
        <FeatureTags items={benefits} icons={icons} />
      </div>
      <PathCtas
        primaryHref={primaryHref}
        primaryLabel={primaryLabel}
        secondaryHref={secondaryHref}
        secondaryLabel={secondaryLabel}
      />
    </article>
  );
}

export function PlatformAudienceSection() {
  const { t } = useTranslation("home");
  const userBenefits = asStringList(t("audience.usersBenefits", { returnObjects: true }));
  const providerBenefits = asStringList(t("audience.providersBenefits", { returnObjects: true }));

  return (
    <section className="border-y border-border bg-background">
      <div className="home-shell py-8 md:py-11">
        <header className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
            {t("audience.heading")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            {t("audience.description")}
          </p>
        </header>

        <div className="mt-7 grid grid-cols-1 gap-5 md:mt-8 md:grid-cols-2 md:gap-6">
          <AudiencePath
            eyebrow={t("audience.usersLabel")}
            title={t("audience.usersTitle")}
            description={t("audience.usersDescription")}
            benefits={userBenefits}
            icons={USER_BENEFIT_ICONS}
            imageSrc={USER_BANNER}
            imageAlt="Imagineering India for users"
            primaryHref="/services"
            primaryLabel={t("audience.exploreServices")}
            secondaryHref={USER_APP_DOWNLOAD_URL}
            secondaryLabel={t("audience.getTheApp")}
          />
          <AudiencePath
            eyebrow={t("audience.providersLabel")}
            title={t("audience.providersTitle")}
            description={t("audience.providersDescription")}
            benefits={providerBenefits}
            icons={PROVIDER_BENEFIT_ICONS}
            imageSrc={PROVIDER_BANNER}
            imageAlt="Imagimitra for providers"
            primaryHref="/join-provider"
            primaryLabel={t("audience.joinProvider")}
            secondaryHref={PROVIDER_APP_DOWNLOAD_URL}
            secondaryLabel={t("audience.downloadApp")}
          />
        </div>
      </div>
    </section>
  );
}

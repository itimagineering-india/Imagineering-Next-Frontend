"use client";

import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  MapPin,
  MessageSquareQuote,
  Search,
  Star,
  Truck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import cementBag from "@/assets/services/constructionMaterial/cementBag.png";
import steel from "@/assets/services/constructionMaterial/steel.png";
import bricks from "@/assets/services/constructionMaterial/bricks.png";

function StepConnector() {
  return (
    <div
      className="pointer-events-none absolute left-full top-[6.75rem] z-10 hidden w-5 -translate-x-1/2 items-center justify-center lg:flex"
      aria-hidden
    >
      <span className="h-px w-full border-t border-dashed border-orange-300" />
      <span className="absolute flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm">
        <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
      </span>
    </div>
  );
}

function PreviewBrowse() {
  const { t } = useTranslation("materials");
  return (
    <div className="mt-auto rounded-xl border border-orange-100 bg-gradient-to-b from-orange-50/80 to-white p-2.5">
      <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 shadow-sm">
        <Search className="h-3 w-3 shrink-0 text-slate-400" />
        <span className="min-w-0 flex-1 truncate text-[10px] text-slate-400">
          {t("howPreviewSearch")}
        </span>
        <span className="rounded-md bg-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
          {t("search")}
        </span>
      </div>
      <div className="mt-2 flex justify-center gap-1.5">
        {[
          { src: cementBag, alt: "Cement" },
          { src: bricks, alt: "Bricks" },
          { src: steel, alt: "Steel" },
        ].map((item) => (
          <span
            key={item.alt}
            className="relative h-11 w-[30%] overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-100"
          >
            <Image src={item.src} alt={item.alt} fill className="object-contain p-1" sizes="56px" />
          </span>
        ))}
      </div>
    </div>
  );
}

function PreviewProduct() {
  const { t } = useTranslation("materials");
  return (
    <div className="mt-auto rounded-xl border border-orange-100 bg-gradient-to-b from-orange-50/80 to-white p-2.5">
      <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex gap-2">
          <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-slate-50">
            <Image src={cementBag} alt="" fill className="object-contain p-1" sizes="44px" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-bold text-slate-800">{t("howPreviewProduct")}</p>
            <p className="mt-0.5 text-[9px] text-slate-400">{t("howPreviewIndicative")}</p>
            <span className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-500">
              <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
              4.8
            </span>
          </div>
        </div>
        <div className="mt-2 flex h-8 items-center justify-center gap-1 rounded-lg bg-[hsl(var(--red-accent))] text-[10px] font-extrabold text-white">
          <MessageSquareQuote className="h-3 w-3" />
          {t("getBestQuotes")}
        </div>
      </div>
    </div>
  );
}

function PreviewQuotes() {
  const { t } = useTranslation("materials");
  const quotes = [
    { key: "howPreviewQuote1", price: "₹19,800", best: true },
    { key: "howPreviewQuote2", price: "₹21,400", best: false },
    { key: "howPreviewQuote3", price: "₹22,100", best: false },
  ] as const;
  return (
    <div className="mt-auto rounded-xl border border-orange-100 bg-gradient-to-b from-orange-50/80 to-white p-2.5">
      <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
        <p className="text-[9px] font-bold uppercase tracking-wide text-orange-600">
          {t("howPreviewQuotesTitle")}
        </p>
        <div className="mt-1.5 space-y-1">
          {quotes.map((q) => (
            <div
              key={q.key}
              className={`flex items-center justify-between gap-1 rounded-md px-1.5 py-1 text-[10px] ${
                q.best ? "bg-orange-50 ring-1 ring-orange-200" : "bg-slate-50"
              }`}
            >
              <span className="truncate font-medium text-slate-600">{t(q.key)}</span>
              <span className="shrink-0 font-extrabold tabular-nums text-slate-900">{q.price}</span>
            </div>
          ))}
        </div>
        <p className="mt-1.5 text-center text-[9px] font-semibold text-emerald-600">
          {t("howPreviewPickBest")}
        </p>
      </div>
    </div>
  );
}

function PreviewDeliver() {
  const { t } = useTranslation("materials");
  return (
    <div className="mt-auto rounded-xl border border-orange-100 bg-gradient-to-b from-orange-50/80 to-white p-2.5">
      <div className="relative overflow-hidden rounded-lg bg-[linear-gradient(160deg,#fff7ed,#ffedd5)] px-2.5 pb-2.5 pt-2">
        <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm">
          <MapPin className="h-3 w-3" strokeWidth={2.5} />
        </span>
        <div className="mb-2 h-7 rounded-t-md bg-slate-700/85">
          <div className="mx-auto mt-1.5 h-2.5 w-1/2 rounded-sm bg-slate-500/70" />
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-10 items-center justify-center rounded-md bg-white shadow-sm ring-1 ring-orange-100">
            <Truck className="h-4 w-4 text-orange-500" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-bold text-slate-800">{t("howPreviewDeliver")}</p>
            <p className="truncate text-[9px] text-slate-500">{t("howPreviewDeliverSub")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const STEPS = [
  { icon: Search, title: "howStep1Title", body: "howStep1Body", Preview: PreviewBrowse },
  { icon: ClipboardList, title: "howStep2Title", body: "howStep2Body", Preview: PreviewProduct },
  {
    icon: MessageSquareQuote,
    title: "howStep3Title",
    body: "howStep3Body",
    Preview: PreviewQuotes,
  },
  { icon: Truck, title: "howStep4Title", body: "howStep4Body", Preview: PreviewDeliver },
] as const;

export function MaterialsHowToBook() {
  const { t } = useTranslation("materials");

  return (
    <section className="relative overflow-hidden rounded-3xl border border-orange-100/80 bg-[linear-gradient(165deg,#fffdfb_0%,#fff7f0_50%,#ffffff_100%)] px-4 py-6 shadow-[0_16px_40px_-28px_rgba(194,65,12,0.4)] sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute -left-12 top-0 h-36 w-36 rounded-full bg-orange-200/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-8 bottom-0 h-40 w-40 rounded-full bg-[hsl(var(--red-accent))]/10 blur-3xl" />

      <div className="relative mb-6 flex items-start gap-3 sm:mb-7">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/25">
          <BookOpen className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-orange-600">
            {t("howToBookEyebrow")}
          </p>
          <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900 md:text-2xl">
            {t("howToBook")}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-slate-500">{t("howToBookSub")}</p>
        </div>
      </div>

      <ol className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        {STEPS.map((step, index) => (
          <li key={step.title} className="relative flex">
            {index < STEPS.length - 1 ? <StepConnector /> : null}
            <article className="group flex w-full flex-col rounded-2xl border border-white/90 bg-white/90 p-4 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.4)] backdrop-blur-sm transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_36px_-18px_rgba(234,88,12,0.4)]">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-orange-500">
                {t("howStepLabel", { n: index + 1 })}
              </p>
              <span className="mt-2.5 flex h-11 w-11 items-center justify-center rounded-full border-2 border-orange-200 bg-orange-50 text-orange-600 transition group-hover:border-orange-400 group-hover:bg-orange-500 group-hover:text-white">
                <step.icon className="h-[18px] w-[18px]" strokeWidth={2.1} />
              </span>
              <h3 className="mt-3 text-[15px] font-extrabold leading-snug text-slate-900">
                {t(step.title)}
              </h3>
              <p className="mt-1.5 mb-3 min-h-[2.5rem] text-xs leading-relaxed text-slate-500">
                {t(step.body)}
              </p>
              <step.Preview />
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}

"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { ManpowerHireMode } from "@/lib/manpower/manpowerHubCatalog";
import { MANPOWER_TEAL } from "@/components/manpower/ManpowerHireModeTabs";

const HOURLY_KEYS = [
  "termsHourly1",
  "termsHourly2",
  "termsHourly3",
  "termsHourly4",
  "termsHourly5",
  "termsHourly6",
  "termsHourly7",
  "termsHourly8",
] as const;

const DAILY_KEYS = [
  "termsDaily1",
  "termsDaily2",
  "termsDaily3",
  "termsDaily4",
  "termsDaily5",
  "termsDaily6",
  "termsDaily7",
  "termsDaily8",
  "termsDaily9",
] as const;

const SPECIFIC_KEYS = [
  "termsSpecific1",
  "termsSpecific2",
  "termsSpecific3",
  "termsSpecific4",
  "termsSpecific5",
  "termsSpecific6",
  "termsSpecific7",
  "termsSpecific8",
] as const;

const COMMON_KEYS = [
  "termsCommon1",
  "termsCommon2",
  "termsCommon3",
  "termsCommon4",
  "termsCommon5",
] as const;

type Props = {
  hireMode: ManpowerHireMode;
  /** When true, omit outer card chrome (used inside accordion). */
  embedded?: boolean;
};

export function ManpowerTermsSection({ hireMode, embedded = false }: Props) {
  const { t } = useTranslation("manpower");

  const modeKeys = useMemo(() => {
    if (hireMode === "one_day") return DAILY_KEYS;
    if (hireMode === "specific_work") return SPECIFIC_KEYS;
    return HOURLY_KEYS;
  }, [hireMode]);

  const modeHeading =
    hireMode === "one_day"
      ? "termsDailyHeading"
      : hireMode === "specific_work"
        ? "termsSpecificHeading"
        : "termsHourlyHeading";

  const body = (
    <>
      {!embedded ? (
        <h2 className="text-base font-extrabold text-slate-900">{t("termsTitle")}</h2>
      ) : null}
      <p className={embedded ? "text-sm leading-relaxed text-slate-600" : "mt-2 text-sm leading-relaxed text-slate-600"}>
        {t("termsIntro")}
      </p>

      <h3 className="mt-4 text-sm font-extrabold" style={{ color: MANPOWER_TEAL }}>
        {t(modeHeading)}
      </h3>
      <ul className="mt-2 space-y-2">
        {modeKeys.map((key) => (
          <li key={key} className="flex gap-2 text-sm leading-relaxed text-slate-600">
            <span className="mt-0.5 font-bold" style={{ color: MANPOWER_TEAL }}>
              •
            </span>
            <span>{t(key)}</span>
          </li>
        ))}
      </ul>

      <h3 className="mt-5 text-sm font-extrabold" style={{ color: MANPOWER_TEAL }}>
        {t("termsCommonHeading")}
      </h3>
      <ul className="mt-2 space-y-2">
        {COMMON_KEYS.map((key) => (
          <li key={key} className="flex gap-2 text-sm leading-relaxed text-slate-600">
            <span className="mt-0.5 font-bold" style={{ color: MANPOWER_TEAL }}>
              •
            </span>
            <span>{t(key)}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs italic leading-relaxed text-slate-500">{t("termsFooter")}</p>
    </>
  );

  if (embedded) return <div className="pb-2">{body}</div>;

  return (
    <section className="rounded-2xl border border-teal-800/15 bg-white p-4 sm:p-5">{body}</section>
  );
}

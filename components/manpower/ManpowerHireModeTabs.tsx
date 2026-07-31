"use client";

import { cn } from "@/lib/utils";
import type { ManpowerHireMode } from "@/lib/manpower/manpowerHubCatalog";
import { useTranslation } from "react-i18next";

export const MANPOWER_TEAL = "#0F766E";
export const MANPOWER_CANVAS = "#F7FAF9";

const TABS: { id: ManpowerHireMode; labelKey: string }[] = [
  { id: "custom_duration", labelKey: "tabHourly" },
  { id: "one_day", labelKey: "tabDaily" },
  { id: "specific_work", labelKey: "tabSpecific" },
];

type Props = {
  selected: ManpowerHireMode;
  onSelect: (mode: ManpowerHireMode) => void;
};

export function ManpowerHireModeTabs({ selected, onSelect }: Props) {
  const { t } = useTranslation("manpower");

  return (
    <div
      className="grid grid-cols-3 gap-1 rounded-2xl p-1.5"
      style={{ backgroundColor: MANPOWER_TEAL }}
      role="tablist"
      aria-label="Hire mode"
    >
      {TABS.map((tab) => {
        const active = selected === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(tab.id)}
            className={cn(
              "rounded-xl px-2 py-3 text-center text-sm font-semibold transition sm:text-[15px]",
              active
                ? "bg-white text-teal-900 shadow-sm"
                : "text-white/90 hover:bg-white/10"
            )}
          >
            {t(tab.labelKey)}
          </button>
        );
      })}
    </div>
  );
}

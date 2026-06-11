"use client";

import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import i18n, { SUPPORTED_LANGS, type SupportedLangCode } from "@/i18n";
import { cn } from "@/lib/utils";

type LanguageSwitcherProps = {
  className?: string;
  compact?: boolean;
};

export function LanguageSwitcher({ className, compact = false }: LanguageSwitcherProps) {
  const { t } = useTranslation("common");
  const currentLanguage = SUPPORTED_LANGS.some((lang) => lang.code === i18n.language)
    ? (i18n.language as SupportedLangCode)
    : "en";

  return (
    <label
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground shadow-sm",
        compact && "w-full justify-between rounded-xl px-3 py-2",
        className
      )}
    >
      <span className="inline-flex items-center gap-1.5">
        <Languages className="h-4 w-4 text-muted-foreground" />
        {!compact && <span className="sr-only">{t("language")}</span>}
        {compact && <span>{t("language")}</span>}
      </span>
      <select
        aria-label={t("language")}
        value={currentLanguage}
        onChange={(event) => {
          void i18n.changeLanguage(event.target.value as SupportedLangCode);
        }}
        className="bg-transparent text-sm outline-none"
      >
        {SUPPORTED_LANGS.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </label>
  );
}

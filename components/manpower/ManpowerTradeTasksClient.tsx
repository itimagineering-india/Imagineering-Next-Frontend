"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MANPOWER_CANVAS, MANPOWER_TEAL } from "@/components/manpower/ManpowerHireModeTabs";
import { fetchManpowerSpecificWorksForTrade } from "@/lib/manpower/manpowerHubApi";
import type { ManpowerSpecificWorkItem } from "@/lib/manpower/manpowerHubCatalog";
import { getManpowerTradeArtUrl } from "@/lib/manpower/manpowerTradeArt";
import { resolveManpowerTradeKey } from "@/lib/manpower/manpowerHubCatalog";

type Props = {
  tradeKey: string;
};

export function ManpowerTradeTasksClient({ tradeKey }: Props) {
  const { t } = useTranslation("manpower");
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<ManpowerSpecificWorkItem[]>([]);

  const key = useMemo(
    () => resolveManpowerTradeKey(tradeKey) || tradeKey,
    [tradeKey]
  );
  const displayName = useMemo(() => {
    const fromTask = tasks[0]?.tradeLabel;
    if (fromTask) return fromTask;
    return key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }, [key, tasks]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await fetchManpowerSpecificWorksForTrade(key, displayName);
        if (!cancelled) setTasks(list);
      } catch {
        if (!cancelled) setTasks([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [displayName, key]);

  const art = getManpowerTradeArtUrl(key) || getManpowerTradeArtUrl(displayName);

  return (
    <div className="min-h-screen" style={{ backgroundColor: MANPOWER_CANVAS }}>
      <div className="layout-shell py-6 sm:py-10">
        <Link
          href="/manpower"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-800 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToHub")}
        </Link>

        <div className="mt-5 flex items-center gap-4">
          <div
            className="relative h-16 w-16 overflow-hidden rounded-2xl"
            style={{ backgroundColor: "#D1FAE5" }}
          >
            {art ? (
              <Image src={art} alt={displayName} fill className="object-contain p-1.5" sizes="64px" />
            ) : null}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {t("tasksFor", { name: displayName })}
            </h1>
            <p className="text-sm text-slate-500">{t("tasksCount", { count: tasks.length })}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t("loading")}
          </div>
        ) : tasks.length === 0 ? (
          <p className="py-16 text-sm text-slate-500">{t("emptyTasks")}</p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {tasks.map((item) => {
              const href = item.catalogProductId
                ? `/manpower/product/${item.catalogProductId}?hireMode=specific_work&tradeId=${encodeURIComponent(item.tradeId || key)}&tradeName=${encodeURIComponent(item.name)}`
                : "#";
              return (
                <Link
                  key={item.catalogProductId || item.id}
                  href={href}
                  className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-teal-700/30 hover:shadow-md"
                >
                  <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-slate-100">
                    {item.imageUri ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUri}
                        alt={item.name}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : art ? (
                      <Image
                        src={art}
                        alt=""
                        fill
                        className="object-contain p-4 opacity-40"
                        sizes="200px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-400">
                        Task
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <p className="line-clamp-2 text-sm font-semibold text-slate-900">{item.name}</p>
                    {item.priceLabel ? (
                      <p className="mt-auto text-xs font-semibold" style={{ color: MANPOWER_TEAL }}>
                        {item.priceLabel}
                      </p>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

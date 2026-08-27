"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  rentalMachineHref,
  resolveRentalCategoryKey,
  type RentalMachine,
} from "@/lib/machineRental/machineRentalHubCatalog";
import { fetchRentalMachinesByCategory } from "@/lib/machineRental/machineRentalHubApi";

type Props = {
  typeKey: string;
};

export function MachineRentalCategoryClient({ typeKey }: Props) {
  const { t } = useTranslation("machineRental");
  const router = useRouter();
  const { toast } = useToast();
  const key = resolveRentalCategoryKey(typeKey) || typeKey;
  const title = key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const [loading, setLoading] = useState(true);
  const [machines, setMachines] = useState<RentalMachine[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const rows = await fetchRentalMachinesByCategory(key);
        if (!cancelled) setMachines(rows);
      } catch {
        if (!cancelled) {
          toast({
            title: t("loadErrorTitle"),
            description: t("loadErrorBody"),
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key, t, toast]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return machines;
    return machines.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.categoryName || "").toLowerCase().includes(q)
    );
  }, [machines, query]);

  const submitSearch = useCallback(() => {
    const q = query.trim();
    const sp = new URLSearchParams();
    sp.set("category", "machine-rental");
    sp.set("subcategory", key);
    if (q) sp.set("q", q);
    router.push(`/services?${sp.toString()}`);
  }, [key, query, router]);

  return (
    <div className="min-h-screen bg-[#FFF7ED]">
      <div className="layout-shell py-6 pb-16">
        <Link
          href="/machine-rental"
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-800 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToHub")}
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("categoryPageSub")}</p>

        <form
          className="mt-5 flex max-w-xl flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            submitSearch();
          }}
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("categorySearchPlaceholder", { type: title })}
              aria-label={t("heroSearchAria")}
              className="h-11 rounded-xl border-slate-200 bg-white pl-10"
            />
          </div>
          <Button type="submit" className="h-11 rounded-xl bg-orange-700 hover:bg-orange-800">
            {t("heroSearchCta")}
          </Button>
        </form>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t("loading")}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-orange-200/80 bg-white px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-700">{t("emptyCategory", { type: title })}</p>
            <Button asChild className="mt-4 rounded-xl bg-orange-700 hover:bg-orange-800">
              <Link href="/requirement/submit">{t("comingSoonCta")}</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filtered.map((machine) => {
              const href = rentalMachineHref(machine);
              return (
                <Link
                  key={machine.serviceId || machine.id}
                  href={href}
                  className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-orange-700/30 hover:shadow-md"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-orange-50">
                    {machine.imageUri ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={machine.imageUri}
                        alt={machine.name}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-orange-700/70">
                        {machine.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <p className="line-clamp-2 text-sm font-semibold text-slate-900">{machine.name}</p>
                    {machine.priceLabel ? (
                      <p className="mt-auto text-xs font-semibold text-orange-800">{machine.priceLabel}</p>
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

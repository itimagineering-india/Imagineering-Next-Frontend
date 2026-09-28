"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  RESALE_CANVAS,
  RESALE_TEAL,
  resaleMachineHref,
  resolveResaleCategoryKey,
  type ResaleMachine,
} from "@/lib/machineResale/machineResaleHubCatalog";
import { fetchResaleMachinesPage } from "@/lib/machineResale/machineResaleHubApi";

type Props = {
  typeKey: string;
};

export function MachineResaleCategoryClient({ typeKey }: Props) {
  const { t } = useTranslation("machineResale");
  const router = useRouter();
  const { toast } = useToast();
  const key = resolveResaleCategoryKey(typeKey) || typeKey;
  const title = key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [machines, setMachines] = useState<ResaleMachine[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [query, setQuery] = useState("");
  const requestSeqRef = useRef(0);
  const loadMoreLockRef = useRef(false);
  const loadMoreRef = useRef<() => void>(() => {});
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(
    async (opts?: { page?: number; append?: boolean }) => {
      const nextPage = Math.max(1, opts?.page ?? 1);
      const append = Boolean(opts?.append) && nextPage > 1;
      if (append) setLoadingMore(true);
      else setLoading(true);
      const seq = ++requestSeqRef.current;
      try {
        const result = await fetchResaleMachinesPage({
          categoryId: key,
          page: nextPage,
          limit: 20,
        });
        if (seq !== requestSeqRef.current) return;
        setPage(result.page);
        setHasMore(result.page < result.pages && result.machines.length > 0);
        setMachines((prev) => {
          if (!append) return result.machines;
          const seen = new Set(prev.map((m) => m.serviceId || m.id));
          const extra = result.machines.filter((m) => {
            const id = m.serviceId || m.id;
            return id && !seen.has(id);
          });
          return extra.length ? [...prev, ...extra] : prev;
        });
      } catch {
        if (seq !== requestSeqRef.current) return;
        if (!append) {
          setMachines([]);
          setHasMore(false);
          toast({
            title: t("loadErrorTitle"),
            description: t("loadErrorBody"),
            variant: "destructive",
          });
        }
      } finally {
        if (seq === requestSeqRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [key, t, toast]
  );

  useEffect(() => {
    void load({ page: 1 });
  }, [load]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    if (loadMoreLockRef.current) return;
    loadMoreLockRef.current = true;
    void load({ page: page + 1, append: true }).finally(() => {
      window.setTimeout(() => {
        loadMoreLockRef.current = false;
      }, 300);
    });
  }, [hasMore, load, loading, loadingMore, page]);

  loadMoreRef.current = loadMore;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        loadMoreRef.current();
      },
      { rootMargin: "240px", threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, machines.length]);

  const filtered = useMemo(() => {
    const pool = machines.filter((m) => m.available !== false);
    const q = query.trim().toLowerCase();
    if (!q) return pool;
    return pool.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.categoryName || "").toLowerCase().includes(q)
    );
  }, [machines, query]);

  const submitSearch = useCallback(() => {
    const q = query.trim();
    const sp = new URLSearchParams();
    sp.set("category", "machine-resale");
    sp.set("subcategory", key);
    if (q) sp.set("q", q);
    router.push(`/services?${sp.toString()}`);
  }, [key, query, router]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: RESALE_CANVAS }}>
      <div className="layout-shell py-6 pb-16">
        <Link
          href="/machine-resale"
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-800 hover:underline"
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
          <Button
            type="submit"
            className="h-11 rounded-xl text-white hover:opacity-95"
            style={{ backgroundColor: RESALE_TEAL }}
          >
            {t("heroSearchCta")}
          </Button>
        </form>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t("loading")}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-teal-200/80 bg-white px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-700">{t("emptyCategory", { type: title })}</p>
            <Button
              asChild
              className="mt-4 rounded-xl text-white hover:opacity-95"
              style={{ backgroundColor: RESALE_TEAL }}
            >
              <Link href="/requirement/submit">{t("comingSoonCta")}</Link>
            </Button>
          </div>
        ) : (
          <>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filtered.map((machine) => {
              const href = resaleMachineHref(machine);
              return (
                <Link
                  key={machine.serviceId || machine.id}
                  href={href}
                  className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-teal-700/30 hover:shadow-md"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-teal-50">
                    {machine.imageUri ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={machine.imageUri}
                        alt={machine.name}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-teal-800/70">
                        {machine.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <p className="line-clamp-2 text-sm font-semibold text-slate-900">{machine.name}</p>
                    {machine.priceLabel ? (
                      <p className="mt-auto text-xs font-semibold text-teal-900">{machine.priceLabel}</p>
                    ) : null}
                    {machine.city ? (
                      <p className="truncate text-xs text-slate-500">{machine.city}</p>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
          <div ref={sentinelRef} className="h-8" />
          {loadingMore ? (
            <div className="flex items-center justify-center gap-2 py-6 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : null}
          </>
        )}
      </div>
    </div>
  );
}

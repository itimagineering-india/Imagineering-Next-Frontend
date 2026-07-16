"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api-client";
import { CatalogProductsPage } from "@/components/services/catalog/CatalogProductsPage";
import { isConstructionMaterialsCategorySlug } from "@/lib/constructionMaterials";

export async function getServerSideProps() {
  return { props: {} };
}

export default function ProviderEditCatalogProduct() {
  const params = useParams();
  const router = useRouter();
  const serviceId = typeof params?.id === "string" ? params.id : "";

  const [loading, setLoading] = useState(true);
  const [subcategory, setSubcategory] = useState("");
  const [catalogProductId, setCatalogProductId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!serviceId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await api.services.getById(serviceId);
        if (cancelled) return;
        if (!res.success || !res.data) {
          setNotFound(true);
          return;
        }
        const service =
          (res.data as { service?: Record<string, unknown> }).service ?? res.data;
        const svc = service as {
          subcategory?: string;
          catalogProductId?: string;
          category?: { slug?: string } | string;
        };
        const cat = svc.category;
        const catSlug =
          cat && typeof cat === "object" && cat !== null && "slug" in cat
            ? String((cat as { slug?: string }).slug ?? "")
            : "";
        if (!isConstructionMaterialsCategorySlug(catSlug)) {
          router.replace("/dashboard/provider/services");
          return;
        }
        setSubcategory(svc.subcategory || "");
        setCatalogProductId(svc.catalogProductId || null);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [serviceId, router]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !serviceId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-muted-foreground">Listing not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/provider/services")}>
          Back to services
        </Button>
      </div>
    );
  }

  return (
    <CatalogProductsPage
      mode="edit"
      serviceId={serviceId}
      initialSubcategory={subcategory}
      initialCatalogProductId={catalogProductId}
    />
  );
}

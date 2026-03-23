"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Filter } from "lucide-react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LabourDirectoryFiltersForm,
  countActiveLabourFilters,
  type LabourBrowseFilters,
} from "@/components/provider/LabourDirectoryFilters";

type Props = {
  filters: LabourBrowseFilters;
  onChange: (next: LabourBrowseFilters) => void;
  onClear: () => void;
  idPrefix?: string;
};

function extractSubcategories(res: unknown): string[] {
  const r = res as { success?: boolean; data?: { subcategories?: string[] } };
  const list = r?.data?.subcategories;
  return Array.isArray(list) ? list.filter(Boolean) : [];
}

export function LabourFilterDialog({ filters, onChange, onClear, idPrefix = "labour" }: Props) {
  const [open, setOpen] = useState(false);
  const [subManpower, setSubManpower] = useState<string[]>([]);
  const [subTechnical, setSubTechnical] = useState<string[]>([]);

  const activeCount = useMemo(() => countActiveLabourFilters(filters), [filters]);

  const loadSubs = useCallback(async () => {
    try {
      const [r1, r2] = await Promise.all([
        api.categories.getSubcategories("manpower"),
        api.categories.getSubcategories("technical-manpower"),
      ]);
      setSubManpower(extractSubcategories(r1));
      setSubTechnical(extractSubcategories(r2));
    } catch {
      setSubManpower([]);
      setSubTechnical([]);
    }
  }, []);

  useEffect(() => {
    if (open) loadSubs();
  }, [open, loadSubs]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 shrink-0 relative"
        onClick={() => setOpen(true)}
        aria-label="Open filters"
      >
        <Filter className="h-4 w-4" />
        {activeCount > 0 ? (
          <Badge
            variant="default"
            className="absolute -top-1.5 -right-1.5 h-5 min-w-[1.25rem] px-1 flex items-center justify-center text-[10px] pointer-events-none"
          >
            {activeCount > 9 ? "9+" : activeCount}
          </Badge>
        ) : null}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Filters & sort</DialogTitle>
            <DialogDescription>
              Narrow workers by category, subcategory, location, rating, experience, and price. At least one category
              must stay selected.
            </DialogDescription>
          </DialogHeader>
          <LabourDirectoryFiltersForm
            idPrefix={idPrefix}
            filters={filters}
            onChange={onChange}
            onClear={onClear}
            subManpowerOptions={subManpower}
            subTechnicalOptions={subTechnical}
          />
          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onClear()}>
              Reset defaults
            </Button>
            <Button type="button" onClick={() => setOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

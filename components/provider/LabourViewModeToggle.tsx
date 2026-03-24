"use client";

import { LayoutGrid, List } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export type LabourViewMode = "grid" | "list";

type Props = {
  value: LabourViewMode;
  onChange: (mode: LabourViewMode) => void;
  className?: string;
};

export function LabourViewModeToggle({ value, onChange, className }: Props) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => {
        if (v === "grid" || v === "list") onChange(v);
      }}
      variant="outline"
      size="sm"
      className={cn("shrink-0", className)}
      aria-label="Directory layout"
    >
      <ToggleGroupItem value="grid" aria-label="Grid view">
        <LayoutGrid className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="List view">
        <List className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Grid3X3, List } from "lucide-react";

interface ServiceFiltersProps {
  searchQuery: string;
  viewMode: "grid" | "table";
  onSearchChange: (value: string) => void;
  onViewModeChange: (mode: "grid" | "table") => void;
}

export function ServiceFilters({
  searchQuery,
  viewMode,
  onSearchChange,
  onViewModeChange,
}: ServiceFiltersProps) {
  return (
    <Card>
      <CardContent className="p-3 sm:p-4 md:pt-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 text-sm sm:text-base h-9 sm:h-10"
            />
          </div>
          <div className="flex gap-2 border rounded-lg self-start sm:self-auto">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 sm:h-10 sm:w-10"
              onClick={() => onViewModeChange("table")}
              title="Table view"
              aria-label="Switch to table view"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 sm:h-10 sm:w-10"
              onClick={() => onViewModeChange("grid")}
              title="Grid view"
              aria-label="Switch to grid view"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


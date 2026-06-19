import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import {
  createTechnicalDetailRow,
  type ToolsServiceFieldsValue,
} from "@/lib/toolsService";

interface ToolsServiceFieldsProps {
  value: ToolsServiceFieldsValue;
  onChange: (value: ToolsServiceFieldsValue) => void;
}

export function ToolsServiceFields({ value, onChange }: ToolsServiceFieldsProps) {
  const update = (patch: Partial<ToolsServiceFieldsValue>) => {
    onChange({ ...value, ...patch });
  };

  const updateTechnicalDetail = (id: string, patch: Partial<{ label: string; value: string }>) => {
    update({
      technicalDetails: value.technicalDetails.map((row) =>
        row.id === id ? { ...row, ...patch } : row
      ),
    });
  };

  const removeTechnicalDetail = (id: string) => {
    update({
      technicalDetails: value.technicalDetails.filter((row) => row.id !== id),
    });
  };

  return (
    <div className="space-y-4 rounded-md border bg-muted/20 p-4">
      <div>
        <h4 className="text-sm font-semibold">Tool Details</h4>
        <p className="text-xs text-muted-foreground mt-1">
          Brand, model, and any extra technical specifications for this tool listing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tools-brand">Brand</Label>
          <Input
            id="tools-brand"
            placeholder="e.g., Bosch, DeWalt, Stanley"
            value={value.brandName}
            onChange={(e) => update({ brandName: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tools-model">Model Number</Label>
          <Input
            id="tools-model"
            placeholder="e.g., GSB 550"
            value={value.modelNumber}
            onChange={(e) => update({ modelNumber: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <Label>Technical Details</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Add custom fields such as voltage, power, weight, warranty, etc.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              update({
                technicalDetails: [...value.technicalDetails, createTechnicalDetailRow()],
              })
            }
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Field
          </Button>
        </div>

        {value.technicalDetails.length > 0 ? (
          <div className="space-y-2">
            {value.technicalDetails.map((row) => (
              <div key={row.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-end">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Label</Label>
                  <Input
                    placeholder="e.g., Voltage"
                    value={row.label}
                    onChange={(e) => updateTechnicalDetail(row.id, { label: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Value</Label>
                  <Input
                    placeholder="e.g., 220V"
                    value={row.value}
                    onChange={(e) => updateTechnicalDetail(row.id, { value: e.target.value })}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => removeTechnicalDetail(row.id)}
                  aria-label="Remove field"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground rounded-md border border-dashed p-3">
            No technical detail fields yet. Click &quot;Add Field&quot; to define custom specs.
          </p>
        )}
      </div>
    </div>
  );
}

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  resolveConstructionMaterialTypeKeyFromSubcategory,
} from "@/lib/constructionMaterials";

function optLabel(v: string, label: string) {
  return (
    <SelectItem key={v} value={v}>
      {label}
    </SelectItem>
  );
}

type CustomOption = { v: string; label: string };

interface SelectWithCustomProps {
  label: string;
  optional?: boolean;
  className?: string;
  value: string;
  customValue: string;
  placeholder: string;
  customPlaceholder?: string;
  options: CustomOption[];
  onSelect: (v: string) => void;
  onCustomChange: (v: string) => void;
}

/**
 * Select that always offers a "Custom…" entry. Picking it reveals a free-form
 * Input below; the value is stored in a sibling field (e.g. `brand` + `brandCustom`).
 */
function SelectWithCustom({
  label,
  optional = false,
  className,
  value,
  customValue,
  placeholder,
  customPlaceholder,
  options,
  onSelect,
  onCustomChange,
}: SelectWithCustomProps) {
  return (
    <div className={`space-y-2 ${className || ""}`.trim()}>
      <Label>
        {label}
        {optional ? " (optional)" : ""}
      </Label>
      <Select value={value} onValueChange={onSelect}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.v} value={o.v}>
              {o.label}
            </SelectItem>
          ))}
          <SelectItem value="custom">Custom…</SelectItem>
        </SelectContent>
      </Select>
      {value === "custom" && (
        <Input
          value={customValue}
          onChange={(e) => onCustomChange(e.target.value)}
          placeholder={customPlaceholder || `Enter custom ${label.toLowerCase()}`}
        />
      )}
    </div>
  );
}

interface ConstructionMaterialsDynamicFieldsProps {
  subcategory: string;
  dynamicData: Record<string, unknown>;
  onFieldChange: (fieldName: string, value: unknown) => void;
  errors?: Record<string, string>;
}

/** Option values align with imagi-mitra `categoryFormConfigs` + admin `constructionMaterialsAdmin`. */
export function ConstructionMaterialsDynamicFields({
  subcategory,
  dynamicData,
  onFieldChange,
  errors,
}: ConstructionMaterialsDynamicFieldsProps) {
  const materialTypeKey = resolveConstructionMaterialTypeKeyFromSubcategory(subcategory);
  const val = (k: string) => String(dynamicData[k] ?? "");
  const set = (patch: Record<string, string>) => {
    for (const [k, v] of Object.entries(patch)) {
      onFieldChange(k, v);
    }
  };

  const deliveryEnabled = val("deliveryOption") === "delivery_available";
  const tileCat = val("tileFloorCategoryType");
  const tileOnly = ["ceramic", "vitrified", "porcelain", "digital_tiles"];
  const flooringOnly = ["marble", "granite", "wooden", "vinyl", "stone"];

  return (
    <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
      <Label className="subtitle">Construction material details</Label>
      {errors?.constructionMaterials && (
        <p className="caption text-destructive">{errors.constructionMaterials}</p>
      )}

      {materialTypeKey === "cement" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SelectWithCustom
            label="Brand"
            value={val("brand")}
            customValue={val("brandCustom")}
            placeholder="Select brand"
            customPlaceholder="Enter brand name"
            options={[
              "ultratech_cement",
              "acc_cement",
              "ambuja_cement",
              "dalmia_cement",
              "shree_cement",
              "jk_cement",
              "birla_cement",
              "ramco_cement",
              "nuvoco_cement",
              "india_cements",
              "wonder_cement",
              "orient_cement",
              "heidelberg_cement",
              "prism_cement",
              "sagar_cement",
            ].map((v) => ({ v, label: v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) }))}
            onSelect={(v) => set({ brand: v })}
            onCustomChange={(v) => set({ brandCustom: v })}
          />
          <SelectWithCustom
            label="Cement type"
            value={val("cementType")}
            customValue={val("cementTypeCustom")}
            placeholder="Select type"
            customPlaceholder="e.g., OPC 33 Grade"
            options={[
              { v: "opc_43", label: "OPC 43 Grade" },
              { v: "opc_53", label: "OPC 53 Grade" },
              { v: "ppc", label: "PPC" },
              { v: "psc", label: "PSC" },
              { v: "white", label: "White Cement" },
            ]}
            onSelect={(v) => set({ cementType: v })}
            onCustomChange={(v) => set({ cementTypeCustom: v })}
          />
          <SelectWithCustom
            label="Bag size"
            value={val("bagSize")}
            customValue={val("bagSizeCustom")}
            placeholder="Select bag size"
            customPlaceholder="e.g., 35 kg"
            options={[
              { v: "25kg", label: "25 kg" },
              { v: "40kg", label: "40 kg" },
              { v: "50kg", label: "50 kg" },
            ]}
            onSelect={(v) => set({ bagSize: v })}
            onCustomChange={(v) => set({ bagSizeCustom: v })}
          />
        </div>
      )}

      {materialTypeKey === "bricks" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectWithCustom
            label="Type"
            value={val("brickBlockType")}
            customValue={val("brickBlockTypeCustom")}
            placeholder="Select type"
            customPlaceholder="Enter type"
            options={[
              { v: "red_bricks", label: "Red Bricks" },
              { v: "fly_ash_bricks", label: "Fly Ash Bricks" },
              { v: "aac_blocks", label: "AAC Blocks" },
              { v: "concrete_blocks", label: "Concrete Blocks" },
              { v: "hollow_blocks", label: "Hollow Blocks" },
              { v: "solid_blocks", label: "Solid Blocks" },
            ]}
            onSelect={(v) => set({ brickBlockType: v })}
            onCustomChange={(v) => set({ brickBlockTypeCustom: v })}
          />
          <SelectWithCustom
            label="Size"
            value={val("brickBlockSize")}
            customValue={val("brickBlockCustomSize")}
            placeholder="Select size"
            customPlaceholder="e.g., 700 x 200 x 150 mm"
            options={[
              { v: "9x4x3_inch", label: "9 x 4 x 3 inch" },
              { v: "10x5x3_inch", label: "10 x 5 x 3 inch" },
              { v: "600x200x200_mm", label: "600 x 200 x 200 mm" },
              { v: "400x200x200_mm", label: "400 x 200 x 200 mm" },
            ]}
            onSelect={(v) => set({ brickBlockSize: v })}
            onCustomChange={(v) => set({ brickBlockCustomSize: v })}
          />
        </div>
      )}

      {materialTypeKey === "sand" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectWithCustom
            label="Sand type"
            value={val("sandType")}
            customValue={val("sandTypeCustom")}
            placeholder="Select sand type"
            customPlaceholder="Enter sand type"
            options={[
              { v: "river_sand", label: "River Sand" },
              { v: "m_sand", label: "M-Sand" },
              { v: "plaster_sand", label: "Plaster Sand" },
              { v: "fill_sand", label: "Fill Sand" },
              { v: "pit_sand", label: "Pit Sand" },
            ]}
            onSelect={(v) => set({ sandType: v })}
            onCustomChange={(v) => set({ sandTypeCustom: v })}
          />
          <SelectWithCustom
            label="Truck size"
            value={val("sandTruckSize")}
            customValue={val("sandTruckSizeCustom")}
            placeholder="Select truck size"
            customPlaceholder="e.g., 800 CFT truck"
            options={[
              { v: "mini_truck", label: "Mini truck (100–200 CFT)" },
              { v: "medium_truck", label: "Medium truck (200–400 CFT)" },
              { v: "large_truck", label: "Large truck (400–600 CFT)" },
            ]}
            onSelect={(v) => set({ sandTruckSize: v })}
            onCustomChange={(v) => set({ sandTruckSizeCustom: v })}
          />
        </div>
      )}

      {materialTypeKey === "steel" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SelectWithCustom
            label="Steel type"
            value={val("steelType")}
            customValue={val("steelTypeCustom")}
            placeholder="Select steel type"
            customPlaceholder="Enter steel type"
            options={[
              { v: "tmt_bars", label: "TMT Bars" },
              { v: "structural_steel", label: "Structural Steel" },
              { v: "binding_wire", label: "Binding Wire" },
              { v: "steel_rods", label: "Steel Rods" },
              { v: "steel_sheets", label: "Steel Sheets" },
              { v: "steel_pipes", label: "Steel Pipes" },
            ]}
            onSelect={(v) => set({ steelType: v })}
            onCustomChange={(v) => set({ steelTypeCustom: v })}
          />
          <SelectWithCustom
            label="Size / diameter"
            value={val("steelSize")}
            customValue={val("steelCustomSize")}
            placeholder="Select size"
            customPlaceholder="e.g., 18 mm"
            options={["6mm", "8mm", "10mm", "12mm", "16mm", "20mm", "25mm"].map((v) => ({
              v,
              label: v.replace("mm", " mm"),
            }))}
            onSelect={(v) => set({ steelSize: v })}
            onCustomChange={(v) => set({ steelCustomSize: v })}
          />
          <SelectWithCustom
            label="Brand"
            optional
            value={val("steelBrand")}
            customValue={val("steelBrandCustom")}
            placeholder="Select brand"
            customPlaceholder="Enter brand name"
            options={[
              { v: "tata_tiscon", label: "Tata Tiscon" },
              { v: "jsw_steel", label: "JSW Steel" },
              { v: "sail", label: "SAIL" },
              { v: "kamdhenu", label: "Kamdhenu" },
            ]}
            onSelect={(v) => set({ steelBrand: v })}
            onCustomChange={(v) => set({ steelBrandCustom: v })}
          />
        </div>
      )}

      {materialTypeKey === "aggregate" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SelectWithCustom
            label="Aggregate type"
            value={val("aggregateType")}
            customValue={val("aggregateTypeCustom")}
            placeholder="Select type"
            customPlaceholder="Enter aggregate type"
            options={[
              { v: "crushed_stone", label: "Crushed Stone (Gitti)" },
              { v: "gravel", label: "Gravel" },
              { v: "stone_dust", label: "Stone Dust" },
              { v: "m_sand_aggregate", label: "M-Sand Aggregate" },
              { v: "river_gravel", label: "River Gravel" },
            ]}
            onSelect={(v) => set({ aggregateType: v })}
            onCustomChange={(v) => set({ aggregateTypeCustom: v })}
          />
          <SelectWithCustom
            label="Size"
            value={val("aggregateSize")}
            customValue={val("aggregateSizeCustom")}
            placeholder="Select size"
            customPlaceholder="e.g., 60 mm"
            options={[
              { v: "10mm", label: "10 mm" },
              { v: "20mm", label: "20 mm" },
              { v: "40mm", label: "40 mm" },
              { v: "mix_10_20", label: "Mix (10–20 mm)" },
            ]}
            onSelect={(v) => set({ aggregateSize: v })}
            onCustomChange={(v) => set({ aggregateSizeCustom: v })}
          />
          <SelectWithCustom
            label="Truck size"
            value={val("aggregateTruckSize")}
            customValue={val("aggregateTruckSizeCustom")}
            placeholder="Select truck size"
            customPlaceholder="e.g., 800 CFT truck"
            options={[
              { v: "mini_truck", label: "Mini truck (100–200 CFT)" },
              { v: "medium_truck", label: "Medium truck (200–400 CFT)" },
              { v: "large_truck", label: "Large truck (400–600 CFT)" },
            ]}
            onSelect={(v) => set({ aggregateTruckSize: v })}
            onCustomChange={(v) => set({ aggregateTruckSizeCustom: v })}
          />
        </div>
      )}

      {materialTypeKey === "tiles_flooring" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Category type</Label>
            <Select
              value={tileCat}
              onValueChange={(v) => {
                set({ tileFloorCategoryType: v, tileFlooringType: "" });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category type" />
              </SelectTrigger>
              <SelectContent>
                {optLabel("tiles", "Tiles")}
                {optLabel("marble", "Marble")}
                {optLabel("granite", "Granite")}
                {optLabel("wooden_flooring", "Wooden Flooring")}
                {optLabel("vinyl_flooring", "Vinyl Flooring")}
                {optLabel("stone_flooring", "Stone Flooring")}
              </SelectContent>
            </Select>
          </div>
          <SelectWithCustom
            label="Tile / flooring type"
            value={val("tileFlooringType")}
            customValue={val("tileFlooringTypeCustom")}
            placeholder="Select type"
            customPlaceholder="Enter type"
            options={(tileCat === "tiles" ? tileOnly : flooringOnly).map((v) => ({
              v,
              label: v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            }))}
            onSelect={(v) => set({ tileFlooringType: v })}
            onCustomChange={(v) => set({ tileFlooringTypeCustom: v })}
          />
          <SelectWithCustom
            label="Size"
            value={val("tileSize")}
            customValue={val("tileCustomSize")}
            placeholder="Select size"
            customPlaceholder="e.g., 1200x600 mm"
            options={[
              { v: "1x1_ft", label: "1x1 ft" },
              { v: "2x2_ft", label: "2x2 ft" },
              { v: "2x4_ft", label: "2x4 ft" },
              { v: "600x600_mm", label: "600x600 mm" },
              { v: "800x800_mm", label: "800x800 mm" },
            ]}
            onSelect={(v) => set({ tileSize: v })}
            onCustomChange={(v) => set({ tileCustomSize: v })}
          />
          <SelectWithCustom
            label="Brand"
            optional
            value={val("tileBrand")}
            customValue={val("tileBrandCustom")}
            placeholder="Select brand"
            customPlaceholder="Enter brand name"
            options={[
              { v: "kajaria", label: "Kajaria" },
              { v: "somany", label: "Somany" },
              { v: "nitco", label: "Nitco" },
              { v: "orientbell", label: "Orientbell" },
            ]}
            onSelect={(v) => set({ tileBrand: v })}
            onCustomChange={(v) => set({ tileBrandCustom: v })}
          />
          <SelectWithCustom
            label="Finish"
            value={val("tileFinish")}
            customValue={val("tileFinishCustom")}
            placeholder="Select finish"
            customPlaceholder="Enter finish"
            options={[
              { v: "glossy", label: "Glossy" },
              { v: "matte", label: "Matte" },
              { v: "anti_skid", label: "Anti-skid" },
              { v: "rustic", label: "Rustic" },
            ]}
            onSelect={(v) => set({ tileFinish: v })}
            onCustomChange={(v) => set({ tileFinishCustom: v })}
          />
          <SelectWithCustom
            label="Design / pattern"
            optional
            value={val("tileDesignPattern")}
            customValue={val("tileDesignPatternCustom")}
            placeholder="Select pattern"
            customPlaceholder="Enter pattern"
            options={[
              { v: "plain", label: "Plain" },
              { v: "marble_look", label: "Marble look" },
              { v: "wooden_look", label: "Wooden look" },
              { v: "designer", label: "Designer" },
            ]}
            onSelect={(v) => set({ tileDesignPattern: v })}
            onCustomChange={(v) => set({ tileDesignPatternCustom: v })}
          />
        </div>
      )}

      {materialTypeKey === "other" && (
        <div className="space-y-2">
          <Label>Material notes (optional)</Label>
          <Input
            value={val("quantityAvailable")}
            onChange={(e) => set({ quantityAvailable: e.target.value })}
            placeholder="Quantity, grade, or other details"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
        <div className="space-y-2">
          <Label>Delivery option</Label>
          <Select value={val("deliveryOption")} onValueChange={(v) => set({ deliveryOption: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select delivery option" />
            </SelectTrigger>
            <SelectContent>
              {optLabel("delivery_available", "Delivery available")}
              {optLabel("self_pickup", "Self pickup")}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Availability</Label>
          <Select
            value={val("materialAvailability")}
            onValueChange={(v) => set({ materialAvailability: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select availability" />
            </SelectTrigger>
            <SelectContent>
              {optLabel("in_stock", "In stock")}
              {optLabel("limited_stock", "Limited")}
              {optLabel("on_order", "On order")}
            </SelectContent>
          </Select>
        </div>

        {deliveryEnabled && (
          <>
            <div className="space-y-2">
              <Label>Delivery charges</Label>
              <Select value={val("deliveryCharges")} onValueChange={(v) => set({ deliveryCharges: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select charges" />
                </SelectTrigger>
                <SelectContent>
                  {optLabel("free", "Free")}
                  {optLabel("paid", "Paid")}
                  {optLabel("on_distance", "On distance")}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Material delivery time</Label>
              <Select
                value={val("materialDeliveryTime")}
                onValueChange={(v) => set({ materialDeliveryTime: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {optLabel("same_day", "Same day")}
                  {optLabel("one_two_days", "1–2 days")}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Loading / unloading</Label>
              <Select value={val("loadingUnloading")} onValueChange={(v) => set({ loadingUnloading: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  {optLabel("included", "Included")}
                  {optLabel("extra", "Extra")}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

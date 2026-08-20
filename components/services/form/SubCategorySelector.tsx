"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SubCategorySelectorProps {
  subcategories: string[];
  selectedSubcategory: string;
  onSubcategoryChange: (subcategory: string) => void;
  categoryName?: string;
  error?: string;
  /** When true, only the given list can be chosen (no free-text subcategory). */
  lockToList?: boolean;
}

export function SubCategorySelector({
  subcategories,
  selectedSubcategory,
  onSubcategoryChange,
  categoryName,
  error,
  lockToList = false,
}: SubCategorySelectorProps) {
  const [inputMode, setInputMode] = useState(false);
  const [manualInput, setManualInput] = useState(selectedSubcategory);

  // Sync manual input when selected subcategory changes from outside (e.g. initial load)
  useEffect(() => {
    setManualInput(selectedSubcategory);
    // If the selected subcategory is in the list, make sure we are not in manual input mode
    if (lockToList || (selectedSubcategory && subcategories.includes(selectedSubcategory))) {
      setInputMode(false);
    }
  }, [selectedSubcategory, subcategories, lockToList]);

  // Check if selected subcategory is from the list or manually entered
  const isManualEntry = selectedSubcategory && !subcategories.includes(selectedSubcategory);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="subcategory">
          Subcategory <span className="text-muted-foreground">(Optional)</span>
        </Label>
        {subcategories.length > 0 && !lockToList && (
          <button
            type="button"
            onClick={() => {
              setInputMode(!inputMode);
              if (!inputMode) {
                setManualInput(selectedSubcategory);
              }
            }}
            className="text-xs text-primary hover:underline"
          >
            {inputMode ? "Select from list" : "Enter manually"}
          </button>
        )}
      </div>

      {lockToList && subcategories.length === 0 ? (
        <div className="rounded-md border border-dashed bg-muted/40 p-3">
          <p className="text-sm text-muted-foreground">
            No subcategory on your Business Profile for this category.
          </p>
        </div>
      ) : inputMode || subcategories.length === 0 ? (
        <div className="space-y-2">
          <Input
            id="subcategory"
            placeholder={categoryName ? `Enter subcategory for ${categoryName} (optional)` : "Enter subcategory name (optional)"}
            value={manualInput}
            onChange={(e) => {
              setManualInput(e.target.value);
              onSubcategoryChange(e.target.value);
            }}
            className={error ? "border-destructive" : ""}
          />
          {error && (
            <p className="caption text-destructive">{error}</p>
          )}
          {!categoryName && (
            <p className="caption">
              Please select a category first to see predefined subcategories.
            </p>
          )}
          {categoryName && subcategories.length === 0 && (
            <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-100 rounded-md">
              <p className="text-xs text-yellow-700">
                No predefined subcategories found for "{categoryName}". You can enter one manually.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Select
            value={selectedSubcategory || "__none__"}
            onValueChange={(value) => {
              // Treat special "__none__" value as clearing the subcategory
              if (value === "__none__") {
                onSubcategoryChange("");
              } else {
                onSubcategoryChange(value);
              }
            }}
          >
            <SelectTrigger id="subcategory" className={error ? "border-destructive" : ""}>
              <SelectValue placeholder="Select a subcategory (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None (No subcategory)</SelectItem>
              {subcategories.map((subcat: string, index: number) => {
                const subcatValue = subcat && subcat.trim() ? subcat.trim() : `subcat-${index}`;
                return (
                  <SelectItem key={`subcat-${index}`} value={subcatValue}>
                    {subcat}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {error && (
            <p className="caption text-destructive">{error}</p>
          )}
          {!error && selectedSubcategory && (
            <p className="caption">
              Dynamic fields will be loaded based on your selection
            </p>
          )}
        </div>
      )}

      {isManualEntry && !inputMode && !lockToList && (
        <div className="p-2 rounded-md bg-muted/50 border border-dashed">
          <p className="caption">
            Current: <span className="body">{selectedSubcategory}</span> (manually entered)
          </p>
        </div>
      )}
    </div>
  );
}















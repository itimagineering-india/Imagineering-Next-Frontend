import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Category {
  _id: string;
  name: string;
  slug: string;
  subcategories?: string[];
}

interface CategorySelectorProps {
  categories: Category[];
  selectedCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
  error?: string;
}

export function CategorySelector({
  categories,
  selectedCategoryId,
  onCategoryChange,
  error,
}: CategorySelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="category">
        Category <span className="text-destructive">*</span>
      </Label>
      <Select
        value={selectedCategoryId || ""}
        onValueChange={onCategoryChange}
      >
        <SelectTrigger id="category" className={error ? "border-destructive" : ""}>
          <SelectValue placeholder="Select a category" />
        </SelectTrigger>
        <SelectContent>
          {categories.length > 0 ? (
            categories.map((category) => (
              <SelectItem key={category._id} value={category._id}>
                {category.name || "Unnamed Category"}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="no-categories" disabled>
              No categories available
            </SelectItem>
          )}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {!error && selectedCategoryId && (
        <p className="text-xs text-muted-foreground">
          Select a category to proceed to the next step
        </p>
      )}
    </div>
  );
}






















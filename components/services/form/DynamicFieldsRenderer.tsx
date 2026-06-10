import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldConfig, getDynamicFields } from "@/config/serviceFields";
import { isConstructionMaterialsCategorySlug } from "@/lib/constructionMaterials";
import { ConstructionMaterialsDynamicFields } from "./ConstructionMaterialsDynamicFields";

interface DynamicFieldsRendererProps {
  categorySlug: string;
  subcategory: string;
  dynamicData: Record<string, unknown>;
  onFieldChange: (fieldName: string, value: unknown) => void;
  errors?: Record<string, string>;
}

export function DynamicFieldsRenderer({
  categorySlug,
  subcategory,
  dynamicData,
  onFieldChange,
  errors,
}: DynamicFieldsRendererProps) {
  if (!categorySlug || !subcategory) {
    return (
      <div className="p-4 rounded-lg border bg-muted/30">
        <p className="caption">
          Select a category and subcategory to see dynamic fields
        </p>
      </div>
    );
  }

  if (isConstructionMaterialsCategorySlug(categorySlug)) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1 bg-border" />
          <span className="caption">
            Additional Information
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <ConstructionMaterialsDynamicFields
          subcategory={subcategory}
          dynamicData={dynamicData}
          onFieldChange={onFieldChange}
          errors={errors}
        />
      </div>
    );
  }

  const fields = getDynamicFields(categorySlug, subcategory);

  if (fields.length === 0) {
    return (
      <div className="p-4 rounded-lg border bg-muted/30">
        <p className="caption">
          No additional fields required for this subcategory
        </p>
      </div>
    );
  }

  const renderField = (field: FieldConfig) => {
    const rawFieldValue = dynamicData[field.name];
    const fieldValue =
      typeof rawFieldValue === "string" || typeof rawFieldValue === "number"
        ? rawFieldValue
        : "";
    const stringFieldValue = String(fieldValue);
    const fieldError = errors?.[field.name];
    const hasError = !!fieldError;

    switch (field.type) {
      case "text":
      case "textarea":
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </Label>
            {field.type === "textarea" ? (
              <Textarea
                id={field.name}
                placeholder={field.placeholder}
                value={fieldValue}
                onChange={(e) => onFieldChange(field.name, e.target.value)}
                className={hasError ? "border-destructive" : ""}
                rows={4}
              />
            ) : (
              <Input
                id={field.name}
                type="text"
                placeholder={field.placeholder}
                value={fieldValue}
                onChange={(e) => onFieldChange(field.name, e.target.value)}
                className={hasError ? "border-destructive" : ""}
              />
            )}
            {fieldError && (
              <p className="caption text-destructive">{fieldError}</p>
            )}
          </div>
        );

      case "number":
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={field.name}
              type="number"
              placeholder={field.placeholder}
              value={stringFieldValue}
              onChange={(e) => onFieldChange(field.name, e.target.value)}
              className={hasError ? "border-destructive" : ""}
              min={field.min}
              max={field.max}
              step="any"
            />
            {fieldError && (
              <p className="caption text-destructive">{fieldError}</p>
            )}
          </div>
        );

      case "select":
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Select
              value={stringFieldValue}
              onValueChange={(value) => onFieldChange(field.name, value)}
            >
              <SelectTrigger id={field.name} className={hasError ? "border-destructive" : ""}>
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldError && (
              <p className="caption text-destructive">{fieldError}</p>
            )}
          </div>
        );

      case "boolean":
        return (
          <div key={field.name} className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={rawFieldValue === true || rawFieldValue === "true"}
              onCheckedChange={(checked) => onFieldChange(field.name, checked)}
            />
            <Label
              htmlFor={field.name}
              className="body cursor-pointer"
            >
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </Label>
            {fieldError && (
              <p className="text-sm text-destructive ml-2">{fieldError}</p>
            )}
          </div>
        );

      case "file": {
        const fileValue = rawFieldValue;
        const fileName = fileValue instanceof File ? fileValue.name : null;
        const existingUrl = field.name === 'resumeOrDocument' ? (dynamicData?.resumeUrl as string) : null;
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={field.name}
              type="file"
              accept={field.accept || '.pdf,.doc,.docx'}
              onChange={(e) => {
                const file = e.target.files?.[0];
                onFieldChange(field.name, file || null);
              }}
              className={hasError ? "border-destructive" : ""}
            />
            {fileName && (
              <p className="caption">{fileName}</p>
            )}
            {existingUrl && !fileName && (
              <p className="caption">
                Current document:{" "}
                <a href={existingUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  View
                </a>
              </p>
            )}
            {fieldError && (
              <p className="caption text-destructive">{fieldError}</p>
            )}
          </div>
        );
      }

      case "multiselect":
        const selectedValues = Array.isArray(rawFieldValue) ? rawFieldValue : [];
        return (
          <div key={field.name} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </Label>
            <div className="space-y-2">
              {field.options?.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.name}-${option}`}
                    checked={selectedValues.includes(option)}
                    onCheckedChange={(checked) => {
                      const newValues = checked
                        ? [...selectedValues, option]
                        : selectedValues.filter((v) => v !== option);
                      onFieldChange(field.name, newValues);
                    }}
                  />
                  <Label
                    htmlFor={`${field.name}-${option}`}
                    className="body cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </div>
            {fieldError && (
              <p className="caption text-destructive">{fieldError}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-px flex-1 bg-border" />
        <span className="caption">
          Additional Information
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
      {fields.map((field) => renderField(field))}
    </div>
  );
}






















import { Control, Controller, FieldErrors } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface BookingFieldConfig {
  _id: string;
  fieldKey: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'date' | 'textarea';
  required: boolean;
  placeholder?: string;
  options?: string[];
  min?: number;
  max?: number;
  validation?: {
    pattern?: string;
    message?: string;
  };
  displayOrder: number;
}

interface DynamicBookingFieldProps {
  field: BookingFieldConfig;
  control: Control<any>;
  errors: FieldErrors<any>;
}

export function DynamicBookingField({
  field,
  control,
  errors,
}: DynamicBookingFieldProps) {
  const error = errors[field.fieldKey];

  return (
    <div className="space-y-2">
      <Label htmlFor={field.fieldKey}>
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>

      <Controller
        name={field.fieldKey}
        control={control}
        rules={{
          required: field.required
            ? `${field.label} is required`
            : false,
          min: field.min !== undefined
            ? {
                value: field.min,
                message: `Minimum value is ${field.min}`,
              }
            : undefined,
          max: field.max !== undefined
            ? {
                value: field.max,
                message: `Maximum value is ${field.max}`,
              }
            : undefined,
          pattern: field.validation?.pattern
            ? {
                value: new RegExp(field.validation.pattern),
                message: field.validation.message || "Invalid format",
              }
            : undefined,
        }}
        render={({ field: formField }) => {
          switch (field.type) {
            case 'text':
              return (
                <Input
                  {...formField}
                  id={field.fieldKey}
                  placeholder={field.placeholder}
                  className={cn(error && "border-destructive")}
                />
              );

            case 'textarea':
              return (
                <Textarea
                  {...formField}
                  id={field.fieldKey}
                  placeholder={field.placeholder}
                  rows={4}
                  className={cn(error && "border-destructive")}
                />
              );

            case 'number':
              return (
                <Input
                  {...formField}
                  id={field.fieldKey}
                  type="number"
                  placeholder={field.placeholder}
                  min={field.min}
                  max={field.max}
                  step="any"
                  onChange={(e) => formField.onChange(parseFloat(e.target.value) || 0)}
                  className={cn(error && "border-destructive")}
                />
              );

            case 'select':
              return (
                <Select
                  value={formField.value || ""}
                  onValueChange={formField.onChange}
                >
                  <SelectTrigger
                    id={field.fieldKey}
                    className={cn(error && "border-destructive")}
                  >
                    <SelectValue placeholder={field.placeholder || "Select an option"} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );

            case 'boolean':
              return (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={field.fieldKey}
                    checked={formField.value || false}
                    onCheckedChange={formField.onChange}
                  />
                  <Label
                    htmlFor={field.fieldKey}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {field.placeholder || "Yes"}
                  </Label>
                </div>
              );

            case 'date':
              return (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formField.value && "text-muted-foreground",
                        error && "border-destructive"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formField.value ? (
                        format(new Date(formField.value), "PPP")
                      ) : (
                        <span>{field.placeholder || "Pick a date"}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formField.value ? new Date(formField.value) : undefined}
                      onSelect={(date) => formField.onChange(date?.toISOString())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              );

            default:
              return <div className="hidden" aria-hidden />;
          }
        }}
      />

      {error && (
        <p className="text-sm text-destructive">
          {error.message as string}
        </p>
      )}
    </div>
  );
}

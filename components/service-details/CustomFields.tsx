import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

interface CustomField {
  label: string;
  value: string | number | boolean;
  type: 'text' | 'number' | 'boolean' | 'select';
}

interface CustomFieldsProps {
  fields: CustomField[];
  className?: string;
}

export function CustomFields({ fields, className }: CustomFieldsProps) {
  if (!fields || fields.length === 0) {
    return null;
  }

  const renderFieldValue = (field: CustomField) => {
    switch (field.type) {
      case 'boolean':
        return (
          <div className="flex items-center gap-2">
            {field.value ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Yes</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">No</span>
              </>
            )}
          </div>
        );
      case 'number':
        return (
          <span className="text-sm font-semibold text-foreground">
            {typeof field.value === 'number' ? field.value.toLocaleString() : field.value}
          </span>
        );
      case 'select':
        return (
          <Badge variant="secondary" className="text-sm">
            {String(field.value)}
          </Badge>
        );
      case 'text':
      default:
        return (
          <span className="text-sm text-foreground">
            {String(field.value)}
          </span>
        );
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Additional Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((field, index) => (
            <div key={index} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {field.label}
              </label>
              <div className="pt-1">
                {renderFieldValue(field)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

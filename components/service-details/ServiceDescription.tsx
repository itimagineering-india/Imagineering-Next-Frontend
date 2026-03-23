import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ServiceDescriptionProps {
  description: string;
  included?: string[];
  notIncluded?: string[];
  availability?: string;
}

export function ServiceDescription({
  description,
  included = [],
  notIncluded = [],
  availability,
}: ServiceDescriptionProps) {
  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-xl">About this Service</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-4 sm:space-y-6">
        {/* Description */}
        <div>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
            {description}
          </p>
        </div>

        <Separator />

        {/* What's Included */}
        {included.length > 0 && (
          <div>
            <h3 className="font-semibold text-base sm:text-lg mb-2 sm:mb-3">What's Included</h3>
            <ul className="space-y-1.5 sm:space-y-2">
              {included.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* What's Not Included */}
        {notIncluded.length > 0 && (
          <div>
            <h3 className="font-semibold text-base sm:text-lg mb-2 sm:mb-3">What's Not Included</h3>
            <ul className="space-y-1.5 sm:space-y-2">
              {notIncluded.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <X className="h-4 w-4 sm:h-5 sm:w-5 text-destructive mt-0.5 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Availability */}
        {availability && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold text-base sm:text-lg mb-1.5 sm:mb-2">Availability</h3>
              <p className="text-sm sm:text-base text-muted-foreground">{availability}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}


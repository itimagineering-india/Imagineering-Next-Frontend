"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, FileText, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PROVIDER_AGREEMENT_POLICY_REFERENCES,
  PROVIDER_AGREEMENT_SECTIONS,
  PROVIDER_AGREEMENT_SECTION_IDS,
  PROVIDER_AGREEMENT_VERSION,
  type ProviderAgreementSectionId,
} from "@/lib/providerAgreementConfig";

interface ProviderAgreementFormProps {
  mode?: "page" | "gate";
  submitting?: boolean;
  onSubmit: (sectionsAccepted: ProviderAgreementSectionId[]) => void | Promise<void>;
  onCancel?: () => void;
}

export function ProviderAgreementForm({
  mode = "page",
  submitting = false,
  onSubmit,
  onCancel,
}: ProviderAgreementFormProps) {
  const [agreed, setAgreed] = useState(false);

  const allChecked = agreed;

  const handleAccept = () => {
    if (!agreed) return;
    void onSubmit([...PROVIDER_AGREEMENT_SECTION_IDS]);
  };

  const compact = mode === "gate";

  return (
    <div className={cn("space-y-5", compact && "space-y-4")}>
      {!compact && (
        <div className="rounded-2xl border bg-gradient-to-br from-primary/5 via-white to-rose-50/40 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2 max-w-3xl">
              <Badge variant="outline" className="rounded-full">
                Provider Agreement & Consent
              </Badge>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Before You Start
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Welcome to <span className="font-semibold text-foreground">Imagineering India</span>.
                By joining as a Provider, you agree to provide accurate information, maintain
                professional standards, and follow platform policies. These rules help build trust
                between contractors and suppliers.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Agreement version <span className="font-mono font-medium">{PROVIDER_AGREEMENT_VERSION}</span>
          </p>
        </div>
      )}

      {compact && (
        <div className="space-y-2 pr-1">
          <h2 className="text-lg font-semibold">Provider Agreement & Consent</h2>
          <p className="text-sm text-muted-foreground">
            Please read and accept the agreement to continue using your provider dashboard.
            Version {PROVIDER_AGREEMENT_VERSION}.
          </p>
        </div>
      )}

      <div className="space-y-4">
          {PROVIDER_AGREEMENT_SECTIONS.map((section) => (
            <Card key={section.id} className="rounded-xl border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">{section.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{section.summary}</p>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {section.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}

          <Card className="rounded-xl border border-primary/20 bg-primary/[0.03] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">6. Consent</CardTitle>
              <p className="text-sm text-muted-foreground">
                By continuing, you confirm that you have read the agreement above and accept the
                related policies.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-start gap-3 rounded-lg border bg-background p-4">
                <Checkbox
                  id="agree-provider-agreement"
                  checked={agreed}
                  onCheckedChange={(v) => setAgreed(v === true)}
                />
                <Label
                  htmlFor="agree-provider-agreement"
                  className="text-sm font-medium leading-relaxed cursor-pointer"
                >
                  I have read and understood the Provider Agreement above. I agree to the{" "}
                  <Link href="/terms" className="text-primary hover:underline inline-flex items-center gap-0.5" target="_blank">
                    Terms & Conditions <ExternalLink className="h-3 w-3" />
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary hover:underline inline-flex items-center gap-0.5" target="_blank">
                    Privacy Policy <ExternalLink className="h-3 w-3" />
                  </Link>
                  . I understand my account may be suspended if I violate these policies. I consent
                  to receive order notifications and important platform communications.
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Related policies
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2 pt-0">
              {PROVIDER_AGREEMENT_POLICY_REFERENCES.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  target="_blank"
                  className="rounded-lg border p-3 hover:bg-muted/40 transition-colors"
                >
                  <p className="text-sm font-medium text-primary">{p.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{p.note}</p>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

      <div
        className={cn(
          "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
          compact && "sticky bottom-0 z-10 -mx-1 border-t bg-background/95 px-1 pt-4 pb-1 backdrop-blur supports-[backdrop-filter]:bg-background/90",
        )}
      >
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            {compact ? "Sign out" : "Back to dashboard"}
          </Button>
        )}
        <Button
          type="button"
          className="sm:min-w-[180px]"
          disabled={!allChecked || submitting}
          onClick={handleAccept}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving…
            </>
          ) : (
            "Accept & Continue"
          )}
        </Button>
      </div>

      {!allChecked && (
        <p className="text-xs text-center text-muted-foreground">
          Please read the agreement and check the consent box to continue.
        </p>
      )}
    </div>
  );
}

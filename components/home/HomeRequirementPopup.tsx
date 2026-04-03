"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, MapPin, Phone, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const OPEN_DELAY_MS = 2000;

const inputClass =
  "h-11 rounded-xl border-slate-200 bg-white transition-all duration-200 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/25 focus-visible:ring-offset-0 dark:border-slate-700 dark:bg-slate-950/40";

const textareaClass =
  "min-h-[120px] resize-y rounded-xl border-slate-200 bg-white transition-all duration-200 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/25 focus-visible:ring-offset-0 dark:border-slate-700 dark:bg-slate-950/40 sm:min-h-[100px]";

function FieldCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[12px] border border-slate-200/90 bg-[#f9fafb] p-4 shadow-sm dark:border-slate-800 dark:bg-muted/30 sm:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Shown each time the home page mounts — compact requirement form for Imagineering India (guest-friendly). */
export function HomeRequirementPopup() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      setOpen(false);
      return;
    }
    if (hasDismissed) return;

    const id = window.setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [authLoading, isAuthenticated, hasDismissed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    const d = description.trim();
    const loc = location.trim();
    const digits = phone.replace(/\D/g, "");
    const mobile =
      digits.length === 12 && digits.startsWith("91")
        ? digits.slice(-10)
        : digits.length === 11 && digits.startsWith("0")
          ? digits.slice(-10)
          : digits;

    if (t.length < 5 || d.length < 20) {
      toast({
        title: "Please add more detail",
        description: "Title must be at least 5 characters and description at least 20 characters.",
        variant: "destructive",
      });
      return;
    }
    if (loc.length < 3) {
      toast({
        title: "Location required",
        description: "Enter where you need the service (area, city, or full address).",
        variant: "destructive",
      });
      return;
    }
    if (mobile.length !== 10 || !/^[6-9]\d{9}$/.test(mobile)) {
      toast({
        title: "Valid mobile number",
        description: "Enter a 10-digit Indian mobile number (starts with 6–9).",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.requirements.create({
        title: t,
        description: d,
        contactPhone: mobile,
        location: loc,
      });
      if (res.success) {
        toast({
          title: "Requirement submitted",
          description: "We will review and contact you soon.",
        });
        setTitle("");
        setDescription("");
        setPhone("");
        setLocation("");
        setHasDismissed(true);
        setOpen(false);
        if (isAuthenticated) {
          router.push("/dashboard/buyer/requirements");
        }
      } else {
        toast({
          title: "Could not submit",
          description: res.error?.message || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Please try again.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setHasDismissed(true);
      }}
    >
      <DialogContent className="flex max-h-[min(92vh,calc(100dvh-1.5rem))] w-[calc(100vw-1.5rem)] max-w-lg flex-col gap-0 overflow-hidden border-0 p-0 shadow-xl sm:w-full sm:rounded-2xl">
        <div className="shrink-0 bg-gradient-to-br from-slate-50 via-slate-50 to-sky-100/70 px-4 pb-4 pt-5 pr-12 dark:from-slate-950 dark:via-slate-900 dark:to-sky-950/35 sm:px-6 sm:pb-5 sm:pr-14 sm:pt-6">
          <DialogHeader className="space-y-2 text-left">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-700">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <DialogTitle className="text-xl font-bold leading-tight tracking-tight text-slate-900 sm:text-2xl dark:text-slate-50">
                  Submit your requirement
                </DialogTitle>
              </div>
            </div>
            <DialogDescription className="text-left text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Tell Imagineering India what you need — we will follow up with a quote. Add your mobile and location so we
              can reach you.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          <form
            onSubmit={handleSubmit}
            className="space-y-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:space-y-5"
          >
            <FieldCard>
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  What you need
                </span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="home-req-title" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Short title *
                </Label>
                <Input
                  id="home-req-title"
                  placeholder="e.g. Office renovation, electrical work"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoComplete="off"
                  className={inputClass}
                />
              </div>
            </FieldCard>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4">
              <FieldCard className="sm:min-h-0">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-700">
                    <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Mobile *
                  </span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="home-req-phone" className="sr-only">
                    Mobile number
                  </Label>
                  <Input
                    id="home-req-phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="10-digit number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    maxLength={14}
                    className={cn(inputClass, "pl-3 font-mono text-base tracking-wide")}
                  />
                </div>
              </FieldCard>

              <FieldCard className="sm:min-h-0">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-700">
                    <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Location *
                  </span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="home-req-location" className="sr-only">
                    Location or service area
                  </Label>
                  <Input
                    id="home-req-location"
                    placeholder="City, area, pin code…"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    autoComplete="street-address"
                    className={inputClass}
                  />
                </div>
              </FieldCard>
            </div>

            <FieldCard>
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Details *
                </span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="home-req-desc" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Describe the work
                </Label>
                <Textarea
                  id="home-req-desc"
                  placeholder="Scope, timeline, budget range, access, materials…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className={textareaClass}
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">At least 20 characters helps us quote accurately.</p>
              </div>
            </FieldCard>

            <div className="sticky bottom-0 -mx-4 border-t border-slate-200/90 bg-background/95 px-4 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-background/85 dark:border-slate-800 sm:-mx-6 sm:px-6">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full gap-2 rounded-xl bg-[#2563eb] text-base font-semibold text-white shadow-md transition-all duration-200 hover:bg-[#1d4ed8] disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Submit requirement
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

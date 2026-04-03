"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Send } from "lucide-react";
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

/** Shown each time the home page mounts — compact requirement form for Imagineering India. */
export function HomeRequirementPopup() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    setOpen(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast({
        title: "Required fields",
        description: "Please add a title and description.",
        variant: "destructive",
      });
      return;
    }
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent("/requirement/submit")}`);
      setOpen(false);
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.requirements.create({
        title: title.trim(),
        description: description.trim(),
      });
      if (res.success) {
        toast({
          title: "Requirement submitted",
          description: "We will review and get back to you soon.",
        });
        setTitle("");
        setDescription("");
        setOpen(false);
        router.push("/dashboard/buyer/requirements");
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-left">
            <FileText className="h-5 w-5 shrink-0" />
            Submit your requirement
          </DialogTitle>
          <DialogDescription className="text-left">
            Tell Imagineering India what you need — we will follow up with a quote. For attachments and full details, use the link below after signing in.
          </DialogDescription>
        </DialogHeader>

        {authLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="home-req-title">Your requirement *</Label>
              <Input
                id="home-req-title"
                placeholder="e.g. Renovation, contractor, materials"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="home-req-desc">Description *</Label>
              <Textarea
                id="home-req-desc"
                placeholder="Location, scope, timeline…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between pt-1">
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {isAuthenticated ? "Submit requirement" : "Sign in & submit"}
                  </>
                )}
              </Button>
              <Button type="button" variant="ghost" size="sm" asChild>
                <Link href="/requirement/submit">Full form (location, budget, files)</Link>
              </Button>
            </div>
            {!isAuthenticated && (
              <p className="text-xs text-muted-foreground">
                You can fill this now; we will ask you to sign in before sending.
              </p>
            )}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import api from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, FileText, Loader2, Upload, X } from "lucide-react";

type DocType = "panCard" | "aadhaar";

type Props = {
  label: string;
  required?: boolean;
  documentType: DocType;
  url: string | null;
  filename?: string | null;
  onUploaded: (url: string, filename: string) => void;
  onClear: () => void;
  disabled?: boolean;
};

export function CreditKycDocumentUpload({
  label,
  required,
  documentType,
  url,
  filename,
  onUploaded,
  onClear,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    const allowed = /\.(jpe?g|png|webp|heic|heif|pdf)$/i.test(file.name);
    if (!allowed && !file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast({
        title: "Invalid file",
        description: "Upload JPEG, PNG, WebP, HEIC, or PDF only.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum size is 5 MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const res = await api.imagineeringCredit.uploadKycDocument(file, documentType);
      const uploadedUrl = res.data?.url;
      if (!res.success || !uploadedUrl) {
        throw new Error("Upload failed");
      }
      onUploaded(uploadedUrl, file.name);
      toast({ title: "Document uploaded", description: `${label} ready for submission.` });
    } catch (err: unknown) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required ? " *" : " (optional)"}
      </Label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf,application/pdf"
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
      />
      {url ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <div className="flex min-w-0 items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{filename || "Document uploaded"}</span>
          </div>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClear} disabled={disabled}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start gap-2"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Uploading…" : "Choose file (image or PDF, max 5 MB)"}
        </Button>
      )}
    </div>
  );
}

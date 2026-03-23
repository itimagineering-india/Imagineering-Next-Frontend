"use client";

import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { sanitizeString, validateRequired } from "@/utils/validation";

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (ticket: {
    subject: string;
    category: string;
    description: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function CreateTicketDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: CreateTicketDialogProps) {
  const [formData, setFormData] = useState({
    subject: "",
    category: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    // Reset errors
    setErrors({});

    // Validate required fields
    const validation = validateRequired(formData, ['subject', 'category', 'description']);
    if (!validation.isValid) {
      const newErrors: Record<string, string> = {};
      validation.missingFields.forEach(field => {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      });
      setErrors(newErrors);
      return;
    }

    // Sanitize inputs
    const sanitizedData = {
      subject: sanitizeString(formData.subject),
      category: sanitizeString(formData.category),
      description: sanitizeString(formData.description),
    };

    try {
      await onSubmit(sanitizedData);
      // Reset form on success
      setFormData({ subject: "", category: "", description: "" });
      setErrors({});
    } catch (error) {
      console.error("Failed to create ticket:", error);
    }
  };

  const handleClose = () => {
    setFormData({ subject: "", category: "", description: "" });
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Support Ticket</DialogTitle>
          <DialogDescription>
            Describe your issue and we'll help you resolve it
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              placeholder="Brief description of your issue"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className={errors.subject ? "border-destructive" : ""}
            />
            {errors.subject && (
              <p className="text-xs text-destructive">{errors.subject}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger className={errors.category ? "border-destructive" : ""}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical">Technical Issue</SelectItem>
                <SelectItem value="billing">Billing & Payment</SelectItem>
                <SelectItem value="account">Account & Profile</SelectItem>
                <SelectItem value="service">Service Related</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-xs text-destructive">{errors.category}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Provide detailed information about your issue..."
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={errors.description ? "border-destructive" : ""}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


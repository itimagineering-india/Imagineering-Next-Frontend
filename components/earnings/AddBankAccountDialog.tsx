"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api-client";

interface AddBankAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  existingAccountsCount: number;
}

export function AddBankAccountDialog({
  open,
  onOpenChange,
  onSuccess,
  existingAccountsCount,
}: AddBankAccountDialogProps) {
  const { toast } = useToast();
  const [bankFormData, setBankFormData] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
    accountType: 'savings' as 'savings' | 'current',
  });
  const [isSubmittingBank, setIsSubmittingBank] = useState(false);

  const handleAddBankAccount = async () => {
    if (!bankFormData.accountHolderName || !bankFormData.accountNumber || !bankFormData.ifscCode || !bankFormData.bankName) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate IFSC code format
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(bankFormData.ifscCode)) {
      toast({
        title: "Invalid IFSC Code",
        description: "IFSC code must be 11 characters: 4 letters, 1 zero, 6 alphanumeric (e.g., HDFC0001234)",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingBank(true);
    try {
      const response = await api.bankAccounts.add({
        ...bankFormData,
        isDefault: existingAccountsCount === 0, // Set as default if first account
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Bank account added successfully",
        });
        onOpenChange(false);
        setBankFormData({
          accountHolderName: '',
          accountNumber: '',
          ifscCode: '',
          bankName: '',
          branchName: '',
          accountType: 'savings',
        });
        onSuccess();
      } else {
        throw new Error(response.error?.message || "Failed to add bank account");
      }
    } catch (error: any) {
      console.error("Add bank account error:", error);
      let errorMessage = error.message || "Failed to add bank account";
      
      // Extract validation error message
      if (errorMessage.includes('IFSC code')) {
        errorMessage = "Invalid IFSC code format. Format: 4 letters, 1 zero, 6 alphanumeric (e.g., HDFC0001234)";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmittingBank(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="text-base md:text-lg">Add Bank Account</DialogTitle>
          <DialogDescription className="text-xs md:text-sm">
            Add your bank account details to receive withdrawals
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 md:space-y-4">
          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="accountHolderName" className="text-xs md:text-sm">Account Holder Name *</Label>
            <Input
              id="accountHolderName"
              value={bankFormData.accountHolderName}
              onChange={(e) => setBankFormData({ ...bankFormData, accountHolderName: e.target.value })}
              placeholder="Enter account holder name"
              className="text-xs md:text-sm"
            />
          </div>
          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="accountNumber" className="text-xs md:text-sm">Account Number *</Label>
            <Input
              id="accountNumber"
              value={bankFormData.accountNumber}
              onChange={(e) => setBankFormData({ ...bankFormData, accountNumber: e.target.value })}
              placeholder="Enter account number"
              type="text"
              className="text-xs md:text-sm"
            />
          </div>
          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="ifscCode" className="text-xs md:text-sm">IFSC Code *</Label>
            <Input
              id="ifscCode"
              value={bankFormData.ifscCode}
              onChange={(e) => {
                let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                // Limit to 11 characters
                if (value.length <= 11) {
                  setBankFormData({ ...bankFormData, ifscCode: value });
                }
              }}
              placeholder="Enter IFSC code (e.g., HDFC0001234)"
              maxLength={11}
              className="text-xs md:text-sm"
            />
            <p className="text-[10px] md:text-xs text-muted-foreground">
              Format: 4 letters, 1 zero, 6 alphanumeric (11 characters)
            </p>
          </div>
          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="bankName" className="text-xs md:text-sm">Bank Name *</Label>
            <Input
              id="bankName"
              value={bankFormData.bankName}
              onChange={(e) => setBankFormData({ ...bankFormData, bankName: e.target.value })}
              placeholder="Enter bank name"
              className="text-xs md:text-sm"
            />
          </div>
          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="branchName" className="text-xs md:text-sm">Branch Name</Label>
            <Input
              id="branchName"
              value={bankFormData.branchName}
              onChange={(e) => setBankFormData({ ...bankFormData, branchName: e.target.value })}
              placeholder="Enter branch name (optional)"
              className="text-xs md:text-sm"
            />
          </div>
          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="accountType" className="text-xs md:text-sm">Account Type *</Label>
            <Select
              value={bankFormData.accountType}
              onValueChange={(value: 'savings' | 'current') => setBankFormData({ ...bankFormData, accountType: value })}
            >
              <SelectTrigger className="text-xs md:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="savings">Savings</SelectItem>
                <SelectItem value="current">Current</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-3 md:pt-4">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs md:text-sm"
              onClick={() => {
                onOpenChange(false);
                setBankFormData({
                  accountHolderName: '',
                  accountNumber: '',
                  ifscCode: '',
                  bankName: '',
                  branchName: '',
                  accountType: 'savings',
                });
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="flex-1 text-xs md:text-sm"
              onClick={handleAddBankAccount}
              disabled={isSubmittingBank}
            >
              {isSubmittingBank ? "Adding..." : "Add Bank Account"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


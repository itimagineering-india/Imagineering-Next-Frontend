import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Plus } from "lucide-react";
import { BankAccountCard } from "./BankAccountCard";

interface BankAccount {
  _id: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName?: string;
  accountType: 'savings' | 'current';
  isDefault: boolean;
  isVerified: boolean;
}

interface BankAccountsListProps {
  bankAccounts: BankAccount[];
  onAddClick: () => void;
}

export function BankAccountsList({ bankAccounts, onAddClick }: BankAccountsListProps) {
  return (
    <Card>
      <CardHeader className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <CardTitle className="text-base md:text-lg">Bank Accounts</CardTitle>
            <CardDescription className="text-xs md:text-sm">Manage your bank accounts for withdrawals</CardDescription>
          </div>
          <Button onClick={onAddClick} size="sm" className="text-xs md:text-sm self-start sm:self-auto">
            <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
            <span className="hidden sm:inline">Add Bank Account</span>
            <span className="sm:hidden">Add Account</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        {bankAccounts.length === 0 ? (
          <div className="text-center py-8 md:py-12">
            <Building2 className="h-10 w-10 md:h-12 md:w-12 mx-auto text-muted-foreground mb-3 md:mb-4" />
            <p className="text-sm md:text-base text-muted-foreground mb-3 md:mb-4">No bank account added</p>
            <Button onClick={onAddClick} size="sm" className="text-xs md:text-sm">
              <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
              <span className="hidden sm:inline">Add Bank Account</span>
              <span className="sm:hidden">Add Account</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {bankAccounts.map((account) => (
              <BankAccountCard key={account._id} account={account} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


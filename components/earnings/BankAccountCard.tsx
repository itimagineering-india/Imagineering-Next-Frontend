import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle2 } from "lucide-react";

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

interface BankAccountCardProps {
  account: BankAccount;
}

export function BankAccountCard({ account }: BankAccountCardProps) {
  return (
    <Card className={account.isDefault ? "border-primary" : ""}>
      <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
        <div className="flex items-start justify-between gap-3 md:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2 md:mb-3">
              <Building2 className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground shrink-0" />
              <p className="font-semibold text-sm md:text-base">{account.bankName}</p>
              {account.isDefault && (
                <Badge variant="default" className="text-[10px] md:text-xs">Default</Badge>
              )}
              {account.isVerified && (
                <Badge variant="outline" className="text-success text-[10px] md:text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            <div className="space-y-1 text-xs md:text-sm text-muted-foreground">
              <p className="break-words">Account Holder: {account.accountHolderName}</p>
              <p>Account Number: ••••{account.accountNumber.slice(-4)}</p>
              <p>IFSC: {account.ifscCode}</p>
              <p>Type: {account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)}</p>
              {account.branchName && <p>Branch: {account.branchName}</p>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


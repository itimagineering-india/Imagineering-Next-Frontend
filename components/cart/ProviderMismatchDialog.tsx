import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ProviderMismatchDialogProps = {
  open: boolean;
  onCancel: () => void;
  onClearAndAdd: () => void;
  existingProviderName?: string;
};

export const ProviderMismatchDialog = ({
  open,
  onCancel,
  onClearAndAdd,
  existingProviderName,
}: ProviderMismatchDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Different provider detected</DialogTitle>
          <DialogDescription>
            Your cart already contains services from another provider
            {existingProviderName ? ` (${existingProviderName})` : ""}. Please complete or clear your cart first.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onClearAndAdd}>Clear cart &amp; add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

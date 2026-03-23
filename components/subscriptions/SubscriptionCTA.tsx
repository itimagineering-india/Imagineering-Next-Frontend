import { Button } from "@/components/ui/button";

const SubscriptionCTA = ({
  primary,
  secondary,
  onPrimary,
  onSecondary,
}: {
  primary: string;
  secondary?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
}) => (
  <div className="flex flex-col sm:flex-row gap-3">
    <Button onClick={onPrimary} className="w-full sm:w-auto">
      {primary}
    </Button>
    {secondary && (
      <Button variant="outline" onClick={onSecondary} className="w-full sm:w-auto">
        {secondary}
      </Button>
    )}
  </div>
);

export default SubscriptionCTA;


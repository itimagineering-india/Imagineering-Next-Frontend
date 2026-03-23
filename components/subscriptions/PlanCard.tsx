import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PlanBadge from "./PlanBadge";
import FeatureList from "./FeatureList";

type PlanCardProps = {
  title: string;
  subtitle: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  tone?: "primary" | "gold";
  onClick?: () => void;
};

const PlanCard = ({
  title,
  subtitle,
  price,
  period,
  features,
  cta,
  tone = "primary",
  onClick,
}: PlanCardProps) => {
  const gradient =
    tone === "gold"
      ? "bg-gradient-to-br from-amber-50 via-white to-amber-100"
      : "bg-gradient-to-br from-primary/5 via-white to-primary/10";

  return (
    <Card className={`border-0 shadow-sm hover:shadow-md transition-all ${gradient}`}>
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2">
          <PlanBadge label={tone === "gold" ? "Supplier Premium" : "Buyer Premium"} tone={tone === "gold" ? "gold" : "primary"} />
          <span className="text-xs text-muted-foreground">Monthly / Yearly</span>
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
        <div className="text-3xl font-bold text-foreground">
          {price}
          <span className="text-base font-medium text-muted-foreground"> /{period}</span>
        </div>
      </CardHeader>
      <CardContent>
        <FeatureList items={features} />
      </CardContent>
      <CardFooter>
        <Button className="w-full" variant={tone === "gold" ? "default" : "default"} onClick={onClick}>
          {cta}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PlanCard;


import { Badge } from "@/components/ui/badge";

const PlanBadge = ({ label, tone = "primary" }: { label: string; tone?: "primary" | "gold" }) => {
  const classes =
    tone === "gold"
      ? "bg-amber-100 text-amber-900 border-amber-200"
      : "bg-primary/10 text-primary border-primary/20";
  return (
    <Badge className={classes}>{label}</Badge>
  );
};

export default PlanBadge;


import { CheckCircle2 } from "lucide-react";

const FeatureList = ({ items }: { items: string[] }) => (
  <ul className="space-y-2 text-sm text-muted-foreground">
    {items.map((item) => (
      <li key={item} className="flex gap-2">
        <CheckCircle2 className="h-4 w-4 text-primary mt-[2px]" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

export default FeatureList;


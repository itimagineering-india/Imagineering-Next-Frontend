import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  Code,
  Palette,
  TrendingUp,
  FileText,
  Video,
  Music,
  Briefcase,
  Server,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  Code,
  Palette,
  TrendingUp,
  FileText,
  Video,
  Music,
  Briefcase,
  Server,
};

interface CategoryCardProps {
  name: string;
  icon: string;
  count: number;
  slug: string;
  className?: string;
}

export function CategoryCard({
  name,
  icon,
  count,
  slug,
  className,
}: CategoryCardProps) {
  const IconComponent = iconMap[icon] || Briefcase;

  return (
    <Link href={`/services?category=${slug}`}>
      <Card
        className={cn(
          "group transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50",
          className
        )}
      >
        <CardContent className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <IconComponent className="h-7 w-7" />
          </div>
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
            {name}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {count.toLocaleString()} services
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

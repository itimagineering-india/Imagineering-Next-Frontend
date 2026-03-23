import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ReviewCardProps {
  author: string;
  avatar: string;
  rating: number;
  date: string;
  content: string;
}

export function ReviewCard({
  author,
  avatar,
  rating,
  date,
  content,
}: ReviewCardProps) {
  return (
    <div className="border-b pb-6 last:border-0">
      <div className="flex items-start gap-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatar} alt={author} />
          <AvatarFallback>{author[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">{author}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < rating
                          ? "fill-warning text-warning"
                          : "fill-muted text-muted"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(date), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {content}
          </p>
        </div>
      </div>
    </div>
  );
}

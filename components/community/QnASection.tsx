"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import api from "@/lib/api-client";

type Question = {
  id: string;
  slug: string;
  user: string;
  question: string;
  answers: number;
  tag: string;
};

const QnASection = () => {
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await api.community.getPosts({ type: "question", limit: 6 });
        if (res.success && res.data) {
          const apiPosts = (res.data as any).posts || [];
          const mapped: Question[] = apiPosts.map((p: any) => ({
            id: String(p._id),
            slug: p.slug,
            user: p.author?.name || "Member",
            question: p.title || String(p.body || "").slice(0, 120),
            answers: p.metrics?.commentsCount ?? 0,
            tag: (Array.isArray(p.tags) && p.tags[0]) || (p.topic || "General"),
          }));
          setQuestions(mapped);
        }
      } catch (error) {
        console.error("[QnASection] Failed to load questions", error);
      }
    };

    fetchQuestions();
  }, []);

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
      <div className="container px-4 sm:px-6 space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
              Q&A Hub
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Get expert answers from our community
            </p>
          </div>
          <Button
            size="lg"
            variant="outline"
            className="gap-2 text-sm sm:text-base w-full sm:w-auto border-2 bg-white dark:bg-gray-900 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-300 dark:hover:border-purple-700 transition-all shadow-md"
            asChild
          >
            <Link href="/community/new">
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
              Ask a Question
            </Link>
          </Button>
        </div>
        {questions.length === 0 ? (
          <div className="text-center py-8 bg-card rounded-lg border">
            <p className="text-muted-foreground">
              No questions yet. Be the first to ask the community!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {questions.map((item) => (
              <Link
                key={item.id}
                href={`/community/${item.slug}`}
                className="block"
              >
                <Card className="border shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row gap-3 items-start">
                    <Avatar>
                      <AvatarFallback>{item.user.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <CardTitle className="text-base leading-snug">{item.question}</CardTitle>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[10px] px-2 py-0">
                          {item.tag}
                        </Badge>
                        <span>{item.answers} answers</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button size="sm" className="w-full gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Answer Now
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default QnASection;


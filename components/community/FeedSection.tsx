"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import PostCard, { Post } from "./PostCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Filter, Plus } from "lucide-react";
import api from "@/lib/api-client";

const FeedSection = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const res = await api.community.getPosts({ limit: 6 });
        if (res.success && res.data) {
          const apiPosts = (res.data as any).posts || [];
          const mapped: Post[] = apiPosts.map((p: any) => {
            const createdAt = p.createdAt ? new Date(p.createdAt) : new Date();
            const time = formatDistanceToNow(createdAt, { addSuffix: true });
            const text =
              typeof p.title === "string" && p.title.trim()
                ? p.title
                : String(p.body || "").slice(0, 160);
            return {
              id: String(p._id),
              slug: p.slug,
              author: p.author?.name || "Community member",
              avatar: p.author?.avatar,
              role: p.author?.role,
              time,
              text,
              likes: p.metrics?.likes ?? 0,
              comments: p.metrics?.commentsCount ?? 0,
            };
          });
          setPosts(mapped);
        }
      } catch (error) {
        console.error("[FeedSection] Failed to load posts", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="container px-4 sm:px-6 space-y-6 sm:space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400">
              Latest Posts
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Trending discussions from the community
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 text-xs sm:text-sm border-2 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-700 transition-all" 
              asChild
            >
              <Link href="/community/new">
                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                New Post
              </Link>
            </Button>
            <Badge 
              variant="secondary" 
              className="text-xs bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
            >
              {isLoading ? "Loading..." : "🔴 Live"}
            </Badge>
          </div>
        </div>

        {posts.length === 0 && !isLoading ? (
          <div className="text-center py-16 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mb-4 shadow-lg">
              <Plus className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Start the Conversation</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              No posts yet. Be the first to share with the community!
            </p>
            <Button asChild size="lg" className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
              <Link href="/community/new">
                <Plus className="h-5 w-5" />
                Create First Post
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, idx) => (
              <Link
                key={post.id}
                href={post.slug ? `/community/${post.slug}` : "/community"}
                className="block group animate-fade-in-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <PostCard post={post} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeedSection;


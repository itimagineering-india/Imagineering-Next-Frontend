"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Bookmark, Share2 } from "lucide-react";

export type Post = {
  id: string;
  slug?: string;
  author: string;
  avatar?: string;
  time: string;
  text: string;
  image?: string;
  role?: string;
  likes?: number;
  comments?: number;
};

const PostCard = ({ post }: { post: Post }) => {
  return (
    <Card className="border-2 border-gray-200/50 dark:border-gray-700/50 shadow-md hover:shadow-2xl hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 hover:-translate-y-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm overflow-hidden group">
      <CardHeader className="flex flex-row items-center gap-2 sm:gap-3 p-4 sm:p-5 bg-gradient-to-r from-gray-50/50 to-blue-50/30 dark:from-gray-800/50 dark:to-blue-950/30">
        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-blue-500/20 group-hover:ring-blue-500/40 transition-all">
          {post.avatar ? (
            <AvatarImage src={post.avatar} alt={post.author} />
          ) : (
            <AvatarFallback className="text-xs sm:text-sm bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold">
              {post.author.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-bold text-foreground truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {post.author}
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
            {post.role ? `${post.role} • ` : ""}{post.time}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-5">
        <p className="text-sm sm:text-base text-foreground leading-relaxed line-clamp-3 font-medium group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
          {post.text}
        </p>
        {post.image && (
          <div className="overflow-hidden rounded-lg sm:rounded-xl border-2 border-gray-200 dark:border-gray-700 group-hover:border-blue-300 dark:group-hover:border-blue-700 transition-all">
            <img src={post.image} alt={post.text} className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground p-4 sm:p-5 pt-0 border-t border-gray-100 dark:border-gray-800">
        <Button variant="ghost" size="sm" className="gap-1.5 h-8 px-2 sm:px-3 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition-colors">
          <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="font-semibold">{post.likes ?? 0}</span>
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5 h-8 px-2 sm:px-3 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="font-semibold">{post.comments ?? 0}</span>
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5 h-8 px-2 sm:px-3 ml-auto hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors hidden sm:flex">
          <Bookmark className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="font-medium">Save</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PostCard;


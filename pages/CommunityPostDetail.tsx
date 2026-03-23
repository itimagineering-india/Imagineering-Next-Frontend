"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";

export async function getServerSideProps() { return { props: {} }; }

interface CommunityPostAuthor {
  _id: string;
  name: string;
  avatar?: string;
  role?: string;
}

interface CommunityPost {
  _id: string;
  slug: string;
  title: string;
  body: string;
  type: string;
  topic?: string;
  tags?: string[];
  author: CommunityPostAuthor;
  metrics?: {
    views?: number;
    likes?: number;
    commentsCount?: number;
  };
  createdAt: string;
}

interface CommunityComment {
  _id: string;
  body: string;
  author: CommunityPostAuthor;
  createdAt: string;
}

const CommunityPostDetail = () => {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : params?.slug?.[0];
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const fetchPost = async () => {
      setLoading(true);
      try {
        const res = await api.community.getPostBySlug(slug);
        if (!res.success || !res.data) {
          throw new Error((res.error as any)?.message || "Failed to load post");
        }
        const data = res.data as any;
        setPost(data.post);
        setComments(data.comments || []);

        // Basic SEO metadata
        const title = data.post?.title
          ? `${data.post.title} | Community | Imagineering India`
          : "Community Post | Imagineering India";
        const body = String(data.post?.body || "");
        const description =
          body.length > 160 ? body.slice(0, 157).replace(/\s+\S*$/, "") + "..." : body;

        document.title = title;
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
          metaDescription = document.createElement("meta");
          metaDescription.setAttribute("name", "description");
          document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute("content", description);

        const url = window.location.href;

        const ogTags = [
          { property: "og:title", content: title },
          { property: "og:description", content: description },
          { property: "og:url", content: url },
          { property: "og:type", content: "article" },
        ];

        ogTags.forEach(({ property, content }) => {
          let tag = document.querySelector(`meta[property="${property}"]`);
          if (!tag) {
            tag = document.createElement("meta");
            tag.setAttribute("property", property);
            document.head.appendChild(tag);
          }
          tag.setAttribute("content", content);
        });

        // Basic JSON-LD Article schema
        const scriptId = "community-post-ldjson";
        const articleData = {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: data.post?.title || "Community Post",
          description,
          author: {
            "@type": "Person",
            name: data.post?.author?.name || "Community member",
          },
          datePublished: data.post?.createdAt,
          dateModified: data.post?.updatedAt || data.post?.createdAt,
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": url,
          },
        };

        let ldJson = document.getElementById(scriptId) as HTMLScriptElement | null;
        if (!ldJson) {
          ldJson = document.createElement("script");
          ldJson.id = scriptId;
          ldJson.type = "application/ld+json";
          document.head.appendChild(ldJson);
        }
        ldJson.textContent = JSON.stringify(articleData);
      } catch (error: any) {
        console.error("[CommunityPostDetail] Failed to load post", error);
        toast({
          title: "Error",
          description: error?.message || "Failed to load community post",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug, toast]);

  const handleSubmitComment = async () => {
    if (!post || !commentText.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.community.addComment(post._id, commentText.trim());
      if (!res.success || !res.data) {
        throw new Error((res.error as any)?.message || "Failed to add comment");
      }
      const newComment = (res.data as any).comment as CommunityComment;
      setComments((prev) => [...prev, newComment]);
      setCommentText("");
      toast({ title: "Comment added" });
    } catch (error: any) {
      console.error("[CommunityPostDetail] Failed to add comment", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const createdAt =
    post?.createdAt && !Number.isNaN(Date.parse(post.createdAt))
      ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
      : "";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        <section className="py-6 sm:py-10 md:py-14 bg-muted/20">
          <div className="container max-w-4xl px-4 sm:px-6 space-y-4 sm:space-y-6">
            <div className="text-xs sm:text-sm text-muted-foreground">
              <Link href="/" className="hover:underline">
                Home
              </Link>
              {" / "}
              <Link href="/community" className="hover:underline">
                Community
              </Link>
              {post?.topic ? (
                <>
                  {" / "}
                  <span>{post.topic}</span>
                </>
              ) : null}
            </div>

            {loading && (
              <div className="py-10 text-center text-muted-foreground">Loading post...</div>
            )}

            {!loading && !post && (
              <div className="py-10 text-center text-muted-foreground">
                This community post could not be found.
              </div>
            )}

            {post && (
              <>
                <Card>
                  <CardHeader className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                          {post.author?.avatar ? (
                            <AvatarImage src={post.author.avatar} alt={post.author.name} />
                          ) : (
                            <AvatarFallback className="text-xs sm:text-sm">
                              {post.author?.name?.slice(0, 2).toUpperCase() || "U"}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="text-xs sm:text-sm font-semibold text-foreground">
                            {post.author?.name || "Community member"}
                          </p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {post.author?.role ? `${post.author.role} • ` : ""}
                            {createdAt}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {post.type && (
                          <Badge variant="outline" className="text-[10px] sm:text-xs">
                            {post.type === "question" ? "Question" : post.type}
                          </Badge>
                        )}
                        {Array.isArray(post.tags) &&
                          post.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px] sm:text-xs">
                              {tag}
                            </Badge>
                          ))}
                      </div>
                    </div>
                    <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 prose prose-sm sm:prose-base max-w-none dark:prose-invert">
                    <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{post.body}</p>
                  </CardContent>
                </Card>

                <div className="space-y-3 sm:space-y-4">
                  <h2 className="text-base sm:text-lg font-semibold mt-6 sm:mt-8">Discussion</h2>

                  {isAuthenticated ? (
                    <Card>
                      <CardContent className="space-y-3 p-4 sm:p-6 sm:pt-6">
                        <Textarea
                          placeholder="Share your thoughts or answer this question..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          rows={4}
                          className="text-sm sm:text-base"
                        />
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            onClick={handleSubmitComment}
                            disabled={submitting || !commentText.trim()}
                            className="w-full sm:w-auto"
                          >
                            {submitting ? "Posting..." : "Post comment"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Please{" "}
                      <Link href="/login" className="underline">
                        log in
                      </Link>{" "}
                      to participate in the discussion.
                    </p>
                  )}

                  <div className="space-y-2 sm:space-y-3">
                    {comments.length === 0 && (
                      <p className="text-xs sm:text-sm text-muted-foreground py-4">
                        No comments yet. Be the first to start the discussion.
                      </p>
                    )}
                    {comments.map((c) => (
                      <Card key={c._id}>
                        <CardContent className="flex gap-2 sm:gap-3 p-3 sm:p-4">
                          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 mt-0.5 sm:mt-1 flex-shrink-0">
                            {c.author?.avatar ? (
                              <AvatarImage src={c.author.avatar} alt={c.author.name} />
                            ) : (
                              <AvatarFallback className="text-xs">
                                {c.author?.name?.slice(0, 2).toUpperCase() || "U"}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                              <span className="text-xs sm:text-sm font-medium truncate">
                                {c.author?.name || "Member"}
                              </span>
                              <span className="text-[10px] sm:text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-foreground leading-relaxed break-words">{c.body}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default CommunityPostDetail;


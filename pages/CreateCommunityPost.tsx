"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, FileText, Award, HelpCircle, Loader2 } from "lucide-react";
import api from "@/lib/api-client";

export async function getServerSideProps() { return { props: {} }; }

const postTypes = [
  { value: "question", label: "Question", icon: HelpCircle, description: "Ask the community for help" },
  { value: "discussion", label: "Discussion", icon: MessageSquare, description: "Start a conversation" },
  { value: "showcase", label: "Showcase", icon: Award, description: "Share your work or success" },
  { value: "guide", label: "Guide", icon: FileText, description: "Share tips and knowledge" },
];

const CreateCommunityPost = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<string>("discussion");
  const [topic, setTopic] = useState("");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please log in to create a community post",
        variant: "destructive",
      });
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router, toast]);

  useEffect(() => {
    document.title = "Create Post | Community | Imagineering India";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !body.trim()) {
      toast({
        title: "Validation error",
        description: "Title and content are required",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const tagArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 5);

      const res = await api.community.createPost({
        title: title.trim(),
        body: body.trim(),
        type,
        topic: topic.trim() || undefined,
        tags: tagArray.length > 0 ? tagArray : undefined,
      });

      if (!res.success || !res.data) {
        throw new Error((res.error as any)?.message || "Failed to create post");
      }

      const postData = (res.data as any).post;
      const slug = postData?.slug;

      toast({
        title: "Post created",
        description: "Your post is now live in the community",
      });

      if (slug) {
        router.push(`/community/${slug}`);
      } else {
        router.push("/community");
      }
    } catch (error: any) {
      console.error("[CreateCommunityPost] Failed to create", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedTypeObj = postTypes.find((pt) => pt.value === type);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        <section className="py-6 sm:py-10 md:py-14 bg-muted/20">
          <div className="container max-w-3xl px-4 sm:px-6 space-y-4 sm:space-y-6">
            <div className="text-xs sm:text-sm text-muted-foreground">
              <Link href="/" className="hover:underline">
                Home
              </Link>
              {" / "}
              <Link href="/community" className="hover:underline">
                Community
              </Link>
              {" / "}
              <span>Create Post</span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Share with the Community</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Ask questions, share experiences, or start a discussion with fellow buyers and
                providers.
              </p>
            </div>

            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">New Post</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="type">Post Type</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {postTypes.map((pt) => (
                          <SelectItem key={pt.value} value={pt.value}>
                            <div className="flex items-center gap-2">
                              <pt.icon className="h-4 w-4" />
                              <span>{pt.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedTypeObj && (
                      <p className="text-sm text-muted-foreground">
                        {selectedTypeObj.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">
                      Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder={
                        type === "question"
                          ? "What's your question?"
                          : "Give your post a clear title"
                      }
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={200}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {title.length}/200 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="body">
                      Content <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="body"
                      placeholder={
                        type === "question"
                          ? "Describe your question in detail..."
                          : "Share your thoughts, experiences, or insights..."
                      }
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={10}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum 20 characters recommended
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="topic">Topic (optional)</Label>
                      <Input
                        id="topic"
                        placeholder="e.g., Materials, Machines"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        maxLength={50}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags (optional)</Label>
                      <Input
                        id="tags"
                        placeholder="construction, concrete, bhopal"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Comma-separated, max 5 tags
                      </p>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-lg">
                    <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300">
                      <strong>Tip:</strong> Clear, specific titles and detailed content get more
                      engagement from the community.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/community")}
                      disabled={submitting}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting || !title.trim() || !body.trim()} className="w-full sm:w-auto">
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        "Post to Community"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CreateCommunityPost;

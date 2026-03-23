"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageSquare, Send, ArrowLeft, Loader2, MoreVertical, Ban, Flag, UserX } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useBuyerPremium } from "@/hooks/useBuyerPremium";
import { useProviderPremium } from "@/hooks/useProviderPremium";
import {
  createOrGetConversation,
  getConversations,
  subscribeToMessages,
  sendMessage,
  getOtherParticipant,
  type Conversation,
  type ChatMessage,
} from "@/lib/chatService";
import api from "@/lib/api-client";
import { formatDistanceToNow } from "date-fns";

export default function Chat() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { isPremium: isBuyerPremium, loading: buyerSubLoading } = useBuyerPremium();
  const { isPremium: isProviderPremium, loading: providerSubLoading } = useProviderPremium();
  const subscriptionLoading = user?.role === "buyer" ? buyerSubLoading : providerSubLoading;
  const isProviderWithoutSub = user?.role === "provider" && !providerSubLoading && !isProviderPremium;
  const providerIdParam = searchParams?.get("providerId");
  const serviceIdParam = searchParams?.get("serviceId");
  const otherNameParam = searchParams?.get("name");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [openingConv, setOpeningConv] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [otherNames, setOtherNames] = useState<Record<string, string>>({});
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [blocking, setBlocking] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [blockedListOpen, setBlockedListOpen] = useState(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  const { toast } = useToast();

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onchange = () => setIsMobile(mq.matches);
    mq.addEventListener("change", onchange);
    return () => mq.removeEventListener("change", onchange);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Open conversation from URL params
  useEffect(() => {
    if (
      !isAuthenticated ||
      !user?._id ||
      !providerIdParam ||
      providerIdParam === user._id
    )
      return;

    const openConversation = async () => {
      setOpeningConv(true);
      setOpenError(null);
      try {
        const blockRes = await api.chat.getBlockedUsers();
        const blockedIds = blockRes.success ? (blockRes.data as { blockedUsers?: string[] } | undefined)?.blockedUsers : [];
        if (blockedIds?.includes(providerIdParam)) {
          setOpenError("You have blocked this user.");
          return;
        }
        const conv = await createOrGetConversation(
          (user._id ?? "") as string,
          providerIdParam ?? "",
          serviceIdParam || undefined
        );
        setSelectedConv(conv);
        setConversations((prev) => {
          if (prev.some((c) => c.id === conv.id)) return prev;
          return [conv, ...prev];
        });
        if (otherNameParam) {
          setOtherNames((prev) => ({ ...prev, [providerIdParam]: otherNameParam }));
        }
      } catch (e) {
        console.error("Failed to create conversation:", e);
        setOpenError(
          e instanceof Error ? e.message : "Chat could not be opened. Please try again or sign in."
        );
      } finally {
        setOpeningConv(false);
      }
    };

    openConversation();
  }, [isAuthenticated, user?._id, providerIdParam, serviceIdParam, otherNameParam]);

  // Load conversations
  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    getConversations(user._id ?? "").then((list) => {
      if (cancelled) return;
      setConversations(list);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?._id]);

  // Fetch blocked users
  useEffect(() => {
    if (!isAuthenticated || !user?._id) return;
    api.chat.getBlockedUsers().then((res) => {
      const list = res.success ? (res.data as { blockedUsers?: string[] } | undefined)?.blockedUsers : undefined;
      if (list) setBlockedUsers(new Set(list));
    }).catch(() => {});
  }, [isAuthenticated, user?._id]);

  // Fetch names for other participants
  useEffect(() => {
    if (!user?._id) return;

    const ids = new Set<string>();
    conversations.forEach((c) => {
      ids.add(getOtherParticipant(c, user._id ?? ""));
    });
    if (selectedConv) {
      ids.add(getOtherParticipant(selectedConv, user._id ?? ""));
    }

    ids.forEach((id) => {
      if (otherNames[id]) return;
      api.providers
        .getById(id)
        .then((res) => {
          if (res.success && res.data) {
            const data = res.data as any;
            const p = data.provider || data;
            const name = p?.businessName || p?.user?.name || p?.name || "User";
            setOtherNames((prev) => ({ ...prev, [id]: name }));
          }
        })
        .catch(() => {
          setOtherNames((prev) => ({ ...prev, [id]: "User" }));
        });
    });
  }, [conversations, selectedConv, user?._id]);

  // Fetch names for blocked users (when blocked list is shown)
  useEffect(() => {
    if (!blockedListOpen || blockedUsers.size === 0) return;
    blockedUsers.forEach((id) => {
      if (otherNames[id]) return;
      api.providers
        .getByUserId(id)
        .then((res) => {
          if (res.success && res.data) {
            const data = res.data as any;
            const p = data.provider || data;
            const name = p?.businessName || p?.user?.name || p?.name || "User";
            setOtherNames((prev) => ({ ...prev, [id]: name }));
          }
        })
        .catch(() => {
          setOtherNames((prev) => ({ ...prev, [id]: "User" }));
        });
    });
  }, [blockedListOpen, blockedUsers]);

  // Subscribe to messages for selected conversation (providers without sub don't load messages)
  useEffect(() => {
    if (!selectedConv?.id || isProviderWithoutSub) {
      setMessages([]);
      return;
    }

    const unsubscribe = subscribeToMessages(selectedConv.id, (msgs) => {
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [selectedConv?.id, isProviderWithoutSub]);

  const handleSend = async () => {
    if (!input.trim() || !selectedConv || !user?._id || sending) return;

    setSending(true);
    const textToSend = input.trim();
    setInput("");
    try {
      const newMsg = await sendMessage(selectedConv.id, user._id ?? "", textToSend);
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    } catch (e) {
      console.error("Send failed:", e);
      setInput(textToSend);
    } finally {
      setSending(false);
    }
  };

  const getOtherName = (conv: Conversation) => {
    const otherId = getOtherParticipant(conv, user?._id || "");
    return otherNames[otherId] || "User";
  };

  const otherUserId = selectedConv ? getOtherParticipant(selectedConv, user?._id || "") : null;

  const handleBlock = async () => {
    if (!otherUserId || blocking) return;
    setBlocking(true);
    try {
      const res = await api.chat.blockUser(otherUserId);
      const list = res.success ? (res.data as { blockedUsers?: string[] } | undefined)?.blockedUsers : undefined;
      if (list) {
        setBlockedUsers(new Set(list));
        setSelectedConv(null);
        toast({ title: "User blocked", description: "You won't see messages from this user anymore." });
      }
      else {
        toast({ title: "Failed to block", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to block", variant: "destructive" });
    } finally {
      setBlocking(false);
    }
  };

  const handleUnblock = async (targetUserId: string) => {
    if (unblockingId) return;
    setUnblockingId(targetUserId);
    try {
      const res = await api.chat.unblockUser(targetUserId);
      const list = res.success ? (res.data as { blockedUsers?: string[] } | undefined)?.blockedUsers : undefined;
      if (list) {
        setBlockedUsers(new Set(list));
        toast({ title: "User unblocked", description: "You can now see messages from this user again." });
      } else {
        toast({ title: "Failed to unblock", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to unblock", variant: "destructive" });
    } finally {
      setUnblockingId(null);
    }
  };

  const handleReportSubmit = async () => {
    if (!otherUserId || !reportReason.trim() || reporting) return;
    setReporting(true);
    try {
      const res = await api.chat.reportUser({
        reportedUserId: otherUserId,
        conversationId: selectedConv?.id,
        reason: reportReason.trim(),
        description: reportDescription.trim() || undefined,
      });
      if (res.success) {
        setReportOpen(false);
        setReportReason("");
        setReportDescription("");
        toast({ title: "Report submitted", description: "Our team will review your report." });
      } else {
        toast({ title: "Failed to submit report", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to submit report", variant: "destructive" });
    } finally {
      setReporting(false);
    }
  };

  if (!isAuthenticated) {
    router.push(`/login?redirect=${encodeURIComponent("/chat" + (providerIdParam ? `?providerId=${providerIdParam}` : ""))}`);
    return null;
  }

  // Buyers need subscription to chat
  if (user?.role === "buyer" && !subscriptionLoading && !isBuyerPremium) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 container max-w-md mx-auto px-4 py-12 flex flex-col items-center justify-center text-center">
          <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Subscription Required</h2>
          <p className="text-muted-foreground mb-6">
            Please subscribe to a buyer plan to chat with providers.
          </p>
          <Button onClick={() => router.push("/subscriptions/buyer")}>
            View Subscription Plans
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 min-h-0 overflow-hidden">
        {/* Header: on mobile in chat view, back goes to list; else back goes to previous page */}
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-9 w-9 sm:h-10 sm:w-10"
            onClick={() => (isMobile && selectedConv) ? setSelectedConv(null) : router.back()}
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">Messages</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 h-[calc(100vh-180px)] sm:h-[calc(100vh-200px)] md:h-[calc(100vh-220px)] min-h-[320px] overflow-hidden">
          {/* Conversation list - hidden on mobile when chat is open */}
          <Card className={`overflow-hidden flex flex-col min-h-0 ${selectedConv && isMobile ? "hidden md:flex" : ""}`}>
            <CardHeader className="py-2.5 sm:py-3 border-b shrink-0 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Your conversations
                </p>
                {blockedUsers.size > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={() => setBlockedListOpen(true)}
                  >
                    <UserX className="h-3.5 w-3.5 mr-1" />
                    Blocked ({blockedUsers.size})
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0 min-h-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : conversations.length === 0 && !providerIdParam ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    No conversations yet. Browse services to find a provider and start chatting.
                  </p>
                  <Button size="sm" onClick={() => router.push("/services")}>
                    Browse Services
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {conversations
                    .filter((conv) => !blockedUsers.has(getOtherParticipant(conv, user?._id || "")))
                    .map((conv) => (
                    <button
                      key={conv.id}
                      type="button"
                      className={`w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 active:bg-muted/70 transition-colors min-h-[56px] touch-manipulation ${
                        selectedConv?.id === conv.id ? "bg-muted" : ""
                      }`}
                      onClick={() => setSelectedConv(conv)}
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getOtherName(conv).slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{getOtherName(conv)}</p>
                        {conv.lastMessage && (
                          <p className="text-xs text-muted-foreground truncate">
                            {isProviderWithoutSub ? "New message" : conv.lastMessage.text}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                  {providerIdParam && selectedConv && !conversations.find((c) => c.id === selectedConv.id) && (
                    <div className="p-3 border-t">
                      <p className="text-xs text-muted-foreground">New chat</p>
                      <p className="font-medium">{getOtherName(selectedConv)}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Message thread - hidden on mobile when no conversation selected */}
          <Card className={`overflow-hidden flex flex-col ${!selectedConv && isMobile ? "hidden" : ""}`}>
            {selectedConv ? (
              isProviderWithoutSub ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-8 min-h-0">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                  <h2 className="text-lg font-semibold mb-2">Subscription Required</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Someone has messaged you. Subscribe to view messages and respond to buyers.
                  </p>
                  <Button onClick={() => router.push("/subscriptions/supplier")}>
                    View Subscription Plans
                  </Button>
                </div>
              ) : (
              <>
                <CardHeader className="py-2.5 sm:py-3 border-b flex flex-row items-center justify-between gap-2 sm:gap-3 shrink-0">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <Avatar className="h-8 w-8 sm:h-9 sm:w-9 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {getOtherName(selectedConv).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{getOtherName(selectedConv)}</p>
                      <p className="text-xs text-muted-foreground">
                        Chat through the platform
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="More options">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleBlock} disabled={blocking} className="text-destructive focus:text-destructive">
                        <Ban className="mr-2 h-4 w-4" />
                        {blocking ? "Blocking..." : "Block user"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setReportOpen(true)}>
                        <Flag className="mr-2 h-4 w-4" />
                        Report user
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>

                <Dialog open={reportOpen} onOpenChange={setReportOpen}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Report user</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Reason</label>
                        <select
                          value={reportReason}
                          onChange={(e) => setReportReason(e.target.value)}
                          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Select a reason</option>
                          <option value="spam">Spam</option>
                          <option value="harassment">Harassment</option>
                          <option value="inappropriate">Inappropriate content</option>
                          <option value="scam">Scam / Fraud</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Additional details (optional)</label>
                        <textarea
                          value={reportDescription}
                          onChange={(e) => setReportDescription(e.target.value)}
                          placeholder="Describe what happened..."
                          className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setReportOpen(false)} disabled={reporting}>
                        Cancel
                      </Button>
                      <Button onClick={handleReportSubmit} disabled={!reportReason.trim() || reporting}>
                        {reporting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        {reporting ? "Submitting..." : "Submit report"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <CardContent className="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col gap-3 min-h-0">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderId === user?._id ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[80%] rounded-lg px-3 py-2 ${
                          msg.senderId === user?._id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                        <p
                          className={`text-[10px] mt-1 ${
                            msg.senderId === user?._id
                              ? "text-primary-foreground/80"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formatDistanceToNow(msg.createdAt, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </CardContent>
                <div className="p-2 sm:p-3 border-t flex gap-2 shrink-0">
                  <Input
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    className="flex-1"
                    disabled={sending}
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </>
              )
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-8 min-h-0">
                {openingConv ? (
                  <>
                    <Loader2 className="h-16 w-16 text-muted-foreground mb-4 animate-spin" />
                    <p className="text-muted-foreground">Opening chat...</p>
                  </>
                ) : openError ? (
                  <>
                    <MessageSquare className="h-16 w-16 text-destructive/60 mb-4" />
                    <p className="text-sm text-muted-foreground mb-2">{openError}</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Check that you are logged in and the chat service is reachable.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => window.location.reload()}>
                        Retry
                      </Button>
                      <Button onClick={() => router.push("/services")}>
                        Browse Services
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Select a conversation or contact a provider to start chatting.
                    </p>
                    <Button onClick={() => router.push("/services")}>
                      Browse Services & Start Chat
                    </Button>
                  </>
                )}
              </div>
            )}
          </Card>
        </div>
      </main>

      <Dialog open={blockedListOpen} onOpenChange={setBlockedListOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Blocked users</DialogTitle>
          </DialogHeader>
          <div className="py-2 max-h-64 overflow-y-auto">
            {Array.from(blockedUsers).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">You have not blocked anyone.</p>
            ) : (
              <div className="space-y-2">
                {Array.from(blockedUsers).map((userId) => (
                  <div
                    key={userId}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{otherNames[userId] || "User"}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnblock(userId)}
                      disabled={unblockingId === userId}
                    >
                      {unblockingId === userId ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unblock"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

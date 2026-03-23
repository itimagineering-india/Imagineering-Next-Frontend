/**
 * Chat – Backend API + Socket.io (aligned with main React app).
 */
import { io, Socket } from "socket.io-client";
import { getAuthToken } from "@/lib/api-client";

const API_BASE = (
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_BASE_URL) ||
  "http://localhost:5000"
).replace(/\/$/, "");

function chatHeaders(json = false): HeadersInit {
  const token = getAuthToken();
  const h: Record<string, string> = {};
  if (json) h["Content-Type"] = "application/json";
  if (token && token !== "cookie") h.Authorization = `Bearer ${token}`;
  return h;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: Date;
  readAt?: Date;
}

export interface Conversation {
  id: string;
  buyerId: string;
  providerId: string;
  serviceId?: string;
  lastMessage?: {
    text: string;
    createdAt: Date;
    senderId: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

let socket: Socket | null = null;

function getSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  const token = getAuthToken();
  if (!token) return null;

  if (!socket || !socket.connected) {
    socket = io(API_BASE, {
      auth: token && token !== "cookie" ? { token } : undefined,
      path: "/socket.io",
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
  }
  return socket;
}

function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function disconnectChat(): void {
  disconnectSocket();
}

export async function createOrGetConversation(
  buyerId: string,
  providerId: string,
  serviceId?: string
): Promise<Conversation> {
  const res = await fetch(`${API_BASE}/api/chat/conversations`, {
    method: "POST",
    headers: chatHeaders(true),
    credentials: "include",
    body: JSON.stringify({ providerId, serviceId }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json?.error?.message || json?.message || "Failed to create conversation");
  }
  const conv = json.data?.conversation;
  if (!conv) throw new Error("Invalid response");
  return normalizeConversation(conv);
}

export async function getConversations(_userId: string): Promise<Conversation[]> {
  const res = await fetch(`${API_BASE}/api/chat/conversations`, {
    headers: chatHeaders(false),
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json?.error?.message || json?.message || "Failed to load conversations");
  }
  const list = json.data?.conversations || [];
  return list.map(normalizeConversation);
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string
): Promise<ChatMessage> {
  const res = await fetch(`${API_BASE}/api/chat/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: chatHeaders(true),
    credentials: "include",
    body: JSON.stringify({ text }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json?.error?.message || json?.message || "Failed to send message");
  }
  const msg = json.data?.message;
  if (!msg) throw new Error("Invalid response: no message returned");
  return normalizeMessage(msg);
}

async function fetchMessages(conversationId: string, limit = 100, before?: string): Promise<ChatMessage[]> {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  if (before) params.set("before", before);
  const res = await fetch(
    `${API_BASE}/api/chat/conversations/${conversationId}/messages?${params}`,
    { headers: chatHeaders(false), credentials: "include" }
  );
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json?.error?.message || json?.message || "Failed to load messages");
  }
  const list = json.data?.messages || [];
  return list.map(normalizeMessage);
}

export function subscribeToMessages(
  conversationId: string,
  callback: (messages: ChatMessage[]) => void
): () => void {
  let messages: ChatMessage[] = [];
  let mounted = true;
  let joinRoomRef: (() => void) | null = null;

  const load = async () => {
    try {
      const list = await fetchMessages(conversationId);
      if (mounted) {
        messages = list;
        callback([...messages]);
      }
    } catch (e) {
      console.error("Chat: failed to load messages", e);
      if (mounted) callback([]);
    }
  };

  load();

  const s = getSocket();
  if (s) {
    const joinRoom = () => s.emit("chat:join", conversationId);
    joinRoomRef = joinRoom;
    joinRoom();
    s.on("connect", joinRoom);
    const onMsg = (msg: unknown) => {
      const m = normalizeMessage(msg);
      if (m.conversationId === conversationId && mounted) {
        const idx = messages.findIndex((x) => x.id === m.id);
        if (idx >= 0) messages[idx] = m;
        else messages.push(m);
        callback([...messages]);
      }
    };
    s.on("chat:message", onMsg);

    return () => {
      mounted = false;
      if (joinRoomRef) s.off("connect", joinRoomRef);
      s.off("chat:message", onMsg);
      s.emit("chat:leave", conversationId);
    };
  }

  const pollInterval = setInterval(load, 5000);
  return () => {
    mounted = false;
    clearInterval(pollInterval);
  };
}

export function getOtherParticipant(conv: Conversation, currentUserId: string): string {
  return conv.buyerId === currentUserId ? conv.providerId : conv.buyerId;
}

function normalizeConversation(c: Record<string, unknown>): Conversation {
  const last = c.lastMessage as Record<string, unknown> | undefined;
  return {
    id: String(c.id ?? c._id ?? ""),
    buyerId: String(c.buyerId ?? ""),
    providerId: String(c.providerId ?? ""),
    serviceId: c.serviceId ? String(c.serviceId) : undefined,
    lastMessage: last
      ? {
          text: String(last.text ?? ""),
          createdAt: last.createdAt ? new Date(last.createdAt as string) : new Date(),
          senderId: String(last.senderId ?? ""),
        }
      : undefined,
    createdAt: c.createdAt ? new Date(c.createdAt as string) : new Date(),
    updatedAt: c.updatedAt ? new Date(c.updatedAt as string) : new Date(),
  };
}

function normalizeMessage(m: unknown): ChatMessage {
  const x = m as Record<string, unknown>;
  return {
    id: String(x.id ?? x._id ?? ""),
    conversationId: String(x.conversationId ?? ""),
    senderId: String(x.senderId ?? ""),
    text: String(x.text ?? ""),
    createdAt: x.createdAt ? new Date(x.createdAt as string) : new Date(),
    readAt: x.readAt ? new Date(x.readAt as string) : undefined,
  };
}

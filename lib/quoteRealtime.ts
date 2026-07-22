/**
 * Real-time quote request updates (Socket.io — same server as chat).
 */
import { io, Socket } from "socket.io-client";
import { getAuthToken } from "@/lib/api-client";

const API_BASE = (
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_BASE_URL) ||
  "http://localhost:5001"
).replace(/\/$/, "");

export type QuoteUpdatePayload = {
  quoteRequestId: string;
  reason: "offer" | "cancelled" | "ordered" | "expired" | "created";
  data?: any;
  at?: string;
};

let socket: Socket | null = null;

function getQuoteSocket(): Socket | null {
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

export function subscribeToQuoteRequest(
  quoteRequestId: string,
  onUpdate: (payload: QuoteUpdatePayload) => void
): () => void {
  if (typeof window === "undefined" || !quoteRequestId) return () => {};

  let mounted = true;
  const s = getQuoteSocket();
  if (!s) return () => {};

  const join = () => s.emit("quote:join", quoteRequestId);
  const onConnect = () => join();
  join();
  s.on("connect", onConnect);

  const onEvent = (payload: QuoteUpdatePayload) => {
    if (!mounted) return;
    if (!payload || String(payload.quoteRequestId) !== String(quoteRequestId)) return;
    onUpdate(payload);
  };
  s.on("quote:update", onEvent);

  return () => {
    mounted = false;
    s.off("connect", onConnect);
    s.off("quote:update", onEvent);
    s.emit("quote:leave", quoteRequestId);
  };
}

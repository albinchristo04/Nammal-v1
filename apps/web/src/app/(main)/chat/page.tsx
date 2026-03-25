"use client";

import {
  useEffect, useRef, useState, useCallback, FormEvent,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { io, Socket } from "socket.io-client";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  sentAt: string;
}

interface ChatUserProfile {
  fullName: string;
  photos: { url: string; isPrimary: boolean }[];
}
interface ChatUser {
  id: string;
  phone: string;
  profile: ChatUserProfile | null;
}
interface ChatThread {
  id: string;
  userAId: string;
  userBId: string;
  createdAt: string;
  isBlocked: boolean;
  blockedBy: string | null;
  messages: Message[];
  userA: ChatUser;
  userB: ChatUser;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function otherUser(chat: ChatThread, myId: string): ChatUser {
  return chat.userAId === myId ? chat.userB : chat.userA;
}

function displayName(user: ChatUser): string {
  return user.profile?.fullName ?? user.phone;
}

function primaryPhoto(user: ChatUser): string | null {
  const photos = user.profile?.photos ?? [];
  return (photos.find((p) => p.isPrimary) ?? photos[0])?.url ?? null;
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ user, size = 44 }: { user: ChatUser; size?: number }) {
  const url = primaryPhoto(user);
  const initials = displayName(user).slice(0, 1).toUpperCase();
  return (
    <div className="flex-none relative rounded-full overflow-hidden" style={{ width: size, height: size, background: "#EDE3D9" }}>
      {url ? (
        <Image src={url} fill alt={displayName(user)} className="object-cover" sizes={`${size}px`} />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={{ color: "#6B1320" }}>{initials}</span>
      )}
    </div>
  );
}

function ReportModal({
  chatId,
  onClose,
  onDone,
}: {
  chatId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const REASONS = [
    { value: "HARASSMENT", label: "Harassment" },
    { value: "FAKE_PROFILE", label: "Fake Profile" },
    { value: "INAPPROPRIATE_CONTENT", label: "Inappropriate Content" },
    { value: "SPAM", label: "Spam" },
    { value: "OTHER", label: "Other" },
  ];
  const [reason, setReason] = useState("HARASSMENT");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await api.post(`/api/chats/${chatId}/report`, { reason, details });
      onDone();
    } catch {
      alert("Failed to submit report.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl">
        <h3 className="font-semibold text-base mb-4" style={{ color: "#1A0A05" }}>Report User</h3>
        <div className="space-y-2 mb-4">
          {REASONS.map((r) => (
            <label key={r.value} className="flex items-center gap-2.5 cursor-pointer">
              <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} className="accent-crimson" />
              <span className="text-sm" style={{ color: "#1A0A05" }}>{r.label}</span>
            </label>
          ))}
        </div>
        <textarea
          value={details} onChange={(e) => setDetails(e.target.value)}
          placeholder="Additional details (optional)"
          className="w-full border rounded-xl px-3 py-2 text-sm resize-none outline-none mb-4"
          style={{ borderColor: "#EDE3D9", minHeight: 72 }}
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm border" style={{ borderColor: "#EDE3D9", color: "rgba(26,10,5,0.6)" }}>Cancel</button>
          <button onClick={submit} disabled={busy} className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50" style={{ background: "#dc2626", color: "white" }}>
            {busy ? "Submitting…" : "Submit Report"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const myId = user?.id ?? "";

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(searchParams.get("id"));

  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeThread = threads.find((t) => t.id === activeChatId) ?? null;
  const otherPerson = activeThread ? otherUser(activeThread, myId) : null;

  // ── Load threads ─────────────────────────────────────────────────────────
  useEffect(() => {
    api.get<ChatThread[]>("/api/chats")
      .then((r) => setThreads(r.data))
      .catch(console.error)
      .finally(() => setLoadingThreads(false));
  }, []);

  // ── Socket setup ─────────────────────────────────────────────────────────
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) return;

    const socket = io(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", {
      auth: { token },
      transports: ["websocket"],
    });

    socket.on("new-message", (msg: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Update thread last message preview
      setThreads((prev) =>
        prev.map((t) =>
          t.id === msg.chatId ? { ...t, messages: [msg] } : t
        )
      );
      // Mark as read immediately if this chat is currently open
      setActiveChatId((currentId) => {
        if (currentId === msg.chatId && msg.senderId !== myId) {
          socket.emit("mark-read", msg.chatId);
        }
        return currentId;
      });
    });

    socket.on("notification", (data: { type: string; chatId: string }) => {
      if (data.type === "new-message" && data.chatId !== activeChatId) {
        // Refresh threads to show unread indicator
        api.get<ChatThread[]>("/api/chats").then((r) => setThreads(r.data)).catch(() => {});
      }
    });

    socketRef.current = socket;
    return () => { socket.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load messages when chat changes ──────────────────────────────────────
  useEffect(() => {
    if (!activeChatId) return;
    setLoadingMessages(true);
    setMessages([]);

    api.get<Message[]>(`/api/chats/${activeChatId}/messages`)
      .then((r) => setMessages(r.data))
      .catch(console.error)
      .finally(() => setLoadingMessages(false));

    socketRef.current?.emit("join-chat", activeChatId);
    socketRef.current?.emit("mark-read", activeChatId);

    // Sync URL
    const url = new URL(window.location.href);
    url.searchParams.set("id", activeChatId);
    router.replace(url.pathname + url.search, { scroll: false });
  }, [activeChatId, router]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback((e?: FormEvent) => {
    e?.preventDefault();
    const content = input.trim();
    if (!content || !activeChatId || sending) return;

    setSending(true);
    setInput("");
    socketRef.current?.emit("send-message", { chatId: activeChatId, content });
    // Optimistic — the socket's own `new-message` event will add it
    setTimeout(() => setSending(false), 300);
    textareaRef.current?.focus();
  }, [input, activeChatId, sending]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const blockChat = async () => {
    if (!activeChatId) return;
    if (!confirm("Block this conversation? You won't be able to send or receive messages.")) return;
    try {
      await api.post(`/api/chats/${activeChatId}/block`);
      setThreads((prev) => prev.map((t) => t.id === activeChatId ? { ...t, isBlocked: true, blockedBy: myId } : t));
    } catch { alert("Failed to block."); }
    setShowMenu(false);
  };

  // ── Panels ────────────────────────────────────────────────────────────────
  const showList = !activeChatId; // mobile: show list when no chat selected
  const isBlocked = activeThread?.isBlocked ?? false;

  // ─── Thread list panel ────────────────────────────────────────────────────
  const ThreadListPanel = (
    <div
      className="flex flex-col border-r"
      style={{ background: "white", borderColor: "#EDE3D9", width: "100%", maxWidth: 320, minWidth: 0 }}
    >
      <div className="px-4 py-4 border-b" style={{ borderColor: "#EDE3D9" }}>
        <h2 className="font-bold text-base" style={{ color: "#1A0A05" }}>Messages</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loadingThreads ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex gap-3 animate-pulse">
                <div className="w-11 h-11 rounded-full flex-none" style={{ background: "#EDE3D9" }} />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 rounded-lg" style={{ background: "#EDE3D9", width: "60%" }} />
                  <div className="h-3 rounded-lg" style={{ background: "#EDE3D9", width: "80%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 px-4 text-center">
            <p className="text-sm font-medium" style={{ color: "#1A0A05" }}>No conversations yet</p>
            <p className="text-xs mt-1" style={{ color: "rgba(26,10,5,0.4)" }}>Accept an interest to start chatting.</p>
          </div>
        ) : (
          threads.map((t) => {
            const other = otherUser(t, myId);
            const lastMsg = t.messages[0];
            const isActive = t.id === activeChatId;
            return (
              <button
                key={t.id}
                onClick={() => setActiveChatId(t.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                style={{ background: isActive ? "rgba(107,19,32,0.05)" : "transparent" }}
              >
                <Avatar user={other} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold truncate" style={{ color: "#1A0A05" }}>
                      {displayName(other)}
                    </span>
                    {lastMsg && (
                      <span className="text-xs flex-none" style={{ color: "rgba(26,10,5,0.35)" }}>
                        {timeLabel(lastMsg.sentAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs truncate mt-0.5" style={{ color: "rgba(26,10,5,0.45)" }}>
                    {t.isBlocked ? "🔒 Conversation blocked" : lastMsg?.content ?? "Start a conversation"}
                  </p>
                </div>
                {isActive && <div className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: "#6B1320" }} />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  // ─── Chat window panel ────────────────────────────────────────────────────
  const ChatWindowPanel = (
    <div className="flex-1 flex flex-col min-w-0" style={{ background: "#FAF6F1" }}>
      {!activeChatId ? (
        <div className="flex-1 flex flex-col items-center justify-center" style={{ color: "rgba(26,10,5,0.35)" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-3">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <p className="text-sm">Select a conversation</p>
        </div>
      ) : (
        <>
          {/* Chat header */}
          <div
            className="flex items-center gap-3 px-4 py-3 border-b"
            style={{ background: "white", borderColor: "#EDE3D9" }}
          >
            {/* Back (mobile) */}
            <button
              className="md:hidden flex-none"
              onClick={() => {
                setActiveChatId(null);
                router.replace("/chat", { scroll: false });
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(26,10,5,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            {otherPerson && <Avatar user={otherPerson} size={38} />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "#1A0A05" }}>
                {otherPerson ? displayName(otherPerson) : "…"}
              </p>
              {isBlocked && (
                <p className="text-xs" style={{ color: "#dc2626" }}>Conversation blocked</p>
              )}
            </div>

            {/* More menu */}
            <div className="relative">
              <button onClick={() => setShowMenu((v) => !v)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(26,10,5,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
                </svg>
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-40 rounded-xl shadow-xl border overflow-hidden z-40" style={{ background: "white", borderColor: "#EDE3D9" }}>
                    <button
                      onClick={() => { setShowReport(true); setShowMenu(false); }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-red-50"
                      style={{ color: "#dc2626" }}
                    >
                      Report User
                    </button>
                    {!isBlocked && (
                      <button
                        onClick={blockChat}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50"
                        style={{ color: "rgba(26,10,5,0.7)" }}
                      >
                        Block & Leave
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#C9A84C", borderTopColor: "transparent" }} />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-sm" style={{ color: "rgba(26,10,5,0.4)" }}>
                  Say hello to {otherPerson ? displayName(otherPerson) : "them"} 👋
                </p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMine = msg.senderId === myId;
                const prevMsg = messages[i - 1];
                const showTime = !prevMsg || new Date(msg.sentAt).getTime() - new Date(prevMsg.sentAt).getTime() > 5 * 60_000;

                return (
                  <div key={msg.id}>
                    {showTime && (
                      <div className="text-center my-3">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(26,10,5,0.06)", color: "rgba(26,10,5,0.4)" }}>
                          {timeLabel(msg.sentAt)}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div
                        className="max-w-[72%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                        style={{
                          background: isMine ? "#6B1320" : "white",
                          color: isMine ? "#FAF6F1" : "#1A0A05",
                          borderBottomRightRadius: isMine ? 4 : 16,
                          borderBottomLeftRadius: isMine ? 16 : 4,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                        }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {isBlocked ? (
            <div className="px-4 py-3 text-center text-sm border-t" style={{ borderColor: "#EDE3D9", color: "rgba(26,10,5,0.4)", background: "white" }}>
              This conversation has been blocked.
            </div>
          ) : (
            <form
              onSubmit={sendMessage}
              className="flex items-end gap-2 px-4 py-3 border-t"
              style={{ background: "white", borderColor: "#EDE3D9" }}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message…"
                rows={1}
                className="flex-1 resize-none rounded-xl px-4 py-2.5 text-sm outline-none border"
                style={{
                  borderColor: "#EDE3D9",
                  maxHeight: 120,
                  lineHeight: "1.5",
                  background: "#FAF6F1",
                  color: "#1A0A05",
                }}
                onInput={(e) => {
                  const t = e.currentTarget;
                  t.style.height = "auto";
                  t.style.height = Math.min(t.scrollHeight, 120) + "px";
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="flex-none w-10 h-10 rounded-xl flex items-center justify-center transition-opacity disabled:opacity-40 hover:opacity-90"
                style={{ background: "#6B1320" }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#FAF6F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop: two-panel layout */}
      <div
        className="hidden md:flex"
        style={{ height: "calc(100vh - 3.5rem)", overflow: "hidden" }}
      >
        {ThreadListPanel}
        {ChatWindowPanel}
      </div>

      {/* Mobile: single panel based on selection */}
      <div className="md:hidden flex flex-col" style={{ height: "calc(100dvh - 7rem)" }}>
        {showList || !activeChatId ? ThreadListPanel : ChatWindowPanel}
      </div>

      {showReport && activeChatId && (
        <ReportModal
          chatId={activeChatId}
          onClose={() => setShowReport(false)}
          onDone={() => { setShowReport(false); alert("Report submitted. Thank you."); }}
        />
      )}
    </>
  );
}

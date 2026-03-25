"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api";

interface InterestProfile {
  id: string;
  phone: string;
  profile: {
    id: string;
    fullName: string;
    dateOfBirth: string;
    district: string;
    religion: string;
    photos: { url: string; isPrimary: boolean }[];
  } | null;
}
interface ReceivedInterest {
  id: string;
  sentAt: string;
  expiresAt: string;
  status: string;
  sender: InterestProfile;
}
interface SentInterest {
  id: string;
  sentAt: string;
  expiresAt: string;
  status: string;
  receiver: InterestProfile;
}

function age(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  PENDING:   { label: "Pending",   bg: "rgba(201,168,76,0.12)",  color: "#92400e" },
  ACCEPTED:  { label: "Accepted",  bg: "rgba(22,163,74,0.1)",    color: "#16a34a" },
  DECLINED:  { label: "Declined",  bg: "rgba(220,38,38,0.08)",   color: "#dc2626" },
  EXPIRED:   { label: "Expired",   bg: "rgba(26,10,5,0.06)",     color: "rgba(26,10,5,0.4)" },
  WITHDRAWN: { label: "Withdrawn", bg: "rgba(26,10,5,0.06)",     color: "rgba(26,10,5,0.4)" },
};

function ProfileMiniCard({ user, sentAt, actions }: {
  user: InterestProfile;
  sentAt: string;
  actions: React.ReactNode;
}) {
  const p = user.profile;
  const photo = p?.photos.find((ph) => ph.isPrimary) ?? p?.photos[0];

  return (
    <div className="bg-white rounded-2xl border flex gap-3 p-3" style={{ borderColor: "#EDE3D9" }}>
      {/* Photo */}
      <Link href={p ? `/browse/${p.id}` : "#"} className="flex-none relative rounded-xl overflow-hidden" style={{ width: 72, height: 88 }}>
        {photo ? (
          <Image src={photo.url} fill alt={p?.fullName ?? ""} className="object-cover" sizes="72px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "#F5F0EA" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(26,10,5,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <p className="text-sm font-semibold truncate" style={{ color: "#1A0A05" }}>
            {p?.fullName ?? user.phone}
          </p>
          {p && (
            <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(26,10,5,0.45)" }}>
              {age(p.dateOfBirth)} yrs · {p.district} · {p.religion}
            </p>
          )}
          <p className="text-xs mt-0.5" style={{ color: "rgba(26,10,5,0.35)" }}>
            {new Date(sentAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2">{actions}</div>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="bg-white rounded-2xl border p-12 text-center" style={{ borderColor: "#EDE3D9" }}>
      <div className="mx-auto mb-4 flex items-center justify-center w-12 h-12 rounded-full" style={{ background: "#F5F0EA" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(26,10,5,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </div>
      <p className="text-sm font-semibold" style={{ color: "#1A0A05" }}>{label}</p>
    </div>
  );
}

export default function InterestsPage() {
  const [tab, setTab] = useState<"received" | "sent">("received");
  const [received, setReceived] = useState<ReceivedInterest[]>([]);
  const [sent, setSent] = useState<SentInterest[]>([]);
  const [loadingReceived, setLoadingReceived] = useState(true);
  const [loadingSent, setLoadingSent] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    api.get<ReceivedInterest[]>("/api/interests/received")
      .then((r) => setReceived(r.data))
      .catch(console.error)
      .finally(() => setLoadingReceived(false));
    api.get<SentInterest[]>("/api/interests/sent")
      .then((r) => setSent(r.data))
      .catch(console.error)
      .finally(() => setLoadingSent(false));
  }, []);

  const acceptInterest = async (id: string) => {
    setBusyId(id);
    try {
      await api.put(`/api/interests/${id}/accept`);
      setReceived((prev) => prev.filter((i) => i.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to accept");
    } finally {
      setBusyId(null);
    }
  };

  const declineInterest = async (id: string) => {
    setBusyId(id);
    try {
      await api.put(`/api/interests/${id}/decline`);
      setReceived((prev) => prev.filter((i) => i.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to decline");
    } finally {
      setBusyId(null);
    }
  };

  const withdrawInterest = async (id: string) => {
    setBusyId(id);
    try {
      await api.delete(`/api/interests/${id}`);
      setSent((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: "WITHDRAWN" } : i))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to withdraw");
    } finally {
      setBusyId(null);
    }
  };

  const pendingReceived = received.filter((i) => i.status === "PENDING").length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-5" style={{ color: "#1A0A05" }}>Interests</h1>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: "#EDE3D9" }}>
        {(["received", "sent"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize flex items-center justify-center gap-2"
            style={{
              background: tab === t ? "white" : "transparent",
              color: tab === t ? "#1A0A05" : "rgba(26,10,5,0.45)",
              boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {t === "received" ? "Received" : "Sent"}
            {t === "received" && pendingReceived > 0 && (
              <span className="w-4 h-4 rounded-full text-xs font-bold flex items-center justify-center" style={{ background: "#6B1320", color: "#FAF6F1" }}>
                {pendingReceived}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Received tab */}
      {tab === "received" && (
        <>
          {loadingReceived ? (
            <div className="space-y-3">
              {[1, 2].map((n) => (
                <div key={n} className="bg-white rounded-2xl border h-24 animate-pulse" style={{ borderColor: "#EDE3D9" }} />
              ))}
            </div>
          ) : received.length === 0 ? (
            <EmptyState label="No interests received yet" />
          ) : (
            <div className="space-y-3">
              {received.map((interest) => {
                const busy = busyId === interest.id;
                const isPending = interest.status === "PENDING";
                return (
                  <ProfileMiniCard
                    key={interest.id}
                    user={interest.sender}
                    sentAt={interest.sentAt}
                    actions={
                      isPending ? (
                        <>
                          <button
                            onClick={() => acceptInterest(interest.id)}
                            disabled={busy}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 transition-opacity hover:opacity-90"
                            style={{ background: "#16a34a", color: "white" }}
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => declineInterest(interest.id)}
                            disabled={busy}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border disabled:opacity-50"
                            style={{ borderColor: "#dc2626", color: "#dc2626" }}
                          >
                            Decline
                          </button>
                        </>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-lg font-medium" style={STATUS_BADGE[interest.status] ? { background: STATUS_BADGE[interest.status].bg, color: STATUS_BADGE[interest.status].color } : {}}>
                          {STATUS_BADGE[interest.status]?.label ?? interest.status}
                        </span>
                      )
                    }
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Sent tab */}
      {tab === "sent" && (
        <>
          {loadingSent ? (
            <div className="space-y-3">
              {[1, 2].map((n) => (
                <div key={n} className="bg-white rounded-2xl border h-24 animate-pulse" style={{ borderColor: "#EDE3D9" }} />
              ))}
            </div>
          ) : sent.length === 0 ? (
            <EmptyState label="You haven't sent any interests yet" />
          ) : (
            <div className="space-y-3">
              {sent.map((interest) => {
                const busy = busyId === interest.id;
                const isPending = interest.status === "PENDING";
                const badge = STATUS_BADGE[interest.status];
                return (
                  <ProfileMiniCard
                    key={interest.id}
                    user={interest.receiver}
                    sentAt={interest.sentAt}
                    actions={
                      <>
                        {badge && (
                          <span className="text-xs px-2 py-1 rounded-lg font-medium" style={{ background: badge.bg, color: badge.color }}>
                            {badge.label}
                          </span>
                        )}
                        {isPending && (
                          <button
                            onClick={() => withdrawInterest(interest.id)}
                            disabled={busy}
                            className="text-xs px-2 py-1 rounded-lg border disabled:opacity-50 hover:bg-gray-50"
                            style={{ borderColor: "#EDE3D9", color: "rgba(26,10,5,0.45)" }}
                          >
                            Withdraw
                          </button>
                        )}
                        {interest.status === "ACCEPTED" && (
                          <Link
                            href="/chat"
                            className="text-xs px-2 py-1 rounded-lg font-semibold"
                            style={{ background: "rgba(107,19,32,0.08)", color: "#6B1320" }}
                          >
                            Open Chat →
                          </Link>
                        )}
                      </>
                    }
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

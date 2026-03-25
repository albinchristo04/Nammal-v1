"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { api } from "@/lib/api";

interface Photo { id: string; url: string; }
interface Profile {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  religion: string;
  community?: string;
  district: string;
  education: string;
  occupation: string;
  heightCm: number;
  aboutMe?: string;
  photos: Photo[];
}
interface QueueUser {
  id: string;
  phone: string;
  createdAt: string;
  profile: Profile | null;
}

function age(dob: string) {
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function RejectModal({
  userId,
  name,
  onClose,
  onRejected,
}: {
  userId: string;
  name: string;
  onClose: () => void;
  onRejected: (id: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!reason.trim()) return;
    setBusy(true);
    try {
      await api.put(`/api/admin/users/${userId}/reject`, { reason });
      onRejected(userId);
    } catch {
      alert("Failed to reject. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-base font-semibold mb-1" style={{ color: "#1A0A05" }}>Reject Profile</h3>
        <p className="text-sm mb-4" style={{ color: "rgba(26,10,5,0.5)" }}>Rejection reason for <strong>{name}</strong></p>
        <textarea
          className="w-full border rounded-xl px-3 py-2.5 text-sm resize-none outline-none focus:ring-2"
          style={{ borderColor: "#E2CEBE", focusRingColor: "#6B1320", minHeight: 90 }}
          placeholder="e.g. Blurry photo, incomplete details, fake profile…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border"
            style={{ borderColor: "#E2CEBE", color: "rgba(26,10,5,0.6)" }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!reason.trim() || busy}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-opacity"
            style={{ background: "#dc2626", color: "white" }}
          >
            {busy ? "Rejecting…" : "Confirm Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionModal({
  userId,
  name,
  action,
  onClose,
  onDone,
}: {
  userId: string;
  name: string;
  action: "suspend" | "ban";
  onClose: () => void;
  onDone: (id: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!reason.trim()) return;
    setBusy(true);
    try {
      await api.put(`/api/admin/users/${userId}/${action}`, { reason });
      onDone(userId);
    } catch {
      alert("Action failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-base font-semibold mb-1 capitalize" style={{ color: "#1A0A05" }}>{action} User</h3>
        <p className="text-sm mb-4" style={{ color: "rgba(26,10,5,0.5)" }}>
          Reason for {action}ing <strong>{name}</strong>
        </p>
        <textarea
          className="w-full border rounded-xl px-3 py-2.5 text-sm resize-none outline-none"
          style={{ borderColor: "#E2CEBE", minHeight: 80 }}
          placeholder="Enter reason…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm border" style={{ borderColor: "#E2CEBE", color: "rgba(26,10,5,0.6)" }}>
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!reason.trim() || busy}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ background: action === "ban" ? "#1A0A05" : "#ea580c", color: "white" }}
          >
            {busy ? "…" : `Confirm ${action.charAt(0).toUpperCase() + action.slice(1)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QueuePage() {
  const [users, setUsers] = useState<QueueUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState<QueueUser | null>(null);
  const [actionTarget, setActionTarget] = useState<{ user: QueueUser; action: "suspend" | "ban" } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    api.get<QueueUser[]>("/api/admin/queue")
      .then((r) => setUsers(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const remove = (id: string) => setUsers((u) => u.filter((x) => x.id !== id));

  const approve = async (userId: string) => {
    setBusyId(userId);
    try {
      await api.put(`/api/admin/users/${userId}/approve`);
      remove(userId);
    } catch {
      alert("Approval failed.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="px-8 py-8">
        <div className="h-8 w-48 rounded-lg animate-pulse mb-8" style={{ background: "#EDE3D9" }} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl h-64 animate-pulse" style={{ border: "1px solid #EDE3D9" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A0A05" }}>Verification Queue</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(26,10,5,0.45)" }}>
            {users.length} profile{users.length !== 1 ? "s" : ""} pending review
          </p>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="bg-white rounded-2xl border p-16 text-center" style={{ borderColor: "#EDE3D9" }}>
          <div className="mx-auto mb-4 flex items-center justify-center w-14 h-14 rounded-full" style={{ background: "#f0fdf4" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <p className="font-semibold" style={{ color: "#1A0A05" }}>All caught up!</p>
          <p className="text-sm mt-1" style={{ color: "rgba(26,10,5,0.4)" }}>No profiles are waiting for verification.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {users.map((u) => {
            const p = u.profile;
            const busy = busyId === u.id;
            const displayName = p?.fullName ?? u.phone;

            return (
              <div key={u.id} className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#EDE3D9" }}>
                {/* Photos strip */}
                <div className="flex gap-1.5 p-3 pb-0" style={{ background: "#F5F0EA" }}>
                  {p?.photos.slice(0, 3).map((ph, i) => (
                    <div key={ph.id} className="relative rounded-xl overflow-hidden flex-none" style={{ width: i === 0 ? 100 : 72, height: 120 }}>
                      <Image src={ph.url} fill alt="" className="object-cover" sizes="120px" />
                    </div>
                  ))}
                  {(!p?.photos || p.photos.length === 0) && (
                    <div className="flex items-center justify-center rounded-xl" style={{ width: 100, height: 120, background: "#EDE3D9" }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(26,10,5,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-base" style={{ color: "#1A0A05" }}>{displayName}</h3>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(26,10,5,0.45)" }}>
                        {u.phone} · Registered {new Date(u.createdAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <span
                      className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{ background: p?.gender === "MALE" ? "rgba(3,105,161,0.1)" : "rgba(157,23,77,0.1)", color: p?.gender === "MALE" ? "#0369a1" : "#9d174d" }}
                    >
                      {p?.gender === "MALE" ? "Male" : p?.gender === "FEMALE" ? "Female" : "—"}
                    </span>
                  </div>

                  {p ? (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-3" style={{ color: "rgba(26,10,5,0.55)" }}>
                      <span>{p.dateOfBirth ? `${age(p.dateOfBirth)} yrs` : "—"}</span>
                      <span>{p.district}, Kerala</span>
                      <span>{p.religion}{p.community ? ` · ${p.community}` : ""}</span>
                      <span>{p.education}</span>
                      <span>{p.occupation}</span>
                      <span>{p.heightCm} cm</span>
                    </div>
                  ) : (
                    <p className="text-xs mb-3 italic" style={{ color: "rgba(26,10,5,0.4)" }}>No profile data submitted yet.</p>
                  )}

                  {p?.aboutMe && (
                    <p className="text-xs mb-3 line-clamp-2 italic" style={{ color: "rgba(26,10,5,0.5)" }}>
                      &ldquo;{p.aboutMe}&rdquo;
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: "#EDE3D9" }}>
                    <button
                      onClick={() => approve(u.id)}
                      disabled={busy}
                      className="flex-1 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition-opacity hover:opacity-90"
                      style={{ background: "#16a34a", color: "white" }}
                    >
                      {busy ? "…" : "Approve"}
                    </button>
                    <button
                      onClick={() => setRejectTarget(u)}
                      disabled={busy}
                      className="flex-1 py-2 rounded-xl text-sm font-semibold border disabled:opacity-50"
                      style={{ borderColor: "#dc2626", color: "#dc2626" }}
                    >
                      Reject
                    </button>
                    <div className="relative group">
                      <button
                        className="p-2 rounded-xl border hover:bg-gray-50"
                        style={{ borderColor: "#EDE3D9" }}
                        title="More actions"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(26,10,5,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
                        </svg>
                      </button>
                      <div className="absolute right-0 bottom-full mb-1 hidden group-hover:block bg-white rounded-xl shadow-xl border overflow-hidden z-10 w-36" style={{ borderColor: "#EDE3D9" }}>
                        <button
                          onClick={() => setActionTarget({ user: u, action: "suspend" })}
                          className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-left hover:bg-orange-50"
                          style={{ color: "#ea580c" }}
                        >
                          Suspend
                        </button>
                        <button
                          onClick={() => setActionTarget({ user: u, action: "ban" })}
                          className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-left hover:bg-gray-50"
                          style={{ color: "#1A0A05" }}
                        >
                          Ban
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rejectTarget && (
        <RejectModal
          userId={rejectTarget.id}
          name={rejectTarget.profile?.fullName ?? rejectTarget.phone}
          onClose={() => setRejectTarget(null)}
          onRejected={(id) => { remove(id); setRejectTarget(null); }}
        />
      )}

      {actionTarget && (
        <ActionModal
          userId={actionTarget.user.id}
          name={actionTarget.user.profile?.fullName ?? actionTarget.user.phone}
          action={actionTarget.action}
          onClose={() => setActionTarget(null)}
          onDone={(id) => { remove(id); setActionTarget(null); }}
        />
      )}
    </div>
  );
}

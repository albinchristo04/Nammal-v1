"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface ReportUser {
  id: string;
  phone: string;
  profile: { fullName: string } | null;
}
interface Report {
  id: string;
  reason: string;
  details?: string;
  status: string;
  createdAt: string;
  reporter: ReportUser;
  reported: ReportUser;
}

const REASON_LABELS: Record<string, string> = {
  FAKE_PROFILE: "Fake Profile",
  HARASSMENT: "Harassment",
  INAPPROPRIATE_CONTENT: "Inappropriate Content",
  SPAM: "Spam",
  OTHER: "Other",
};

const REASON_COLORS: Record<string, { bg: string; color: string }> = {
  FAKE_PROFILE: { bg: "rgba(220,38,38,0.08)", color: "#dc2626" },
  HARASSMENT: { bg: "rgba(234,88,12,0.08)", color: "#ea580c" },
  INAPPROPRIATE_CONTENT: { bg: "rgba(157,23,77,0.08)", color: "#9d174d" },
  SPAM: { bg: "rgba(201,168,76,0.12)", color: "#92400e" },
  OTHER: { bg: "rgba(26,10,5,0.06)", color: "rgba(26,10,5,0.55)" },
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    api.get<Report[]>("/api/admin/reports")
      .then((r) => setReports(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (id: string, action: "dismissed" | "actioned") => {
    setBusyId(id);
    try {
      await api.put(`/api/admin/reports/${id}`, { action });
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch {
      alert("Failed. Try again.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="px-8 py-8">
        <div className="h-8 w-40 rounded-lg animate-pulse mb-8" style={{ background: "#EDE3D9" }} />
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl h-28 animate-pulse" style={{ border: "1px solid #EDE3D9" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#1A0A05" }}>Reports</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(26,10,5,0.45)" }}>
          {reports.length} pending report{reports.length !== 1 ? "s" : ""}
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white rounded-2xl border p-16 text-center" style={{ borderColor: "#EDE3D9" }}>
          <div className="mx-auto mb-4 flex items-center justify-center w-14 h-14 rounded-full" style={{ background: "#f0fdf4" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <p className="font-semibold" style={{ color: "#1A0A05" }}>No pending reports</p>
          <p className="text-sm mt-1" style={{ color: "rgba(26,10,5,0.4)" }}>All reports have been reviewed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            const busy = busyId === r.id;
            const { bg, color } = REASON_COLORS[r.reason] ?? REASON_COLORS.OTHER;

            return (
              <div key={r.id} className="bg-white rounded-2xl border p-5" style={{ borderColor: "#EDE3D9" }}>
                <div className="flex items-start gap-4">
                  {/* Reason badge */}
                  <div
                    className="flex-none mt-0.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap"
                    style={{ background: bg, color }}
                  >
                    {REASON_LABELS[r.reason] ?? r.reason}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm mb-1">
                      <span className="font-medium" style={{ color: "#1A0A05" }}>
                        {r.reporter.profile?.fullName ?? r.reporter.phone}
                      </span>
                      <span style={{ color: "rgba(26,10,5,0.3)" }}>reported</span>
                      <span className="font-medium" style={{ color: "#6B1320" }}>
                        {r.reported.profile?.fullName ?? r.reported.phone}
                      </span>
                    </div>
                    {r.details && (
                      <p className="text-sm line-clamp-2" style={{ color: "rgba(26,10,5,0.55)" }}>
                        {r.details}
                      </p>
                    )}
                    <p className="text-xs mt-1" style={{ color: "rgba(26,10,5,0.35)" }}>
                      {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex-none flex items-center gap-2">
                    <button
                      onClick={() => handleAction(r.id, "actioned")}
                      disabled={busy}
                      className="px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-50 transition-opacity hover:opacity-90"
                      style={{ background: "#6B1320", color: "#FAF6F1" }}
                      title="Take action against reported user"
                    >
                      {busy ? "…" : "Act on Report"}
                    </button>
                    <button
                      onClick={() => handleAction(r.id, "dismissed")}
                      disabled={busy}
                      className="px-3 py-2 rounded-xl text-xs font-medium border disabled:opacity-50 hover:bg-gray-50"
                      style={{ borderColor: "#EDE3D9", color: "rgba(26,10,5,0.5)" }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

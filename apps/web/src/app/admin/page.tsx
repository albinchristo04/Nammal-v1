"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";

interface Metrics {
  totalUsers: number;
  verifiedUsers: number;
  pendingUsers: number;
  pendingReports: number;
  totalChats: number;
}

const STAT_CARDS = [
  {
    key: "pendingUsers" as keyof Metrics,
    label: "Pending Verification",
    sub: "Awaiting review",
    href: "/admin/queue",
    color: "#C9A84C",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    key: "verifiedUsers" as keyof Metrics,
    label: "Verified Profiles",
    sub: "Active members",
    color: "#16a34a",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  {
    key: "pendingReports" as keyof Metrics,
    label: "Pending Reports",
    sub: "Needs action",
    href: "/admin/reports",
    color: "#dc2626",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    key: "totalUsers" as keyof Metrics,
    label: "Total Users",
    sub: "All time registrations",
    color: "#6B1320",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    key: "totalChats" as keyof Metrics,
    label: "Active Chats",
    sub: "Matched conversations",
    color: "#0369a1",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Metrics>("/api/admin/metrics")
      .then((r) => setMetrics(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#1A0A05" }}>Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(26,10,5,0.45)" }}>
          {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {STAT_CARDS.map(({ key, label, sub, href, color, icon }) => {
          const val = metrics?.[key] ?? 0;
          const inner = (
            <div
              className="bg-white rounded-2xl p-5 border h-full"
              style={{ borderColor: "#EDE3D9" }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-xl"
                  style={{ background: `${color}18`, color }}
                >
                  {icon}
                </div>
                {href && <span className="text-xs font-medium" style={{ color }}>View →</span>}
              </div>
              <div className="text-3xl font-bold mb-1" style={{ color: "#1A0A05" }}>
                {loading ? (
                  <span className="inline-block w-12 h-7 rounded-lg animate-pulse" style={{ background: "#EDE3D9" }} />
                ) : val.toLocaleString()}
              </div>
              <div className="text-sm font-medium" style={{ color: "#1A0A05" }}>{label}</div>
              <div className="text-xs mt-0.5" style={{ color: "rgba(26,10,5,0.4)" }}>{sub}</div>
            </div>
          );

          return href ? (
            <Link key={key} href={href} className="block hover:shadow-md transition-shadow rounded-2xl">
              {inner}
            </Link>
          ) : (
            <div key={key}>{inner}</div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "#EDE3D9" }}>
        <h2 className="text-base font-semibold mb-4" style={{ color: "#1A0A05" }}>Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/queue"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: "#6B1320", color: "#FAF6F1" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" />
            </svg>
            Review Pending Profiles
            {!!metrics?.pendingUsers && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ background: "#C9A84C", color: "#4e0e17" }}>
                {metrics.pendingUsers}
              </span>
            )}
          </Link>
          <Link
            href="/admin/reports"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:bg-red-50"
            style={{ borderColor: "#dc2626", color: "#dc2626" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Review Reports
            {!!metrics?.pendingReports && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ background: "#dc2626", color: "white" }}>
                {metrics.pendingReports}
              </span>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}

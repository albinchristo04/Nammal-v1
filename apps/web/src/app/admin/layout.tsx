"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";

const NAV = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: "/admin/queue",
    label: "Verification Queue",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12l2 2 4-4" /><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
      </svg>
    ),
  },
  {
    href: "/admin/reports",
    label: "Reports",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try { await api.post("/api/auth/logout"); } catch {}
    clearAuth();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen" style={{ background: "#F5F0EA" }}>
      {/* Sidebar */}
      <aside
        className="w-56 flex-none flex flex-col"
        style={{ background: "#1A0A05", minHeight: "100vh" }}
      >
        {/* Brand */}
        <div className="px-5 py-6 border-b" style={{ borderColor: "rgba(201,168,76,0.15)" }}>
          <div className="flex items-center gap-2">
            <svg width="26" height="26" viewBox="0 0 36 36" fill="none">
              <circle cx="13" cy="18" r="10" stroke="#6B1320" strokeWidth="2" fill="none" />
              <circle cx="23" cy="18" r="10" stroke="#C9A84C" strokeWidth="2" fill="none" />
            </svg>
            <div>
              <div className="font-serif text-base font-semibold" style={{ color: "#FAF6F1" }}>Nammal</div>
              <div className="text-xs" style={{ color: "rgba(201,168,76,0.7)" }}>Admin</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, label, icon }) => {
            const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: active ? "rgba(107,19,32,0.6)" : "transparent",
                  color: active ? "#FAF6F1" : "rgba(250,246,241,0.45)",
                  borderLeft: active ? "3px solid #C9A84C" : "3px solid transparent",
                }}
              >
                <span style={{ color: active ? "#C9A84C" : "rgba(250,246,241,0.35)" }}>{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t" style={{ borderColor: "rgba(201,168,76,0.1)" }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full transition-colors hover:bg-white/5"
            style={{ color: "rgba(250,246,241,0.35)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

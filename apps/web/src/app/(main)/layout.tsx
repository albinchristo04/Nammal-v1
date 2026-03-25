"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";

const NAV = [
  {
    href: "/browse",
    label: "Browse",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "#6B1320" : "none"} stroke={active ? "#6B1320" : "currentColor"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    href: "/interests",
    label: "Interests",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "#6B1320" : "none"} stroke={active ? "#6B1320" : "currentColor"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    href: "/chat",
    label: "Messages",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "#6B1320" : "none"} stroke={active ? "#6B1320" : "currentColor"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "#6B1320" : "none"} stroke={active ? "#6B1320" : "currentColor"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try { await api.post("/api/auth/logout"); } catch {}
    clearAuth();
    router.push("/");
  };

  return (
    <div className="min-h-screen" style={{ background: "#F5F0EA" }}>
      {/* Skip to main content — keyboard/screen reader */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Top navbar */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-8 h-14"
        style={{
          background: "rgba(250,246,241,0.96)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(201,168,76,0.2)",
        }}
      >
        {/* Logo */}
        <Link href="/browse" className="flex items-center gap-2">
          <svg width="26" height="26" viewBox="0 0 36 36" fill="none">
            <circle cx="13" cy="18" r="10" stroke="#6B1320" strokeWidth="2" fill="none" />
            <circle cx="23" cy="18" r="10" stroke="#C9A84C" strokeWidth="2" fill="none" />
          </svg>
          <span className="font-serif text-lg font-semibold" style={{ color: "#1A0A05" }}>Nammal</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(({ href, label, icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  color: active ? "#6B1320" : "rgba(26,10,5,0.5)",
                  background: active ? "rgba(107,19,32,0.07)" : "transparent",
                }}
              >
                {icon(active)}
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Account menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors hover:bg-black/5"
            style={{ color: "#1A0A05" }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "#6B1320", color: "#FAF6F1" }}
            >
              {user?.phone?.slice(-2) ?? "?"}
            </div>
            <span className="hidden md:inline">{user?.phone}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div
                className="absolute right-0 top-full mt-1 w-44 rounded-xl shadow-xl border overflow-hidden z-50"
                style={{ background: "white", borderColor: "#EDE3D9" }}
              >
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
                  style={{ color: "#6B1320" }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Page content */}
      <main id="main-content" className="pb-20 md:pb-6">{children}</main>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 flex justify-around items-center h-16"
        style={{
          background: "rgba(250,246,241,0.97)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(201,168,76,0.2)",
        }}
      >
        {NAV.map(({ href, label, icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="flex flex-col items-center gap-0.5 px-4 py-2"
              style={{ color: active ? "#6B1320" : "rgba(26,10,5,0.4)" }}
            >
              {icon(active)}
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

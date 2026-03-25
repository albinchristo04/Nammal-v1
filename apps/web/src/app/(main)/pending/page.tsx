"use client";

import Link from "next/link";

export default function PendingPage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#FAF6F1" }}
    >
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
            <circle cx="13" cy="18" r="10" stroke="#6B1320" strokeWidth="2" fill="none" />
            <circle cx="23" cy="18" r="10" stroke="#C9A84C" strokeWidth="2" fill="none" />
          </svg>
          <span
            className="font-serif text-2xl font-semibold"
            style={{ color: "#1A0A05" }}
          >
            Nammal
          </span>
        </div>

        {/* Status icon */}
        <div
          className="mx-auto mb-6 flex items-center justify-center rounded-full"
          style={{
            width: 72,
            height: 72,
            background: "rgba(201,168,76,0.12)",
            border: "2px solid rgba(201,168,76,0.4)",
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>

        {/* Heading */}
        <h1
          className="font-serif text-3xl font-semibold mb-3"
          style={{ color: "#1A0A05" }}
        >
          Profile Submitted
        </h1>
        <p className="font-malayalam text-sm mb-6" style={{ color: "#C9A84C" }}>
          നിങ്ങളുടെ പ്രൊഫൈൽ സമർപ്പിച്ചു
        </p>

        {/* Message */}
        <p className="text-base leading-relaxed mb-2" style={{ color: "rgba(26,10,5,0.7)" }}>
          Your profile is under review. Our team verifies every profile to keep Nammal a safe, trustworthy community.
        </p>
        <p className="text-sm mb-8" style={{ color: "rgba(26,10,5,0.45)" }}>
          You will receive an SMS once your profile is approved — usually within 24 hours.
        </p>

        {/* Steps */}
        <div
          className="rounded-2xl p-6 mb-8 text-left space-y-4"
          style={{ background: "white", border: "1px solid #E2CEBE" }}
        >
          {[
            { n: "1", label: "Profile submitted", done: true },
            { n: "2", label: "Under admin review", done: false, active: true },
            { n: "3", label: "Approved — you can browse", done: false },
          ].map(({ n, label, done, active }) => (
            <div key={n} className="flex items-center gap-3">
              <div
                className="flex-none flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
                style={{
                  background: done ? "#6B1320" : active ? "rgba(201,168,76,0.15)" : "rgba(26,10,5,0.06)",
                  color: done ? "#FAF6F1" : active ? "#C9A84C" : "rgba(26,10,5,0.35)",
                  border: active ? "1.5px solid #C9A84C" : "none",
                }}
              >
                {done ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6l2.5 2.5 4.5-5" stroke="#FAF6F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : n}
              </div>
              <span
                className="text-sm font-medium"
                style={{ color: done ? "#6B1320" : active ? "#1A0A05" : "rgba(26,10,5,0.4)" }}
              >
                {label}
              </span>
              {active && (
                <span
                  className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "rgba(201,168,76,0.12)", color: "#C9A84C" }}
                >
                  In progress
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full py-3 rounded-xl text-sm font-bold text-center transition-opacity hover:opacity-90"
            style={{ background: "#6B1320", color: "#FAF6F1" }}
          >
            Back to Home
          </Link>
          <Link
            href="/login"
            className="block w-full py-3 rounded-xl text-sm font-medium text-center"
            style={{ color: "rgba(26,10,5,0.5)" }}
          >
            Sign in to a different account
          </Link>
        </div>
      </div>
    </main>
  );
}

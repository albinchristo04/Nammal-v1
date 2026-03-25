import Link from "next/link";
import Image from "next/image";

const galleryPhotos = [
  { src: "/photos/couple-1.jpg", name: "Priya & Arun",    district: "Thrissur"   },
  { src: "/photos/couple-2.jpg", name: "Sneha & Rahul",   district: "Kozhikode"  },
  { src: "/photos/couple-3.jpg", name: "Divya & Sujith",  district: "Ernakulam"  },
  { src: "/photos/couple-5.jpg", name: "Anitha & Manoj",  district: "Trivandrum" },
  { src: "/photos/couple-4.jpg", name: "Lakshmi & Vivek", district: "Kannur"     },
];

const steps = [
  {
    n: "01",
    title: "Build your profile",
    desc: "Share your story, values, and photos. Our team personally reviews every profile before it goes live.",
  },
  {
    n: "02",
    title: "Browse & send interest",
    desc: "Explore verified profiles from the Kerala community. Send interest when you feel a connection.",
  },
  {
    n: "03",
    title: "Chat when both accept",
    desc: "When both parties accept, a private conversation opens. Safe, mutual, and always in your control.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAF6F1" }}>

      {/* ── Navbar — always solid ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: "rgba(250,246,241,0.96)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(107,19,32,0.1)",
          boxShadow: "0 1px 24px rgba(107,19,32,0.07)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-[68px] flex items-center justify-between">

          {/* Logo + wordmark */}
          <div className="flex items-center gap-3">
            {/* Logo mark — interlocked N rings in crimson & gold */}
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="13" cy="18" r="10" stroke="#6B1320" strokeWidth="2.5" fill="none"/>
              <circle cx="23" cy="18" r="10" stroke="#C9A84C" strokeWidth="2.5" fill="none"/>
              {/* Overlap fill to blend circles */}
              <path
                d="M18 9.27A10 10 0 0118 26.73 10 10 0 0118 9.27z"
                fill="rgba(250,246,241,0.96)"
              />
              {/* Inner N letterform */}
              <text x="14.5" y="22.5" fontFamily="Georgia, serif" fontSize="11" fontWeight="700" fill="#6B1320" letterSpacing="-0.5">
                N
              </text>
            </svg>

            <div className="flex items-baseline gap-1.5">
              <span
                className="text-xl font-serif font-semibold tracking-tight"
                style={{ color: "#6B1320" }}
              >
                Nammal
              </span>
              <span className="text-sm font-malayalam" style={{ color: "#C9A84C" }}>
                നമ്മൾ
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Link
              href="/login"
              className="px-5 py-2.5 text-sm font-medium rounded-full transition-colors hover:bg-crimson-50"
              style={{ color: "#6B1320" }}
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="px-6 py-2.5 text-sm font-semibold rounded-full transition-all hover:opacity-90"
              style={{ backgroundColor: "#6B1320", color: "#FAF6F1" }}
            >
              Join free
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════
          HERO — Magazine Editorial Grid
      ═══════════════════════════════════════ */}
      <section className="min-h-screen flex flex-col lg:grid lg:grid-cols-[42%_58%]">

        {/* Left — Text Panel */}
        <div
          className="flex flex-col justify-between px-8 lg:px-14 xl:px-20 pt-32 pb-12 lg:pt-0 lg:pb-0 lg:justify-center gap-10"
          style={{ backgroundColor: "#FAF6F1" }}
        >
          {/* Wordmark */}
          <div className="hidden lg:flex items-center gap-3 pt-24">
            <span
              className="text-xs tracking-[0.35em] uppercase font-medium"
              style={{ color: "#C9A84C" }}
            >
              NAMMAL · നമ്മൾ
            </span>
            <span
              className="flex-1 h-px"
              style={{ backgroundColor: "rgba(201,168,76,0.4)" }}
            />
          </div>

          {/* Headline */}
          <div>
            <h1
              className="font-serif leading-[0.95] mb-6"
              style={{ fontSize: "clamp(3.5rem, 6vw, 6.5rem)", color: "#1A0A05" }}
            >
              Find the one
              <br />
              <span className="pl-8 lg:pl-16 block">you were</span>
              <em style={{ color: "#6B1320" }}>meant for.</em>
            </h1>

            <p
              className="font-malayalam text-xl mb-8"
              style={{ color: "#C9A84C", letterSpacing: "0.04em" }}
            >
              നമ്മൾ കൂടെയുണ്ട്
            </p>

            <p
              className="text-base leading-relaxed max-w-sm mb-10"
              style={{ color: "#5a3d38" }}
            >
              Kerala&apos;s matrimony platform built on trust. Every profile verified
              by hand. No paywalls. No noise. Built for community.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 mb-10">
              <Link
                href="/register"
                className="px-8 py-4 text-base font-semibold rounded-full transition-all hover:opacity-90"
                style={{ backgroundColor: "#C9A84C", color: "#4e0e17" }}
              >
                Start your journey
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 text-base font-medium rounded-full transition-all"
                style={{
                  border: "1.5px solid rgba(107,19,32,0.25)",
                  color: "#6B1320",
                }}
              >
                Sign in
              </Link>
            </div>

            {/* Trust strip */}
            <div
              className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs"
              style={{ color: "rgba(107,19,32,0.5)" }}
            >
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#6B1320" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Human verified
              </span>
              <span aria-hidden>·</span>
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <rect x="2" y="5" width="8" height="6" rx="1" stroke="#6B1320" strokeWidth="1.2"/>
                  <path d="M4 5V3.5a2 2 0 014 0V5" stroke="#6B1320" strokeWidth="1.2"/>
                </svg>
                Consent-gated chat
              </span>
              <span aria-hidden>·</span>
              <span>Always free</span>
            </div>
          </div>

          {/* Scroll cue */}
          <div className="hidden lg:flex items-center gap-3 pb-10">
            <span className="w-10 h-px" style={{ backgroundColor: "#C9A84C" }} />
            <span className="text-xs tracking-[0.3em] uppercase" style={{ color: "rgba(107,19,32,0.35)" }}>
              scroll
            </span>
          </div>
        </div>

        {/* Right — Asymmetric Photo Mosaic */}
        <div
          className="relative"
          style={{ minHeight: "50vh", backgroundColor: "#e8ddd4" }}
        >
          <div
            className="absolute inset-0"
            style={{
              display: "grid",
              gridTemplateColumns: "3fr 2fr",
              gridTemplateRows: "3fr 2fr",
              gap: "4px",
            }}
          >
            {/* Photo 1 — tall portrait, col 1, row 1+2 */}
            <div
              className="relative overflow-hidden"
              style={{ gridColumn: "1", gridRow: "1 / 3" }}
            >
              <Image
                src="/photos/couple-6.jpg"
                fill
                alt="Kerala couple in traditional attire"
                className="object-cover"
                sizes="35vw"
                priority
              />
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(to top, rgba(26,10,5,0.45) 0%, transparent 50%)",
                }}
              />
            </div>

            {/* Photo 2 — top right */}
            <div
              className="relative overflow-hidden"
              style={{ gridColumn: "2", gridRow: "1" }}
            >
              <Image
                src="/photos/couple-7.jpg"
                fill
                alt="Kerala couple"
                className="object-cover"
                sizes="25vw"
                priority
              />
            </div>

            {/* Photo 3 — bottom right with stat card */}
            <div
              className="relative overflow-hidden"
              style={{ gridColumn: "2", gridRow: "2" }}
            >
              <Image
                src="/photos/couple-4.jpg"
                fill
                alt="Couple smiling"
                className="object-cover"
                sizes="25vw"
              />
              <div className="absolute inset-0 flex items-end p-4">
                <div
                  className="w-full rounded-xl px-4 py-3"
                  style={{
                    background: "rgba(250,246,241,0.92)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <p
                    className="font-serif text-2xl font-bold leading-none"
                    style={{ color: "#6B1320" }}
                  >
                    500+
                  </p>
                  <p className="text-xs mt-0.5 font-medium" style={{ color: "#8B1A2E" }}>
                    Verified profiles
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FREE FOREVER PILLAR
      ═══════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ backgroundColor: "#FAF6F1" }}
      >
        {/* Top gold rule */}
        <div style={{ height: "3px", background: "linear-gradient(90deg, transparent, #C9A84C 20%, #C9A84C 80%, transparent)" }} />

        <div className="max-w-7xl mx-auto px-6 lg:px-14 pt-16 pb-0">
          <p
            className="text-xs tracking-[0.35em] uppercase font-semibold mb-16"
            style={{ color: "#C9A84C" }}
          >
            Our promise
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-14 pb-24 flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

          {/* Left — the price */}
          <div className="shrink-0 text-center lg:text-left">
            <p
              className="font-serif text-2xl mb-1"
              style={{ color: "#C9A84C", letterSpacing: "0.05em" }}
            >
              ₹
            </p>
            <p
              className="font-serif font-bold leading-none"
              style={{
                fontSize: "clamp(8rem, 18vw, 16rem)",
                color: "#6B1320",
                lineHeight: 0.85,
                letterSpacing: "-0.04em",
              }}
            >
              0
            </p>
            <p
              className="text-sm tracking-[0.35em] uppercase font-semibold mt-4"
              style={{ color: "rgba(107,19,32,0.4)" }}
            >
              Forever
            </p>
          </div>

          {/* Vertical divider */}
          <div
            className="hidden lg:block self-stretch w-px shrink-0"
            style={{ backgroundColor: "rgba(107,19,32,0.1)" }}
          />

          {/* Right — the statement */}
          <div className="flex-1 max-w-xl">
            <h2
              className="font-serif leading-tight mb-6"
              style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)", color: "#1A0A05" }}
            >
              Finding love shouldn&apos;t cost a fortune.
              <br />
              <em style={{ color: "#6B1320" }}>So we made it free.</em>
            </h2>
            <p className="text-base leading-relaxed mb-10" style={{ color: "#5a3d38" }}>
              Other platforms charge ₹3,000–₹15,000 a year just to send a message.
              We think that&apos;s wrong. Every core feature on Nammal — browsing profiles,
              sending interest, chatting with matches — is completely free. No
              subscriptions. No pay-to-view. No hidden costs. Ever.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                "Browse all profiles",
                "Send & receive interest",
                "Chat with your matches",
                "Photo uploads",
                "Filter by district & more",
                "Always — no expiry",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  <div
                    className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "rgba(107,19,32,0.08)" }}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5 4-4" stroke="#6B1320" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium" style={{ color: "#1A0A05" }}>{item}</span>
                </div>
              ))}
            </div>

            <Link
              href="/register"
              className="inline-block mt-10 px-8 py-4 text-sm font-semibold rounded-full transition-all hover:opacity-90"
              style={{ backgroundColor: "#6B1320", color: "#FAF6F1" }}
            >
              Start for free — no card needed
            </Link>
          </div>
        </div>

        {/* Bottom gold rule */}
        <div style={{ height: "3px", background: "linear-gradient(90deg, transparent, #C9A84C 20%, #C9A84C 80%, transparent)" }} />
      </section>

      {/* ═══════════════════════════════════════
          BOLD STATEMENT
      ═══════════════════════════════════════ */}
      <section style={{ backgroundColor: "#1A0A05" }} className="py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p
            className="font-serif italic"
            style={{
              fontSize: "clamp(3.8rem, 9vw, 9rem)",
              color: "#FAF6F1",
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
            }}
          >
            Simple.{" "}
            <em style={{ color: "#C9A84C" }}>Safe.</em>{" "}
            Free.
          </p>

          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {[
              { value: "500+", label: "Verified profiles" },
              { value: "100%", label: "Human-reviewed" },
              { value: "₹0", label: "Forever free" },
              { value: "7 days", label: "Match window" },
            ].map((s) => (
              <div key={s.label}>
                <p
                  className="font-serif text-3xl font-semibold leading-none mb-2"
                  style={{ color: "#C9A84C" }}
                >
                  {s.value}
                </p>
                <p
                  className="text-xs tracking-widest uppercase"
                  style={{ color: "rgba(250,246,241,0.35)" }}
                >
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          HOW IT WORKS — Photo + Timeline
      ═══════════════════════════════════════ */}
      <section style={{ backgroundColor: "#FAF6F1" }} className="overflow-hidden">
        <div className="flex flex-col lg:flex-row min-h-[640px]">

          {/* Left — Photo */}
          <div className="relative lg:w-1/2" style={{ minHeight: "400px" }}>
            <Image
              src="/photos/couple-5.jpg"
              fill
              alt="Couple in traditional Kerala attire"
              className="object-cover"
              sizes="50vw"
            />
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(to right, transparent 60%, rgba(250,246,241,0.15) 100%)",
              }}
            />
          </div>

          {/* Right — Steps */}
          <div className="lg:w-1/2 flex flex-col justify-center px-8 lg:px-16 xl:px-20 py-20">
            <p
              className="text-xs tracking-[0.35em] uppercase font-medium mb-12"
              style={{ color: "#C9A84C" }}
            >
              The process
            </p>

            <div className="relative flex flex-col gap-0">
              {/* Vertical connecting line */}
              <div
                className="absolute left-[1.15rem] top-10 bottom-10 w-px"
                style={{ backgroundColor: "rgba(107,19,32,0.15)" }}
              />

              {steps.map((step, i) => (
                <div key={step.n} className="relative flex gap-6 pb-12 last:pb-0">
                  {/* Step number bubble */}
                  <div
                    className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold z-10"
                    style={{
                      backgroundColor: i === 0 ? "#6B1320" : "#FAF6F1",
                      color: i === 0 ? "#C9A84C" : "rgba(107,19,32,0.4)",
                      border: "1.5px solid",
                      borderColor: i === 0 ? "#6B1320" : "rgba(107,19,32,0.2)",
                    }}
                  >
                    {step.n}
                  </div>

                  <div className="pt-1">
                    <h3
                      className="font-semibold text-lg mb-2 leading-tight"
                      style={{ color: "#1A0A05" }}
                    >
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "#5a3d38" }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FEATURE DEEP-DIVES — Alternating rows
      ═══════════════════════════════════════ */}

      {/* Row A — Verification */}
      <div style={{ backgroundColor: "#FAF6F1" }} className="flex flex-col lg:flex-row min-h-[480px]">
        <div className="lg:w-1/2 flex flex-col justify-center px-8 lg:px-14 xl:px-20 py-20">
          <p
            className="text-xs tracking-[0.3em] uppercase font-semibold mb-5"
            style={{ color: "#C9A84C" }}
          >
            Every profile verified
          </p>
          <h2
            className="font-serif leading-tight mb-6"
            style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)", color: "#1A0A05" }}
          >
            No bots. No fakes.<br />
            <em style={{ color: "#6B1320" }}>Every person is real.</em>
          </h2>
          <p className="text-base leading-relaxed max-w-md" style={{ color: "#5a3d38" }}>
            Our team personally reviews every profile submission before it becomes
            visible. We check photos, verify details, and ensure authenticity.
            Only real people, looking for real connections.
          </p>
          <div
            className="mt-8 inline-flex items-center gap-2 text-sm font-medium"
            style={{ color: "#6B1320" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8S4.41 14.5 8 14.5 14.5 11.59 14.5 8 11.59 1.5 8 1.5zm-1 8.44L5.56 8.5 4.5 9.56 7 12.06l6-6-1.06-1.06L7 9.94z" fill="#6B1320"/>
            </svg>
            100% human-reviewed
          </div>
        </div>
        <div className="relative lg:w-1/2" style={{ minHeight: "320px" }}>
          <Image
            src="/photos/couple-1.jpg"
            fill
            alt="Verified couple"
            className="object-cover"
            sizes="50vw"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to left, transparent 70%, rgba(250,246,241,0.1))" }}
          />
        </div>
      </div>

      {/* Row B — Safety & Free */}
      <div style={{ backgroundColor: "#f5ede4" }} className="flex flex-col lg:flex-row-reverse min-h-[480px]">
        <div className="lg:w-1/2 flex flex-col justify-center px-8 lg:px-14 xl:px-20 py-20">
          <p
            className="text-xs tracking-[0.3em] uppercase font-semibold mb-5"
            style={{ color: "#C9A84C" }}
          >
            Safe & free forever
          </p>
          <h2
            className="font-serif leading-tight mb-6"
            style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)", color: "#1A0A05" }}
          >
            Your boundaries<br />
            <em style={{ color: "#6B1320" }}>are the law here.</em>
          </h2>
          <p className="text-base leading-relaxed max-w-md" style={{ color: "#5a3d38" }}>
            Chat only opens when both parties say yes. Women control who can contact them.
            Block and report in one tap. And it&apos;s completely free — no subscriptions,
            no pay-to-view, no hidden costs. Ever.
          </p>
          <div className="mt-8 flex flex-col gap-2">
            {["Consent-gated messaging", "Women's safety controls", "Free core features, always"].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm" style={{ color: "#6B1320" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2.5 7l3 3 6-6" stroke="#6B1320" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="relative lg:w-1/2" style={{ minHeight: "320px" }}>
          <Image
            src="/photos/couple-3.jpg"
            fill
            alt="Safe and trusted"
            className="object-cover"
            sizes="50vw"
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════
          GALLERY — Horizontal Scroll
      ═══════════════════════════════════════ */}
      <section style={{ backgroundColor: "#1A0A05" }} className="py-20">
        <div className="mb-12 px-8 lg:px-14">
          <p
            className="font-malayalam text-xl mb-3"
            style={{ color: "#C9A84C" }}
          >
            നമ്മൾ ഒരുമിച്ച്
          </p>
          <h2
            className="font-serif leading-tight"
            style={{ fontSize: "clamp(2.5rem, 4vw, 4rem)", color: "#FAF6F1" }}
          >
            Bonds built here
          </h2>
        </div>

        {/* Scrollable strip */}
        <div
          className="flex gap-4 px-8 lg:px-14"
          style={{
            overflowX: "auto",
            overflowY: "hidden",
            scrollSnapType: "x mandatory",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {galleryPhotos.map((photo, i) => (
            <div
              key={i}
              className="relative rounded-2xl overflow-hidden shrink-0"
              style={{
                width: "260px",
                height: "400px",
                scrollSnapAlign: "start",
              }}
            >
              <Image
                src={photo.src}
                fill
                alt={photo.name}
                className="object-cover transition-transform duration-700 hover:scale-105"
                sizes="260px"
              />
              <div
                className="absolute inset-0 flex flex-col justify-end p-5"
                style={{
                  background: "linear-gradient(to top, rgba(26,10,5,0.85) 0%, transparent 55%)",
                }}
              >
                <p className="font-semibold text-sm" style={{ color: "#FAF6F1" }}>
                  {photo.name}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(201,168,76,0.8)" }}>
                  {photo.district}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p
          className="text-center mt-10 text-sm px-8"
          style={{ color: "rgba(250,246,241,0.3)" }}
        >
          Join{" "}
          <span style={{ color: "#C9A84C", fontWeight: 600 }}>500+ Kerala families</span>
          {" "}who found their match on Nammal
        </p>
      </section>

      {/* ═══════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════ */}
      <section
        className="py-32 relative overflow-hidden"
        style={{ backgroundColor: "#6B1320" }}
      >
        {/* Kerala textile-inspired pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              repeating-linear-gradient(60deg, transparent, transparent 30px, rgba(201,168,76,0.04) 30px, rgba(201,168,76,0.04) 31px),
              repeating-linear-gradient(-60deg, transparent, transparent 30px, rgba(201,168,76,0.04) 30px, rgba(201,168,76,0.04) 31px)
            `,
          }}
        />
        {/* Concentric rings */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
          style={{ border: "1.5px solid rgba(201,168,76,0.12)" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{ border: "1.5px solid rgba(201,168,76,0.12)" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full"
          style={{ border: "1.5px solid rgba(201,168,76,0.1)" }}
        />

        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <p
            className="text-sm tracking-[0.3em] uppercase font-medium mb-5"
            style={{ color: "rgba(201,168,76,0.6)" }}
          >
            Join 500+ Kerala families
          </p>
          <p
            className="font-malayalam text-xl mb-6"
            style={{ color: "rgba(201,168,76,0.5)" }}
          >
            ഇവിടെ നിന്ന് തുടങ്ങട്ടെ
          </p>
          <h2
            className="font-serif leading-[0.95] mb-8"
            style={{
              fontSize: "clamp(3rem, 6vw, 5.5rem)",
              color: "#FAF6F1",
            }}
          >
            Your story begins<br />
            <em style={{ color: "#C9A84C" }}>here</em>
          </h2>
          <p
            className="text-lg mb-12 max-w-xl mx-auto leading-relaxed"
            style={{ color: "rgba(250,246,241,0.6)" }}
          >
            Thousands of Kerala families found their match. Yours could be next.
            Always completely free.
          </p>
          <Link
            href="/register"
            className="inline-block px-12 py-5 text-base font-semibold rounded-full transition-all hover:opacity-90"
            style={{ backgroundColor: "#C9A84C", color: "#4e0e17" }}
          >
            Create your free profile
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ backgroundColor: "#1A0A05" }} className="py-14">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-10">
            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-serif text-xl font-semibold" style={{ color: "#FAF6F1" }}>
                  Nammal
                </span>
                <span className="font-malayalam text-sm" style={{ color: "#C9A84C" }}>
                  നമ്മൾ
                </span>
              </div>
              <p className="text-sm" style={{ color: "rgba(250,246,241,0.3)" }}>
                Free matrimony for the Kerala community
              </p>
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              {["About", "Privacy", "Terms", "Contact"].map((link) => (
                <Link
                  key={link}
                  href="#"
                  className="transition-colors"
                  style={{ color: "rgba(250,246,241,0.3)" }}
                >
                  {link}
                </Link>
              ))}
            </div>
          </div>
          <div
            className="pt-8 text-sm text-center"
            style={{
              borderTop: "1px solid rgba(250,246,241,0.07)",
              color: "rgba(250,246,241,0.18)",
            }}
          >
            Made with care for Kerala &nbsp;&middot;&nbsp; &copy; 2025 Nammal
          </div>
        </div>
      </footer>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { requestNotificationToken } from "@/lib/firebase";
import { useAuthStore } from "@/store/auth";

const phoneSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
});
const otpSchema = z.object({
  otp: z.string().length(6, "Enter the 6-digit OTP"),
});

type PhoneForm = z.infer<typeof phoneSchema>;
type OtpForm = z.infer<typeof otpSchema>;

const bgPhotos = [
  "/photos/couple-6.jpg",
  "/photos/couple-7.jpg",
  "/photos/couple-1.jpg",
  "/photos/couple-4.jpg",
  "/photos/couple-5.jpg",
  "/photos/couple-3.jpg",
];

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [apiError, setApiError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRef = useRef<HTMLInputElement>(null);

  const phoneForm = useForm<PhoneForm>({ resolver: zodResolver(phoneSchema) });
  const otpForm = useForm<OtpForm>({ resolver: zodResolver(otpSchema) });

  // Countdown for resend OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const onPhoneSubmit = async (data: PhoneForm) => {
    setApiError("");
    try {
      await api.post("/api/auth/send-otp", { phone: data.phone });
      setPhone(data.phone);
      setStep("otp");
      setResendCooldown(60);
      setTimeout(() => otpInputRef.current?.focus(), 100);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Failed to send OTP");
    }
  };

  const onOtpSubmit = async (data: OtpForm) => {
    setApiError("");
    try {
      const res = await api.post<{ accessToken: string; user: { id: string; status: string; gender: string; phone: string; isAdmin: boolean } }>(
        "/api/auth/verify-otp",
        { phone, otp: data.otp }
      );
      const { accessToken, user } = res.data;
      localStorage.setItem("accessToken", accessToken);
      document.cookie = `nammal_session=1; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
      if (user.isAdmin) {
        document.cookie = `nammal_admin=1; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
      }
      setAuth(
        { id: user.id, phone: user.phone ?? phone, status: user.status as never, gender: user.gender as never, isAdmin: user.isAdmin },
        accessToken
      );
      // Register FCM token for push notifications (best-effort)
      requestNotificationToken().then((fcmToken) => {
        if (fcmToken) {
          api.put("/api/auth/fcm-token", { token: fcmToken }, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }).catch(() => {});
        }
      }).catch(() => {});
      // Admin → dashboard; new user (no gender) → register; existing → browse
      if (user.isAdmin) {
        router.push("/admin");
      } else if (!user.gender) {
        router.push("/register");
      } else {
        router.push("/browse");
      }
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Invalid OTP");
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await api.post("/api/auth/send-otp", { phone });
      setResendCooldown(60);
      otpForm.reset();
      setApiError("");
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Failed to resend OTP");
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* Background — photo grid */}
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-1">
        {bgPhotos.map((src, i) => (
          <div key={i} className="relative overflow-hidden">
            <Image src={src} fill alt="" className="object-cover" sizes="33vw" priority={i < 3} />
          </div>
        ))}
      </div>

      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, rgba(26,10,5,0.88) 0%, rgba(107,19,32,0.82) 50%, rgba(26,10,5,0.90) 100%)",
        }}
      />

      {/* Subtle pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "repeating-linear-gradient(60deg, transparent, transparent 40px, rgba(201,168,76,0.03) 40px, rgba(201,168,76,0.03) 41px)",
        }}
      />

      {/* Glass card */}
      <div
        className="relative z-10 w-full max-w-sm mx-4"
        style={{
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(201,168,76,0.25)",
          borderRadius: "20px",
          padding: "2.5rem 2rem",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
        }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-1">
            <svg width="32" height="32" viewBox="0 0 36 36" fill="none" aria-hidden="true">
              <circle cx="13" cy="18" r="10" stroke="#C9A84C" strokeWidth="2" fill="none" strokeOpacity="0.8"/>
              <circle cx="23" cy="18" r="10" stroke="rgba(250,246,241,0.5)" strokeWidth="2" fill="none"/>
            </svg>
            <span className="font-serif text-2xl font-semibold" style={{ color: "#FAF6F1" }}>
              Nammal
            </span>
          </div>
          <p className="font-malayalam text-sm" style={{ color: "#C9A84C" }}>നമ്മൾ</p>
          <p className="text-sm mt-3" style={{ color: "rgba(250,246,241,0.6)" }}>
            {step === "phone"
              ? "Sign in with your mobile number"
              : `OTP sent to +91 ${phone}`}
          </p>
        </div>

        {/* Phone step */}
        {step === "phone" && (
          <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
            <div>
              <label
                className="block text-xs font-semibold tracking-widest uppercase mb-2"
                style={{ color: "rgba(250,246,241,0.5)" }}
              >
                Mobile Number
              </label>
              <div className="flex">
                <span
                  className="inline-flex items-center px-3 text-sm font-medium rounded-l-xl"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(201,168,76,0.25)",
                    borderRight: "none",
                    color: "rgba(250,246,241,0.7)",
                  }}
                >
                  +91
                </span>
                <input
                  {...phoneForm.register("phone")}
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="9876543210"
                  className="flex-1 px-4 py-3 text-base rounded-r-xl outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(201,168,76,0.25)",
                    color: "#FAF6F1",
                    caretColor: "#C9A84C",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.6)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.25)")}
                />
              </div>
              {phoneForm.formState.errors.phone && (
                <p className="text-xs mt-1.5" style={{ color: "#f87171" }}>
                  {phoneForm.formState.errors.phone.message}
                </p>
              )}
            </div>

            {apiError && (
              <p className="text-xs text-center" style={{ color: "#f87171" }}>{apiError}</p>
            )}

            <button
              type="submit"
              disabled={phoneForm.formState.isSubmitting}
              className="w-full py-3.5 text-sm font-bold rounded-xl transition-all disabled:opacity-50"
              style={{ backgroundColor: "#C9A84C", color: "#4e0e17" }}
            >
              {phoneForm.formState.isSubmitting ? "Sending…" : "Send OTP →"}
            </button>
          </form>
        )}

        {/* OTP step */}
        {step === "otp" && (
          <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
            <div>
              <label
                className="block text-xs font-semibold tracking-widest uppercase mb-2"
                style={{ color: "rgba(250,246,241,0.5)" }}
              >
                6-digit OTP
              </label>
              <input
                {...otpForm.register("otp")}
                ref={(el) => {
                  otpForm.register("otp").ref(el);
                  (otpInputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="· · · · · ·"
                className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] rounded-xl outline-none"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(201,168,76,0.25)",
                  color: "#FAF6F1",
                  caretColor: "#C9A84C",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.6)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.25)")}
              />
              {otpForm.formState.errors.otp && (
                <p className="text-xs mt-1.5" style={{ color: "#f87171" }}>
                  {otpForm.formState.errors.otp.message}
                </p>
              )}
            </div>

            {apiError && (
              <p className="text-xs text-center" style={{ color: "#f87171" }}>{apiError}</p>
            )}

            <button
              type="submit"
              disabled={otpForm.formState.isSubmitting}
              className="w-full py-3.5 text-sm font-bold rounded-xl transition-all disabled:opacity-50"
              style={{ backgroundColor: "#C9A84C", color: "#4e0e17" }}
            >
              {otpForm.formState.isSubmitting ? "Verifying…" : "Verify & Sign in →"}
            </button>

            <div className="flex items-center justify-between text-xs" style={{ color: "rgba(250,246,241,0.4)" }}>
              <button type="button" onClick={() => { setStep("phone"); setApiError(""); }}>
                ← Change number
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="disabled:opacity-40"
                style={{ color: resendCooldown > 0 ? "rgba(250,246,241,0.3)" : "#C9A84C" }}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
              </button>
            </div>
          </form>
        )}

        <p
          className="text-center text-xs mt-6"
          style={{ color: "rgba(250,246,241,0.35)" }}
        >
          New here?{" "}
          <Link href="/register" style={{ color: "#C9A84C" }} className="font-medium">
            Create your free profile
          </Link>
        </p>
      </div>
    </main>
  );
}

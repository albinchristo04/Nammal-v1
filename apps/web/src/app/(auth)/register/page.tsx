"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, uploadPhoto } from "@/lib/api";
import { requestNotificationToken } from "@/lib/firebase";
import { useAuthStore } from "@/store/auth";

// ─── Schemas ─────────────────────────────────────────────────────────────────

const phoneSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
});
const otpSchema = z.object({
  otp: z.string().length(6, "Enter the 6-digit OTP"),
});
const step2Schema = z.object({
  fullName: z.string().min(2, "Name is required").max(100),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["MALE", "FEMALE"], { required_error: "Select gender" }),
  religion: z.string().min(1, "Religion is required"),
  community: z.string().optional(),
  maritalStatus: z.enum(["NEVER_MARRIED", "DIVORCED", "WIDOWED"]),
});
const step3Schema = z.object({
  district: z.string().min(1, "Select your district"),
  education: z.string().min(1, "Education is required"),
  occupation: z.string().min(1, "Occupation is required"),
  incomeRange: z.string().min(1, "Select income range"),
});
const step4Schema = z.object({
  heightCm: z.coerce.number().int().min(130).max(220),
  star: z.string().optional(),
  rasi: z.string().optional(),
  contactPreference: z.enum(["SELF", "FAMILY"]),
});
const step5Schema = z.object({
  aboutMe: z.string().max(500).optional(),
});

type PhoneForm = z.infer<typeof phoneSchema>;
type OtpForm = z.infer<typeof otpSchema>;
type Step2Form = z.infer<typeof step2Schema>;
type Step3Form = z.infer<typeof step3Schema>;
type Step4Form = z.infer<typeof step4Schema>;
type Step5Form = z.infer<typeof step5Schema>;

// ─── Constants ────────────────────────────────────────────────────────────────

const KERALA_DISTRICTS = [
  "Thiruvananthapuram","Kollam","Pathanamthitta","Alappuzha","Kottayam",
  "Idukki","Ernakulam","Thrissur","Palakkad","Malappuram",
  "Kozhikode","Wayanad","Kannur","Kasaragod",
];
const RELIGIONS = ["Hindu","Muslim","Christian","Other"];
const INCOME_RANGES = ["Below ₹2L","₹2L–5L","₹5L–10L","₹10L–20L","Above ₹20L"];
const STARS = [
  "Ashwini","Bharani","Karthika","Rohini","Mrigashira","Ardra","Punarvasu",
  "Pushya","Ashlesha","Magha","Poorvaphalguni","Uttaraphalguni","Hasta",
  "Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Mula","Poorvashadha",
  "Uttarashadha","Shravana","Dhanishtha","Shatabhisha","Poorvabhadra",
  "Uttarabhadra","Revati",
];
const RASIS = [
  "Mesha","Vrishabha","Mithuna","Karka","Simha","Kanya",
  "Tula","Vrischika","Dhanu","Makara","Kumbha","Meena",
];

const STEPS = [
  "Phone verification",
  "Personal details",
  "Location & education",
  "Physical & family",
  "About me & photos",
];

// ─── Field helpers ────────────────────────────────────────────────────────────

const inputCls = `w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors
  bg-white border-[rgba(107,19,32,0.15)] text-[#1A0A05] placeholder-[rgba(107,19,32,0.3)]
  focus:border-[#6B1320] focus:ring-2 focus:ring-[rgba(107,19,32,0.1)]`;

const selectCls = `w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors
  bg-white border-[rgba(107,19,32,0.15)] text-[#1A0A05]
  focus:border-[#6B1320] focus:ring-2 focus:ring-[rgba(107,19,32,0.1)]`;

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{msg}</p>;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold tracking-widest uppercase mb-1.5"
      style={{ color: "rgba(107,19,32,0.5)" }}>
      {children}
    </label>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth, accessToken } = useAuthStore();

  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState("");
  const [apiError, setApiError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Photo upload state
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Accumulated profile data across steps
  const [profileData, setProfileData] = useState<Record<string, unknown>>({});

  const phoneForm = useForm<PhoneForm>({ resolver: zodResolver(phoneSchema) });
  const otpForm = useForm<OtpForm>({ resolver: zodResolver(otpSchema) });
  const step2Form = useForm<Step2Form>({ resolver: zodResolver(step2Schema) });
  const step3Form = useForm<Step3Form>({ resolver: zodResolver(step3Schema) });
  const step4Form = useForm<Step4Form>({
    resolver: zodResolver(step4Schema),
    defaultValues: { contactPreference: "SELF" },
  });
  const step5Form = useForm<Step5Form>({ resolver: zodResolver(step5Schema) });

  // ── Step 0: Send OTP ──
  const onPhoneSubmit = async (data: PhoneForm) => {
    setApiError("");
    try {
      await api.post("/api/auth/send-otp", { phone: data.phone });
      setPhone(data.phone);
      setStep(1);
      setResendCooldown(60);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Failed to send OTP");
    }
  };

  // ── Step 1: Verify OTP ──
  const onOtpSubmit = async (data: OtpForm) => {
    setApiError("");
    try {
      const res = await api.post<{ accessToken: string; user: { id: string; status: string; gender?: string; phone?: string; isAdmin?: boolean } }>(
        "/api/auth/verify-otp", { phone, otp: data.otp }
      );
      const { accessToken: token, user } = res.data;
      localStorage.setItem("accessToken", token);
      document.cookie = `nammal_session=1; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
      if (user.isAdmin) {
        document.cookie = `nammal_admin=1; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
      }
      setAuth(
        { id: user.id, phone: user.phone ?? phone, status: user.status as never, gender: user.gender as never, isAdmin: user.isAdmin },
        token
      );
      // Register FCM token for push notifications (best-effort)
      requestNotificationToken().then((fcmToken) => {
        if (fcmToken) {
          api.put("/api/auth/fcm-token", { token: fcmToken }, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        }
      }).catch(() => {});
      // If existing user with profile, skip to browse
      if (user.gender) { router.push("/browse"); return; }
      setStep(2);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Invalid or expired OTP");
    }
  };

  // ── Steps 2–4: Accumulate data ──
  const onStep2 = (data: Step2Form) => {
    setProfileData((prev) => ({ ...prev, ...data }));
    setStep(3);
  };
  const onStep3 = (data: Step3Form) => {
    setProfileData((prev) => ({ ...prev, ...data }));
    setStep(4);
  };
  const onStep4 = (data: Step4Form) => {
    setProfileData((prev) => ({ ...prev, ...data }));
    setStep(5);
  };

  // ── Step 5: Submit profile + photos ──
  const onStep5 = async (data: Step5Form) => {
    if (photos.length === 0) { setApiError("Please add at least one photo"); return; }
    setApiError("");
    setUploading(true);
    try {
      const token = accessToken || localStorage.getItem("accessToken") || "";
      // Format dateOfBirth as ISO datetime
      const dob = new Date((profileData.dateOfBirth as string));
      const payload = { ...profileData, ...data, dateOfBirth: dob.toISOString(), heightCm: Number(profileData.heightCm) };
      await api.post("/api/profile", payload);
      // Upload photos sequentially
      for (const file of photos) {
        await uploadPhoto(file, token);
      }
      router.push("/pending");
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setUploading(false);
    }
  };

  const addPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 5 - photos.length;
    const newFiles = files.slice(0, remaining);
    setPhotos((p) => [...p, ...newFiles]);
    setPhotoPreviews((p) => [...p, ...newFiles.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const removePhoto = (i: number) => {
    setPhotos((p) => p.filter((_, idx) => idx !== i));
    setPhotoPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await api.post("/api/auth/send-otp", { phone });
      setResendCooldown(60);
      otpForm.reset();
    } catch {/* silent */}
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: "#FAF6F1" }}>
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none" aria-hidden="true">
              <circle cx="13" cy="18" r="10" stroke="#6B1320" strokeWidth="2.5" fill="none"/>
              <circle cx="23" cy="18" r="10" stroke="#C9A84C" strokeWidth="2.5" fill="none"/>
            </svg>
            <span className="font-serif text-xl font-semibold" style={{ color: "#6B1320" }}>Nammal</span>
            <span className="font-malayalam text-sm" style={{ color: "#C9A84C" }}>നമ്മൾ</span>
          </Link>
          <h1 className="font-serif text-2xl" style={{ color: "#1A0A05" }}>Create your free profile</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(107,19,32,0.5)" }}>
            Step {Math.min(step + 1, 5)} of 5 — {STEPS[Math.min(step, 4)]}
          </p>
        </div>

        {/* Progress bar */}
        {step > 0 && (
          <div className="flex gap-1.5 mb-8">
            {STEPS.map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full transition-all duration-500"
                style={{ backgroundColor: i < step ? "#6B1320" : i === step - 1 ? "#C9A84C" : "rgba(107,19,32,0.12)" }}
              />
            ))}
          </div>
        )}

        {/* Card */}
        <div className="rounded-2xl p-8"
          style={{ backgroundColor: "white", border: "1px solid rgba(107,19,32,0.1)", boxShadow: "0 4px 40px rgba(107,19,32,0.08)" }}>

          {apiError && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
              {apiError}
            </div>
          )}

          {/* ── Step 0: Phone ── */}
          {step === 0 && (
            <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-5">
              <div>
                <Label>Mobile Number</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm rounded-l-xl"
                    style={{ background: "rgba(107,19,32,0.05)", border: "1px solid rgba(107,19,32,0.15)", borderRight: "none", color: "rgba(107,19,32,0.6)" }}>
                    +91
                  </span>
                  <input {...phoneForm.register("phone")} type="tel" inputMode="numeric"
                    maxLength={10} placeholder="9876543210"
                    className={inputCls + " rounded-l-none"} />
                </div>
                <FieldError msg={phoneForm.formState.errors.phone?.message} />
              </div>
              <SubmitBtn loading={phoneForm.formState.isSubmitting} label="Send OTP →" />
              <p className="text-center text-xs" style={{ color: "rgba(107,19,32,0.4)" }}>
                Already registered?{" "}
                <Link href="/login" style={{ color: "#6B1320" }} className="font-semibold">Sign in</Link>
              </p>
            </form>
          )}

          {/* ── Step 1: OTP ── */}
          {step === 1 && (
            <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-5">
              <p className="text-sm text-center" style={{ color: "rgba(107,19,32,0.6)" }}>
                OTP sent to <strong>+91 {phone}</strong>
              </p>
              <div>
                <Label>6-digit OTP</Label>
                <input {...otpForm.register("otp")} type="text" inputMode="numeric"
                  maxLength={6} placeholder="· · · · · ·" autoFocus
                  className={inputCls + " text-center text-2xl tracking-[0.5em]"} />
                <FieldError msg={otpForm.formState.errors.otp?.message} />
              </div>
              <SubmitBtn loading={otpForm.formState.isSubmitting} label="Verify OTP →" />
              <div className="flex justify-between text-xs" style={{ color: "rgba(107,19,32,0.4)" }}>
                <button type="button" onClick={() => setStep(0)}>← Change number</button>
                <button type="button" onClick={handleResend} disabled={resendCooldown > 0}
                  style={{ color: resendCooldown > 0 ? "rgba(107,19,32,0.3)" : "#6B1320" }}>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                </button>
              </div>
            </form>
          )}

          {/* ── Step 2: Personal details ── */}
          {step === 2 && (
            <form onSubmit={step2Form.handleSubmit(onStep2)} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Full Name</Label>
                  <input {...step2Form.register("fullName")} placeholder="Your full name" className={inputCls} />
                  <FieldError msg={step2Form.formState.errors.fullName?.message} />
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <input {...step2Form.register("dateOfBirth")} type="date" className={inputCls}
                    max={new Date(Date.now() - 18 * 365.25 * 86400000).toISOString().split("T")[0]} />
                  <FieldError msg={step2Form.formState.errors.dateOfBirth?.message} />
                </div>
                <div>
                  <Label>Gender</Label>
                  <select {...step2Form.register("gender")} className={selectCls}>
                    <option value="">Select</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                  <FieldError msg={step2Form.formState.errors.gender?.message} />
                </div>
                <div>
                  <Label>Religion</Label>
                  <select {...step2Form.register("religion")} className={selectCls}>
                    <option value="">Select</option>
                    {RELIGIONS.map((r) => <option key={r}>{r}</option>)}
                  </select>
                  <FieldError msg={step2Form.formState.errors.religion?.message} />
                </div>
                <div>
                  <Label>Community <span style={{ color: "rgba(107,19,32,0.35)" }}>(optional)</span></Label>
                  <input {...step2Form.register("community")} placeholder="e.g. Nair, Ezhava…" className={inputCls} />
                </div>
                <div className="col-span-2">
                  <Label>Marital Status</Label>
                  <select {...step2Form.register("maritalStatus")} className={selectCls}>
                    <option value="">Select</option>
                    <option value="NEVER_MARRIED">Never married</option>
                    <option value="DIVORCED">Divorced</option>
                    <option value="WIDOWED">Widowed</option>
                  </select>
                  <FieldError msg={step2Form.formState.errors.maritalStatus?.message} />
                </div>
              </div>
              <StepNav onBack={() => setStep(1)} loading={step2Form.formState.isSubmitting} />
            </form>
          )}

          {/* ── Step 3: Location & education ── */}
          {step === 3 && (
            <form onSubmit={step3Form.handleSubmit(onStep3)} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>District</Label>
                  <select {...step3Form.register("district")} className={selectCls}>
                    <option value="">Select district</option>
                    {KERALA_DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                  <FieldError msg={step3Form.formState.errors.district?.message} />
                </div>
                <div className="col-span-2">
                  <Label>Highest Education</Label>
                  <input {...step3Form.register("education")} placeholder="e.g. B.Tech, MBA, MBBS…" className={inputCls} />
                  <FieldError msg={step3Form.formState.errors.education?.message} />
                </div>
                <div className="col-span-2">
                  <Label>Occupation</Label>
                  <input {...step3Form.register("occupation")} placeholder="e.g. Software Engineer, Doctor…" className={inputCls} />
                  <FieldError msg={step3Form.formState.errors.occupation?.message} />
                </div>
                <div className="col-span-2">
                  <Label>Annual Income</Label>
                  <select {...step3Form.register("incomeRange")} className={selectCls}>
                    <option value="">Select range</option>
                    {INCOME_RANGES.map((i) => <option key={i}>{i}</option>)}
                  </select>
                  <FieldError msg={step3Form.formState.errors.incomeRange?.message} />
                </div>
              </div>
              <StepNav onBack={() => setStep(2)} loading={step3Form.formState.isSubmitting} />
            </form>
          )}

          {/* ── Step 4: Physical & family ── */}
          {step === 4 && (
            <form onSubmit={step4Form.handleSubmit(onStep4)} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Height (cm)</Label>
                  <input {...step4Form.register("heightCm")} type="number" min={130} max={220}
                    placeholder="e.g. 165" className={inputCls} />
                  <FieldError msg={step4Form.formState.errors.heightCm?.message} />
                </div>
                <div>
                  <Label>Star (Nakshatra) <span style={{ color: "rgba(107,19,32,0.35)" }}>(optional)</span></Label>
                  <select {...step4Form.register("star")} className={selectCls}>
                    <option value="">Select</option>
                    {STARS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Rasi <span style={{ color: "rgba(107,19,32,0.35)" }}>(optional)</span></Label>
                  <select {...step4Form.register("rasi")} className={selectCls}>
                    <option value="">Select</option>
                    {RASIS.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <Label>Contact preference</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["SELF", "FAMILY"] as const).map((val) => (
                      <label key={val} className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all"
                        style={{
                          border: `1.5px solid ${step4Form.watch("contactPreference") === val ? "#6B1320" : "rgba(107,19,32,0.15)"}`,
                          backgroundColor: step4Form.watch("contactPreference") === val ? "rgba(107,19,32,0.05)" : "white",
                        }}>
                        <input type="radio" {...step4Form.register("contactPreference")} value={val} className="sr-only" />
                        <span className="text-sm font-medium" style={{ color: "#1A0A05" }}>
                          {val === "SELF" ? "Self" : "Through family"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <StepNav onBack={() => setStep(3)} loading={step4Form.formState.isSubmitting} />
            </form>
          )}

          {/* ── Step 5: About & photos ── */}
          {step === 5 && (
            <form onSubmit={step5Form.handleSubmit(onStep5)} className="space-y-5">
              <div>
                <Label>About Me <span style={{ color: "rgba(107,19,32,0.35)" }}>(optional)</span></Label>
                <textarea {...step5Form.register("aboutMe")} rows={4} maxLength={500}
                  placeholder="Share a little about yourself, your values, and what you're looking for…"
                  className={inputCls + " resize-none"} />
                <p className="text-xs mt-1 text-right" style={{ color: "rgba(107,19,32,0.35)" }}>
                  {step5Form.watch("aboutMe")?.length ?? 0}/500
                </p>
              </div>

              {/* Photo upload */}
              <div>
                <Label>Photos <span style={{ color: "#dc2626" }}>*</span> <span style={{ color: "rgba(107,19,32,0.35)" }}>(1–5 photos)</span></Label>
                <div className="grid grid-cols-3 gap-3">
                  {photoPreviews.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden"
                      style={{ border: "1.5px solid rgba(107,19,32,0.15)" }}>
                      <Image src={src} fill alt="Preview" className="object-cover" sizes="120px" />
                      <button type="button" onClick={() => removePhoto(i)}
                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: "rgba(26,10,5,0.75)", color: "white" }}>
                        ×
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 text-xs px-1.5 py-0.5 rounded font-semibold"
                          style={{ backgroundColor: "#C9A84C", color: "#4e0e17" }}>
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                  {photos.length < 5 && (
                    <button type="button" onClick={() => fileRef.current?.click()}
                      className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-colors"
                      style={{ border: "1.5px dashed rgba(107,19,32,0.25)", color: "rgba(107,19,32,0.4)" }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      <span className="text-xs">Add photo</span>
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only"
                  onChange={addPhoto} />
                <p className="text-xs mt-2" style={{ color: "rgba(107,19,32,0.4)" }}>
                  First photo is your primary. Max 5MB each.
                </p>
              </div>

              <StepNav onBack={() => setStep(4)} loading={uploading} submitLabel={uploading ? "Submitting…" : "Submit profile →"} />
            </form>
          )}
        </div>

        {/* Step dots */}
        {step > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {[2,3,4,5].map((s) => (
              <div key={s} className="w-1.5 h-1.5 rounded-full transition-all"
                style={{ backgroundColor: step >= s ? "#6B1320" : "rgba(107,19,32,0.2)" }} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function SubmitBtn({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button type="submit" disabled={loading}
      className="w-full py-3.5 text-sm font-bold rounded-xl transition-all disabled:opacity-50"
      style={{ backgroundColor: "#6B1320", color: "#FAF6F1" }}>
      {loading ? "Please wait…" : label}
    </button>
  );
}

function StepNav({ onBack, loading, submitLabel }: { onBack: () => void; loading?: boolean; submitLabel?: string }) {
  return (
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onBack}
        className="flex-1 py-3 text-sm font-medium rounded-xl transition-colors"
        style={{ border: "1.5px solid rgba(107,19,32,0.2)", color: "#6B1320" }}>
        ← Back
      </button>
      <button type="submit" disabled={loading}
        className="flex-1 py-3 text-sm font-bold rounded-xl transition-all disabled:opacity-50"
        style={{ backgroundColor: "#6B1320", color: "#FAF6F1" }}>
        {loading ? "Please wait…" : submitLabel || "Continue →"}
      </button>
    </div>
  );
}

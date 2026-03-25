"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, uploadPhoto } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

// ── Constants (same as register page) ─────────────────────────────────────────
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

// ── Schema ─────────────────────────────────────────────────────────────────────
const editSchema = z.object({
  fullName:          z.string().min(2).max(100),
  dateOfBirth:       z.string().min(1),
  religion:          z.string().min(1),
  community:         z.string().optional(),
  maritalStatus:     z.enum(["NEVER_MARRIED","DIVORCED","WIDOWED"]),
  district:          z.string().min(1),
  education:         z.string().min(1),
  occupation:        z.string().min(1),
  incomeRange:       z.string().min(1),
  heightCm:          z.coerce.number().int().min(130).max(220),
  star:              z.string().optional(),
  rasi:              z.string().optional(),
  contactPreference: z.enum(["SELF","FAMILY"]),
  aboutMe:           z.string().max(500).optional(),
});
type EditForm = z.infer<typeof editSchema>;

interface ProfilePhoto { id: string; url: string; isPrimary: boolean; }
interface ProfileData extends EditForm {
  id: string;
  photos: ProfilePhoto[];
  isDeactivated: boolean;
  isMatchFound: boolean;
}

// ── Shared style helpers ───────────────────────────────────────────────────────
const inputCls = `w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors
  bg-white border-[rgba(107,19,32,0.15)] text-[#1A0A05] placeholder-[rgba(107,19,32,0.3)]
  focus:border-[#6B1320] focus:ring-2 focus:ring-[rgba(107,19,32,0.1)]`;
const selectCls = `w-full px-4 py-3 rounded-xl border text-sm outline-none bg-white
  border-[rgba(107,19,32,0.15)] text-[#1A0A05]
  focus:border-[#6B1320] focus:ring-2 focus:ring-[rgba(107,19,32,0.1)]`;

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold tracking-widest uppercase mb-1.5"
      style={{ color: "rgba(107,19,32,0.5)" }}>
      {children}
    </label>
  );
}
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs mt-1 text-red-600">{msg}</p>;
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter();
  const { user, clearAuth, accessToken } = useAuthStore();

  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [apiError, setApiError]     = useState("");
  const [photos, setPhotos]         = useState<ProfilePhoto[]>([]);
  const [uploading, setUploading]   = useState(false);
  const [deactivated, setDeactivated] = useState(false);
  const [matchFound, setMatchFound]   = useState(false);
  const [showDelete, setShowDelete]   = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } =
    useForm<EditForm>({ resolver: zodResolver(editSchema) });

  // Load existing profile
  useEffect(() => {
    api.get<ProfileData>("/api/profile/me")
      .then(({ data }) => {
        setPhotos(data.photos);
        setDeactivated(data.isDeactivated);
        setMatchFound(data.isMatchFound);
        reset({
          fullName:          data.fullName,
          dateOfBirth:       data.dateOfBirth?.split("T")[0] ?? "",
          religion:          data.religion,
          community:         data.community ?? "",
          maritalStatus:     data.maritalStatus,
          district:          data.district,
          education:         data.education,
          occupation:        data.occupation,
          incomeRange:       data.incomeRange,
          heightCm:          data.heightCm,
          star:              data.star ?? "",
          rasi:              data.rasi ?? "",
          contactPreference: data.contactPreference,
          aboutMe:           data.aboutMe ?? "",
        });
      })
      .catch(() => router.push("/browse"))
      .finally(() => setLoading(false));
  }, [reset, router]);

  // Save profile details
  const onSubmit = async (data: EditForm) => {
    setSaving(true);
    setApiError("");
    try {
      const dob = new Date(data.dateOfBirth);
      await api.put("/api/profile/me", { ...data, dateOfBirth: dob.toISOString() });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setApiError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Upload new photo
  const onAddPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    try {
      const token = accessToken || localStorage.getItem("accessToken") || "";
      const url = await uploadPhoto(file, token);
      setPhotos((p) => [...p, { id: Date.now().toString(), url, isPrimary: p.length === 0 }]);
    } catch {
      setApiError("Photo upload failed.");
    } finally {
      setUploading(false);
    }
  };

  // Delete a photo
  const onDeletePhoto = async (photoId: string) => {
    try {
      await api.delete(`/api/profile/me/photos/${photoId}`);
      setPhotos((p) => {
        const remaining = p.filter((x) => x.id !== photoId);
        // promote first to primary if needed
        if (remaining.length > 0 && !remaining.some((x) => x.isPrimary)) {
          remaining[0].isPrimary = true;
        }
        return remaining;
      });
    } catch {
      setApiError("Failed to delete photo.");
    }
  };

  // Toggle deactivation
  const onToggleDeactivate = async () => {
    try {
      const { data } = await api.put<{ isDeactivated: boolean }>("/api/profile/me/deactivate");
      setDeactivated(data.isDeactivated);
    } catch {
      setApiError("Failed to update status.");
    }
  };

  // Mark match found
  const onMatchFound = async () => {
    try {
      await api.put("/api/profile/me/match-found");
      setMatchFound(true);
    } catch {
      setApiError("Failed to update status.");
    }
  };

  // Delete account
  const onDeleteAccount = async () => {
    if (deleteInput !== "DELETE") return;
    try {
      await api.delete("/api/profile/me");
      clearAuth();
      router.push("/");
    } catch {
      setApiError("Account deletion failed.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: "#FAF6F1" }}>
        <div className="w-8 h-8 rounded-full border-2 border-[#6B1320] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-safe">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl" style={{ color: "#1A0A05" }}>My Profile</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(107,19,32,0.5)" }}>
          {user?.phone} · Manage your details and photos
        </p>
      </div>

      {apiError && (
        <div className="mb-6 px-4 py-3 rounded-xl text-sm bg-red-50 text-red-600 border border-red-200">
          {apiError}
          <button className="ml-2 underline" onClick={() => setApiError("")}>dismiss</button>
        </div>
      )}

      {/* ── Photos ── */}
      <Section title="Photos">
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden"
              style={{ border: photo.isPrimary ? "2px solid #C9A84C" : "1.5px solid rgba(107,19,32,0.15)" }}>
              <Image src={photo.url} fill alt="Profile photo" className="object-cover" sizes="160px" />
              {photo.isPrimary && (
                <span className="absolute bottom-1 left-1 text-xs px-1.5 py-0.5 rounded font-semibold"
                  style={{ backgroundColor: "#C9A84C", color: "#4e0e17" }}>
                  Primary
                </span>
              )}
              <button
                onClick={() => onDeletePhoto(photo.id)}
                aria-label="Delete photo"
                className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: "rgba(26,10,5,0.75)", color: "white" }}>
                ×
              </button>
            </div>
          ))}
          {photos.length < 5 && (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              aria-label="Add photo"
              className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50"
              style={{ border: "1.5px dashed rgba(107,19,32,0.25)", color: "rgba(107,19,32,0.4)" }}>
              {uploading
                ? <div className="w-5 h-5 rounded-full border-2 border-[#6B1320] border-t-transparent animate-spin" />
                : <>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span className="text-xs">Add</span>
                  </>
              }
            </button>
          )}
        </div>
        <p className="text-xs mt-2" style={{ color: "rgba(107,19,32,0.4)" }}>
          Adding or removing photos re-submits your profile for verification.
        </p>
        <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={onAddPhoto} />
      </Section>

      {/* ── Profile details form ── */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Section title="Personal Details">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Full Name</Label>
              <input {...register("fullName")} className={inputCls} />
              <FieldError msg={errors.fullName?.message} />
            </div>
            <div>
              <Label>Date of Birth</Label>
              <input {...register("dateOfBirth")} type="date" className={inputCls}
                max={new Date(Date.now() - 18 * 365.25 * 86400000).toISOString().split("T")[0]} />
              <FieldError msg={errors.dateOfBirth?.message} />
            </div>
            <div>
              <Label>Marital Status</Label>
              <select {...register("maritalStatus")} className={selectCls}>
                <option value="NEVER_MARRIED">Never married</option>
                <option value="DIVORCED">Divorced</option>
                <option value="WIDOWED">Widowed</option>
              </select>
            </div>
            <div>
              <Label>Religion</Label>
              <select {...register("religion")} className={selectCls}>
                {RELIGIONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <Label>Community <span style={{ color: "rgba(107,19,32,0.35)" }}>(optional)</span></Label>
              <input {...register("community")} placeholder="e.g. Nair, Ezhava…" className={inputCls} />
            </div>
          </div>
        </Section>

        <Section title="Location & Education">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>District</Label>
              <select {...register("district")} className={selectCls}>
                {KERALA_DISTRICTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <Label>Highest Education</Label>
              <input {...register("education")} className={inputCls} />
              <FieldError msg={errors.education?.message} />
            </div>
            <div className="col-span-2">
              <Label>Occupation</Label>
              <input {...register("occupation")} className={inputCls} />
              <FieldError msg={errors.occupation?.message} />
            </div>
            <div className="col-span-2">
              <Label>Annual Income</Label>
              <select {...register("incomeRange")} className={selectCls}>
                {INCOME_RANGES.map((i) => <option key={i}>{i}</option>)}
              </select>
            </div>
          </div>
        </Section>

        <Section title="Physical & Horoscope">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Height (cm)</Label>
              <input {...register("heightCm")} type="number" min={130} max={220} className={inputCls} />
              <FieldError msg={errors.heightCm?.message} />
            </div>
            <div>
              <Label>Star (Nakshatra) <span style={{ color: "rgba(107,19,32,0.35)" }}>(optional)</span></Label>
              <select {...register("star")} className={selectCls}>
                <option value="">None</option>
                {STARS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <Label>Rasi <span style={{ color: "rgba(107,19,32,0.35)" }}>(optional)</span></Label>
              <select {...register("rasi")} className={selectCls}>
                <option value="">None</option>
                {RASIS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <Label>Contact Preference</Label>
              <div className="grid grid-cols-2 gap-3">
                {(["SELF","FAMILY"] as const).map((val) => (
                  <label key={val} className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all"
                    style={{
                      border: `1.5px solid ${watch("contactPreference") === val ? "#6B1320" : "rgba(107,19,32,0.15)"}`,
                      backgroundColor: watch("contactPreference") === val ? "rgba(107,19,32,0.05)" : "white",
                    }}>
                    <input type="radio" {...register("contactPreference")} value={val} className="sr-only" />
                    <span className="text-sm font-medium" style={{ color: "#1A0A05" }}>
                      {val === "SELF" ? "Self" : "Through family"}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section title="About Me">
          <textarea {...register("aboutMe")} rows={4} maxLength={500}
            placeholder="Share a little about yourself…"
            className={inputCls + " resize-none"} />
          <p className="text-xs mt-1 text-right" style={{ color: "rgba(107,19,32,0.35)" }}>
            {watch("aboutMe")?.length ?? 0}/500
          </p>
        </Section>

        {/* Save button */}
        <div className="flex items-center gap-3 mt-2 mb-8">
          <button type="submit" disabled={saving}
            className="px-8 py-3 rounded-full text-sm font-bold transition-all disabled:opacity-50"
            style={{ backgroundColor: "#6B1320", color: "#FAF6F1" }}>
            {saving ? "Saving…" : "Save changes"}
          </button>
          {saved && (
            <span className="text-sm font-medium" style={{ color: "#16a34a" }}>
              Saved
            </span>
          )}
        </div>
      </form>

      {/* ── Account settings ── */}
      <Section title="Account Settings">
        <div className="space-y-3">

          {/* Deactivate toggle */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background: "white", border: "1px solid rgba(107,19,32,0.1)" }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#1A0A05" }}>
                {deactivated ? "Profile deactivated" : "Deactivate profile"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(107,19,32,0.5)" }}>
                {deactivated ? "Your profile is hidden. Reactivate anytime." : "Temporarily hide your profile from searches."}
              </p>
            </div>
            <button onClick={onToggleDeactivate}
              className="px-4 py-2 rounded-full text-xs font-semibold transition-colors"
              style={{
                background: deactivated ? "rgba(107,19,32,0.08)" : "#6B1320",
                color: deactivated ? "#6B1320" : "#FAF6F1",
                border: deactivated ? "1px solid rgba(107,19,32,0.2)" : "none",
              }}>
              {deactivated ? "Reactivate" : "Deactivate"}
            </button>
          </div>

          {/* Match found */}
          {!matchFound && (
            <div className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ background: "white", border: "1px solid rgba(107,19,32,0.1)" }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#1A0A05" }}>Found your match?</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(107,19,32,0.5)" }}>
                  Remove your profile from listings and become a success story.
                </p>
              </div>
              <button onClick={onMatchFound}
                className="px-4 py-2 rounded-full text-xs font-semibold"
                style={{ background: "rgba(201,168,76,0.12)", color: "#8a6900", border: "1px solid rgba(201,168,76,0.3)" }}>
                Mark found
              </button>
            </div>
          )}
          {matchFound && (
            <div className="px-4 py-3 rounded-xl text-sm font-medium text-center"
              style={{ background: "rgba(201,168,76,0.1)", color: "#8a6900", border: "1px solid rgba(201,168,76,0.25)" }}>
              Congratulations on finding your match!
            </div>
          )}

          {/* Delete account */}
          <div className="px-4 py-3 rounded-xl" style={{ background: "white", border: "1px solid #fecaca" }}>
            <p className="text-sm font-semibold text-red-700">Delete account</p>
            <p className="text-xs mt-0.5 text-red-500 mb-3">
              Permanently deletes all your data. This cannot be undone.
            </p>
            {!showDelete ? (
              <button onClick={() => setShowDelete(true)}
                className="px-4 py-2 rounded-full text-xs font-semibold border border-red-300 text-red-600 hover:bg-red-50 transition-colors">
                Delete my account
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-red-600">Type <strong>DELETE</strong> to confirm:</p>
                <input
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3 py-2 rounded-lg border border-red-300 text-sm outline-none focus:ring-2 focus:ring-red-200"
                />
                <div className="flex gap-2">
                  <button onClick={onDeleteAccount} disabled={deleteInput !== "DELETE"}
                    className="px-4 py-2 rounded-full text-xs font-bold bg-red-600 text-white disabled:opacity-40 transition-opacity">
                    Confirm delete
                  </button>
                  <button onClick={() => { setShowDelete(false); setDeleteInput(""); }}
                    className="px-4 py-2 rounded-full text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Section>
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-xs font-semibold tracking-widest uppercase mb-4"
        style={{ color: "rgba(107,19,32,0.45)" }}>
        {title}
      </h2>
      <div className="rounded-2xl p-5"
        style={{ background: "white", border: "1px solid rgba(107,19,32,0.08)", boxShadow: "0 2px 12px rgba(107,19,32,0.05)" }}>
        {children}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@/lib/api";

interface Photo { id: string; url: string; isPrimary: boolean; }
interface Profile {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  religion: string;
  community?: string;
  district: string;
  education: string;
  occupation: string;
  incomeRange: string;
  heightCm: number;
  maritalStatus: string;
  aboutMe?: string;
  star?: string;
  rasi?: string;
  contactPreference: string;
  photos: Photo[];
  user: { lastActiveAt: string | null };
}

const MARITAL_STATUS_LABELS: Record<string, string> = {
  NEVER_MARRIED: "Never Married",
  DIVORCED: "Divorced",
  WIDOWED: "Widowed",
};

function age(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-semibold tracking-widest uppercase" style={{ color: "rgba(26,10,5,0.4)" }}>{label}</dt>
      <dd className="text-sm font-medium" style={{ color: "#1A0A05" }}>{value}</dd>
    </div>
  );
}

export default function ProfileDetailPage() {
  const { profileId } = useParams<{ profileId: string }>();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const [interestState, setInterestState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [interestError, setInterestError] = useState("");

  useEffect(() => {
    api.get<Profile>(`/api/profiles/${profileId}`)
      .then((r) => setProfile(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [profileId]);

  const sendInterest = async () => {
    if (!profile) return;
    setInterestState("sending");
    setInterestError("");
    try {
      await api.post("/api/interests", { receiverId: profile.user ? profileId : profile.id });
      setInterestState("sent");
    } catch (err: unknown) {
      setInterestState("error");
      setInterestError(err instanceof Error ? err.message : "Failed to send interest");
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="h-6 w-24 rounded-lg animate-pulse mb-6" style={{ background: "#EDE3D9" }} />
        <div className="rounded-2xl overflow-hidden animate-pulse" style={{ paddingBottom: "100%", background: "#EDE3D9" }} />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="font-semibold mb-2" style={{ color: "#1A0A05" }}>Profile not found</p>
        <button onClick={() => router.back()} className="text-sm" style={{ color: "#6B1320" }}>← Go back</button>
      </div>
    );
  }

  const yrs = age(profile.dateOfBirth);
  const primaryIdx = profile.photos.findIndex((p) => p.isPrimary);
  const orderedPhotos = primaryIdx > 0
    ? [profile.photos[primaryIdx], ...profile.photos.filter((_, i) => i !== primaryIdx)]
    : profile.photos;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm mb-5 transition-opacity hover:opacity-70" style={{ color: "rgba(26,10,5,0.5)" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to browse
      </button>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#EDE3D9" }}>
        {/* Main photo */}
        <div className="relative" style={{ paddingBottom: "90%" }}>
          {orderedPhotos[activePhoto] ? (
            <Image
              src={orderedPhotos[activePhoto].url}
              fill alt={profile.fullName}
              className="object-cover"
              sizes="(max-width:672px) 100vw, 672px"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: "#F5F0EA" }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(26,10,5,0.15)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          )}
          {/* Gradient */}
          <div className="absolute inset-x-0 bottom-0 h-28" style={{ background: "linear-gradient(to top, rgba(26,10,5,0.8), transparent)" }} />
          <div className="absolute bottom-4 left-4">
            <h1 className="text-2xl font-bold" style={{ color: "#FAF6F1" }}>{profile.fullName}</h1>
            <p className="text-sm mt-0.5" style={{ color: "rgba(250,246,241,0.7)" }}>
              {yrs} yrs · {profile.district}, Kerala
            </p>
          </div>
        </div>

        {/* Thumbnail strip */}
        {orderedPhotos.length > 1 && (
          <div className="flex gap-2 px-4 py-3" style={{ background: "#F5F0EA" }}>
            {orderedPhotos.map((ph, i) => (
              <button
                key={ph.id}
                onClick={() => setActivePhoto(i)}
                className="relative rounded-xl overflow-hidden flex-none transition-transform"
                style={{
                  width: 60, height: 60,
                  outline: i === activePhoto ? "2px solid #6B1320" : "none",
                  outlineOffset: 2,
                  opacity: i === activePhoto ? 1 : 0.6,
                }}
              >
                <Image src={ph.url} fill alt="" className="object-cover" sizes="60px" />
              </button>
            ))}
          </div>
        )}

        {/* Details */}
        <div className="p-5">
          {/* Basics */}
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 mb-5">
            <DetailRow label="Age" value={`${yrs} years`} />
            <DetailRow label="Height" value={`${profile.heightCm} cm`} />
            <DetailRow label="Religion" value={`${profile.religion}${profile.community ? ` · ${profile.community}` : ""}`} />
            <DetailRow label="Marital Status" value={MARITAL_STATUS_LABELS[profile.maritalStatus] ?? profile.maritalStatus} />
            <DetailRow label="District" value={`${profile.district}, Kerala`} />
            <DetailRow label="Education" value={profile.education} />
            <DetailRow label="Occupation" value={profile.occupation} />
            <DetailRow label="Income" value={profile.incomeRange} />
            {profile.star && <DetailRow label="Star (Nakshatra)" value={profile.star} />}
            {profile.rasi && <DetailRow label="Rasi" value={profile.rasi} />}
            <DetailRow label="Contact Via" value={profile.contactPreference === "FAMILY" ? "Family" : "Self"} />
          </dl>

          {/* About */}
          {profile.aboutMe && (
            <div className="mb-5 px-4 py-3 rounded-xl" style={{ background: "#F5F0EA" }}>
              <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "rgba(26,10,5,0.4)" }}>About</p>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(26,10,5,0.75)" }}>{profile.aboutMe}</p>
            </div>
          )}

          {/* Interest action */}
          {interestState === "sent" ? (
            <div className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold" style={{ background: "rgba(201,168,76,0.1)", color: "#C9A84C" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Interest Sent — awaiting response
            </div>
          ) : (
            <>
              {interestState === "error" && (
                <p className="text-xs text-center mb-3" style={{ color: "#dc2626" }}>{interestError}</p>
              )}
              <button
                onClick={sendInterest}
                disabled={interestState === "sending"}
                className="w-full py-3.5 rounded-2xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: "#6B1320", color: "#FAF6F1" }}
              >
                {interestState === "sending" ? "Sending…" : "Send Interest"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

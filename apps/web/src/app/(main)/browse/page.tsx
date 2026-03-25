"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api";

interface Photo { id: string; url: string; isPrimary: boolean; }
interface Profile {
  id: string;
  fullName: string;
  dateOfBirth: string;
  religion: string;
  community?: string;
  district: string;
  education: string;
  occupation: string;
  heightCm: number;
  photos: Photo[];
}
interface BrowseResponse { profiles: Profile[]; total: number; page: number; }

const KERALA_DISTRICTS = [
  "Thiruvananthapuram","Kollam","Pathanamthitta","Alappuzha","Kottayam",
  "Idukki","Ernakulam","Thrissur","Palakkad","Malappuram",
  "Kozhikode","Wayanad","Kannur","Kasaragod",
];
const RELIGIONS = ["Hindu","Muslim","Christian","Buddhist","Jain","Other"];

function age(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

function ProfileCard({ profile, onSendInterest, interestSent }: {
  profile: Profile;
  onSendInterest: (id: string) => void;
  interestSent: boolean;
}) {
  const photo = profile.photos.find((p) => p.isPrimary) ?? profile.photos[0];
  const yrs = age(profile.dateOfBirth);

  return (
    <div className="bg-white rounded-2xl overflow-hidden border flex flex-col" style={{ borderColor: "#EDE3D9" }}>
      <Link href={`/browse/${profile.id}`} className="block relative" style={{ paddingBottom: "125%" }}>
        {photo ? (
          <Image src={photo.url} fill alt={profile.fullName} className="object-cover" sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "#F5F0EA" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(26,10,5,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-20" style={{ background: "linear-gradient(to top, rgba(26,10,5,0.65), transparent)" }} />
        <div className="absolute bottom-2 left-3 text-sm font-semibold" style={{ color: "#FAF6F1" }}>
          {profile.fullName.split(" ")[0]}, {yrs}
        </div>
      </Link>

      <div className="p-3 flex-1 flex flex-col">
        <p className="text-xs truncate mb-1" style={{ color: "rgba(26,10,5,0.5)" }}>
          {profile.district} · {profile.religion} · {profile.heightCm} cm
        </p>
        <p className="text-xs truncate mb-3" style={{ color: "rgba(26,10,5,0.4)" }}>
          {profile.education}
        </p>

        {interestSent ? (
          <div className="mt-auto flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium" style={{ background: "rgba(201,168,76,0.1)", color: "#C9A84C" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Interest Sent
          </div>
        ) : (
          <button
            onClick={() => onSendInterest(profile.id)}
            className="mt-auto py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-90"
            style={{ background: "#6B1320", color: "#FAF6F1" }}
          >
            Send Interest
          </button>
        )}
      </div>
    </div>
  );
}

export default function BrowsePage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [district, setDistrict] = useState("");
  const [religion, setReligion] = useState("");

  const LIMIT = 20;

  const fetchProfiles = useCallback(async (p: number) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
      if (minAge) params.set("minAge", minAge);
      if (maxAge) params.set("maxAge", maxAge);
      if (district) params.set("district", district);
      if (religion) params.set("religion", religion);
      const res = await api.get<BrowseResponse>(`/api/profiles?${params}`);
      setProfiles(res.data.profiles);
      setTotal(res.data.total);
      setPage(p);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load profiles");
    } finally {
      setLoading(false);
    }
  }, [minAge, maxAge, district, religion]);

  useEffect(() => { fetchProfiles(1); }, [fetchProfiles]);

  const sendInterest = async (receiverId: string) => {
    try {
      await api.post("/api/interests", { receiverId });
      setSentIds((s) => new Set(s).add(receiverId));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to send interest");
    }
  };

  const totalPages = Math.ceil(total / LIMIT);
  const activeFilterCount = [minAge, maxAge, district, religion].filter(Boolean).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A0A05" }}>Browse Profiles</h1>
          {!loading && (
            <p className="text-sm mt-0.5" style={{ color: "rgba(26,10,5,0.45)" }}>
              {total.toLocaleString()} profiles found
            </p>
          )}
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors"
          style={{
            borderColor: activeFilterCount > 0 ? "#6B1320" : "#EDE3D9",
            color: activeFilterCount > 0 ? "#6B1320" : "rgba(26,10,5,0.6)",
            background: activeFilterCount > 0 ? "rgba(107,19,32,0.06)" : "white",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full text-xs font-bold flex items-center justify-center" style={{ background: "#6B1320", color: "#FAF6F1" }}>
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl border p-4 mb-5 grid grid-cols-2 md:grid-cols-4 gap-3" style={{ borderColor: "#EDE3D9" }}>
          {[
            { label: "Min Age", val: minAge, set: setMinAge, type: "number", placeholder: "e.g. 22" },
            { label: "Max Age", val: maxAge, set: setMaxAge, type: "number", placeholder: "e.g. 35" },
          ].map(({ label, val, set, type, placeholder }) => (
            <div key={label}>
              <label className="block text-xs font-semibold mb-1.5 tracking-widest uppercase" style={{ color: "rgba(26,10,5,0.45)" }}>{label}</label>
              <input
                type={type} min={18} max={70} placeholder={placeholder}
                value={val} onChange={(e) => set(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                style={{ borderColor: "#EDE3D9" }}
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold mb-1.5 tracking-widest uppercase" style={{ color: "rgba(26,10,5,0.45)" }}>District</label>
            <select value={district} onChange={(e) => setDistrict(e.target.value)} className="w-full px-3 py-2 rounded-xl border text-sm outline-none bg-white" style={{ borderColor: "#EDE3D9" }}>
              <option value="">All districts</option>
              {KERALA_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 tracking-widest uppercase" style={{ color: "rgba(26,10,5,0.45)" }}>Religion</label>
            <select value={religion} onChange={(e) => setReligion(e.target.value)} className="w-full px-3 py-2 rounded-xl border text-sm outline-none bg-white" style={{ borderColor: "#EDE3D9" }}>
              <option value="">All religions</option>
              {RELIGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="col-span-2 md:col-span-4 flex gap-2 pt-1">
            <button onClick={() => fetchProfiles(1)} className="px-5 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90" style={{ background: "#6B1320", color: "#FAF6F1" }}>
              Apply
            </button>
            <button onClick={() => { setMinAge(""); setMaxAge(""); setDistrict(""); setReligion(""); }} className="px-4 py-2 rounded-xl text-sm font-medium border" style={{ borderColor: "#EDE3D9", color: "rgba(26,10,5,0.55)" }}>
              Clear
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-5 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626" }}>{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border animate-pulse" style={{ borderColor: "#EDE3D9" }}>
              <div style={{ paddingBottom: "125%", background: "#EDE3D9" }} />
              <div className="p-3 space-y-2">
                <div className="h-3 rounded-lg" style={{ background: "#EDE3D9", width: "70%" }} />
                <div className="h-3 rounded-lg" style={{ background: "#EDE3D9", width: "50%" }} />
                <div className="h-8 rounded-xl mt-3" style={{ background: "#EDE3D9" }} />
              </div>
            </div>
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="bg-white rounded-2xl border p-16 text-center" style={{ borderColor: "#EDE3D9" }}>
          <p className="font-semibold" style={{ color: "#1A0A05" }}>No profiles found</p>
          <p className="text-sm mt-1" style={{ color: "rgba(26,10,5,0.4)" }}>Try adjusting your filters.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {profiles.map((p) => (
              <ProfileCard key={p.id} profile={p} onSendInterest={sendInterest} interestSent={sentIds.has(p.id)} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button onClick={() => fetchProfiles(page - 1)} disabled={page === 1} className="px-4 py-2 rounded-xl text-sm font-medium border disabled:opacity-40 hover:bg-white" style={{ borderColor: "#EDE3D9", color: "rgba(26,10,5,0.6)" }}>
                Previous
              </button>
              <span className="text-sm font-medium px-3" style={{ color: "rgba(26,10,5,0.5)" }}>{page} / {totalPages}</span>
              <button onClick={() => fetchProfiles(page + 1)} disabled={page === totalPages} className="px-4 py-2 rounded-xl text-sm font-medium border disabled:opacity-40 hover:bg-white" style={{ borderColor: "#EDE3D9", color: "rgba(26,10,5,0.6)" }}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

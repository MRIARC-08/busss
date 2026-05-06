"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { useState, useId } from "react";
import {
  User, Phone, Calendar, Shield, Lock, Eye, EyeOff,
  Save, LogOut, AlertCircle, CheckCircle2, Loader2,
  Bus, MapPin, ChevronRight, Edit3,
} from "lucide-react";
import { useRouter } from "next/navigation";

// ─── Small accessible helpers ─────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 font-medium">{label}</span>
      <span className="text-sm font-bold text-gray-800 text-right">{value}</span>
    </div>
  );
}

function SectionCard({ title, children, icon: Icon }: {
  title: string; children: React.ReactNode; icon: React.ElementType;
}) {
  return (
    <section
      aria-labelledby={`section-${title.replace(/\s/g, "-").toLowerCase()}`}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
    >
      <header className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
        <Icon className="w-5 h-5 text-brand-600" aria-hidden="true" />
        <h2
          id={`section-${title.replace(/\s/g, "-").toLowerCase()}`}
          className="font-bold text-gray-800"
        >
          {title}
        </h2>
      </header>
      <div className="px-6 py-4">{children}</div>
    </section>
  );
}

function InputField({ label, id, type = "text", value, onChange, placeholder, error, rightSlot, autoComplete, inputMode, maxLength }: {
  label: string; id: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; error?: string; rightSlot?: React.ReactNode;
  autoComplete?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
        {label}
      </label>
      <div className={`flex items-center border-2 rounded-lg px-3 py-2.5 transition-colors ${error ? "border-red-400" : "border-gray-200 focus-within:border-brand-500"}`}>
        <input
          id={id} type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} autoComplete={autoComplete}
          inputMode={inputMode} maxLength={maxLength}
          aria-describedby={error ? `${id}-err` : undefined} aria-invalid={!!error}
          className="flex-1 text-sm outline-none bg-transparent text-gray-900 placeholder-gray-400"
        />
        {rightSlot}
      </div>
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" aria-hidden="true" /> {error}
        </p>
      )}
    </div>
  );
}

// ─── Main Profile Page ────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, setUser, logout, isLoading } = useAuth();
  const router = useRouter();
  const uid = useId();

  // Edit profile state
  const [editMode, setEditMode] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // Password change state
  const [showPwForm, setShowPwForm] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  // Start edit
  function startEdit() {
    if (!user) return;
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setAge(String(user.age ?? ""));
    setEditMode(true);
    setProfileError("");
    setProfileSuccess("");
  }

  function cancelEdit() {
    setEditMode(false);
    setProfileError("");
  }

  async function saveProfile() {
    if (!firstName.trim()) { setProfileError("First name is required."); return; }
    if (!lastName.trim()) { setProfileError("Last name is required."); return; }
    if (age && (Number(age) < 1 || Number(age) > 120)) { setProfileError("Age must be between 1 and 120."); return; }

    setProfileSaving(true);
    setProfileError("");
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim(), age: age ? Number(age) : undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setEditMode(false);
        setProfileSuccess("Profile updated successfully!");
        setTimeout(() => setProfileSuccess(""), 3000);
      } else {
        setProfileError(data.error || "Update failed.");
      }
    } catch {
      setProfileError("Network error. Please try again.");
    } finally {
      setProfileSaving(false);
    }
  }

  async function changePassword() {
    if (!currentPw) { setPwError("Enter your current password."); return; }
    if (newPw.length < 6) { setPwError("New password must be at least 6 characters."); return; }
    if (newPw !== confirmPw) { setPwError("Passwords do not match."); return; }

    setPwSaving(true);
    setPwError("");
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (data.success) {
        setPwSuccess("Password changed successfully!");
        setCurrentPw(""); setNewPw(""); setConfirmPw("");
        setShowPwForm(false);
        setTimeout(() => setPwSuccess(""), 3000);
      } else {
        setPwError(data.error || "Failed to change password.");
      }
    } catch {
      setPwError("Network error. Please try again.");
    } finally {
      setPwSaving(false);
    }
  }

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  // ── Loading / Not authenticated ────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-live="polite">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        <span className="ml-3 text-gray-600">Loading your profile…</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center flex flex-col items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center">
          <User className="w-10 h-10 text-brand-600" />
        </div>
        <h1 className="text-2xl font-black text-gray-800">Sign In Required</h1>
        <p className="text-gray-500">You need to be signed in to view your profile.</p>
        <a href="/" className="bg-brand-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-brand-700 transition-colors focus:outline-none focus:ring-4 focus:ring-brand-300">
          ← Back to Home
        </a>
      </div>
    );
  }

  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "—";

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-3xl font-black text-gray-800">My Profile</h1>

      {/* Avatar card */}
      <div className="bg-gradient-to-r from-brand-700 to-brand-500 rounded-2xl p-6 text-white flex items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-black border-4 border-white/30 select-none flex-shrink-0" aria-hidden="true">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-blue-200 text-xs uppercase tracking-widest">Bus Commuter</p>
          <h2 className="text-2xl font-black truncate">{user.firstName} {user.lastName}</h2>
          <p className="text-blue-200 text-sm flex items-center gap-1.5 mt-1">
            <Phone className="w-3.5 h-3.5" aria-hidden="true" /> +91 {user.mobile}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm font-bold bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Sign out of your account"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" /> Sign Out
        </button>
      </div>

      {/* Global success banners */}
      {profileSuccess && (
        <div role="status" className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {profileSuccess}
        </div>
      )}
      {pwSuccess && (
        <div role="status" className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {pwSuccess}
        </div>
      )}

      {/* Personal Details */}
      <SectionCard title="Personal Details" icon={User}>
        {!editMode ? (
          <div>
            <InfoRow label="Full Name" value={`${user.firstName} ${user.lastName}`} />
            <InfoRow label="Mobile" value={`+91 ${user.mobile}`} />
            <InfoRow label="Age" value={user.age ? `${user.age} years` : "Not set"} />
            <InfoRow label="Member Since" value={joinDate} />
            <button
              onClick={startEdit}
              className="mt-4 flex items-center gap-2 text-sm font-bold text-brand-600 hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-300 rounded"
            >
              <Edit3 className="w-4 h-4" aria-hidden="true" /> Edit Details
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <InputField label="First Name" id={`${uid}-fn`} value={firstName} onChange={setFirstName} placeholder="Rahul" autoComplete="given-name" maxLength={60} />
              <InputField label="Last Name" id={`${uid}-ln`} value={lastName} onChange={setLastName} placeholder="Sharma" autoComplete="family-name" maxLength={60} />
            </div>
            <InputField label="Age" id={`${uid}-age`} value={age} onChange={setAge} placeholder="25" inputMode="numeric" maxLength={3} />
            {profileError && (
              <p role="alert" className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" aria-hidden="true" /> {profileError}
              </p>
            )}
            <div className="flex gap-3 pt-1">
              <button
                onClick={saveProfile} disabled={profileSaving}
                className="flex items-center gap-2 bg-brand-600 text-white font-bold px-4 py-2.5 rounded-lg hover:bg-brand-700 disabled:opacity-60 transition-colors focus:outline-none focus:ring-4 focus:ring-brand-300 text-sm"
              >
                {profileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {profileSaving ? "Saving…" : "Save Changes"}
              </button>
              <button onClick={cancelEdit} className="text-sm font-bold text-gray-500 hover:text-gray-700 px-3 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-lg">
                Cancel
              </button>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Security */}
      <SectionCard title="Security" icon={Shield}>
        {!showPwForm ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Password</p>
              <p className="text-xs text-gray-400 mt-0.5">Keep your account secure with a strong password.</p>
            </div>
            <button
              onClick={() => setShowPwForm(true)}
              className="flex items-center gap-2 text-sm font-bold text-brand-600 hover:text-brand-700 border border-brand-200 hover:border-brand-400 px-3 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              <Lock className="w-4 h-4" aria-hidden="true" /> Change Password
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current password */}
            <div>
              <label htmlFor={`${uid}-cpw`} className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Current Password</label>
              <div className="flex items-center border-2 border-gray-200 focus-within:border-brand-500 rounded-lg px-3 py-2.5">
                <Lock className="w-4 h-4 text-gray-400 mr-2.5" aria-hidden="true" />
                <input id={`${uid}-cpw`} type={showPw ? "text" : "password"} value={currentPw}
                  onChange={e => setCurrentPw(e.target.value)} autoComplete="current-password"
                  className="flex-1 text-sm outline-none bg-transparent text-gray-900 placeholder-gray-400" placeholder="Your current password" />
                <button type="button" onClick={() => setShowPw(s => !s)} aria-label={showPw ? "Hide" : "Show"} className="text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <InputField label="New Password (min 6 chars)" id={`${uid}-npw`} type="password" value={newPw} onChange={setNewPw} placeholder="New password" autoComplete="new-password" />
            <InputField label="Confirm New Password" id={`${uid}-cpw2`} type="password" value={confirmPw} onChange={setConfirmPw} placeholder="Repeat new password" autoComplete="new-password" />
            {pwError && (
              <p role="alert" className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" aria-hidden="true" /> {pwError}
              </p>
            )}
            <div className="flex gap-3">
              <button onClick={changePassword} disabled={pwSaving}
                className="flex items-center gap-2 bg-brand-600 text-white font-bold px-4 py-2.5 rounded-lg hover:bg-brand-700 disabled:opacity-60 transition-colors focus:outline-none focus:ring-4 focus:ring-brand-300 text-sm">
                {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                {pwSaving ? "Updating…" : "Update Password"}
              </button>
              <button onClick={() => { setShowPwForm(false); setPwError(""); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }}
                className="text-sm font-bold text-gray-500 hover:text-gray-700 px-3 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-lg">
                Cancel
              </button>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Quick actions */}
      <SectionCard title="Quick Actions" icon={Bus}>
        <div className="space-y-1">
          {[
            { href: "/", label: "Search for a Bus Route", icon: MapPin },
            { href: "/track", label: "Track a Live Bus", icon: Bus },
            { href: "/report", label: "Report an Issue", icon: AlertCircle },
          ].map(({ href, label, icon: Icon }) => (
            <a key={href} href={href}
              className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors group focus:outline-none focus:ring-2 focus:ring-brand-300">
              <span className="flex items-center gap-3 text-sm font-medium text-gray-700 group-hover:text-brand-700">
                <Icon className="w-4 h-4 text-brand-500" aria-hidden="true" /> {label}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-brand-500 transition-colors" aria-hidden="true" />
            </a>
          ))}
        </div>
      </SectionCard>

      {/* Danger zone */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-700 border border-red-200 hover:border-red-400 hover:bg-red-50 px-4 py-2.5 rounded-xl transition-colors focus:outline-none focus:ring-4 focus:ring-red-200"
          aria-label="Sign out of your account"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" /> Sign Out
        </button>
      </div>
    </main>
  );
}

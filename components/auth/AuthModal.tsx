"use client";

import { useState, useRef, useEffect, useId } from "react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import {
  X, Eye, EyeOff, Phone, Lock, User, Hash, Calendar,
  AlertCircle, CheckCircle2, Loader2,
} from "lucide-react";

// ── Field validation helpers (mirror server-side) ────────────────────────────
const validators = {
  mobile: (v: string) =>
    /^[6-9]\d{9}$/.test(v.trim()) ? "" : "Enter a valid 10-digit mobile number starting with 6–9.",
  password: (v: string) =>
    v.length >= 6 ? "" : "Password must be at least 6 characters.",
  firstName: (v: string) =>
    v.trim().length >= 1 ? "" : "First name is required.",
  lastName: (v: string) =>
    v.trim().length >= 1 ? "" : "Last name is required.",
  age: (v: string) => {
    const n = Number(v);
    return Number.isInteger(n) && n >= 1 && n <= 120 ? "" : "Age must be between 1 and 120.";
  },
  aadhaar: (v: string) =>
    /^\d{12}$/.test(v.trim()) ? "" : "Aadhaar must be exactly 12 digits.",
};

type FieldKey = keyof typeof validators;

function FieldWrapper({
  label, id, error, children, required,
}: {
  label: string; id: string; error?: string; children: React.ReactNode; required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

function TextInput({
  id, type = "text", value, onChange, onBlur, placeholder, icon: Icon, error,
  autoComplete, maxLength, inputMode, required,
  rightSlot,
}: {
  id: string; type?: string; value: string; onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string; icon?: React.ElementType; error?: string;
  autoComplete?: string; maxLength?: number; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  required?: boolean; rightSlot?: React.ReactNode;
}) {
  return (
    <div className={`flex items-center border-2 rounded-lg px-3 py-2.5 bg-white transition-colors ${error ? "border-red-400 focus-within:border-red-500" : "border-gray-200 focus-within:border-brand-500"}`}>
      {Icon && <Icon className={`w-4 h-4 mr-2.5 flex-shrink-0 ${error ? "text-red-400" : "text-gray-400"}`} aria-hidden="true" />}
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        inputMode={inputMode}
        required={required}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={!!error}
        className="flex-1 text-sm bg-transparent outline-none text-gray-900 placeholder-gray-400 min-w-0"
      />
      {rightSlot}
    </div>
  );
}

// ── Password field with show/hide ─────────────────────────────────────────────
function PasswordInput({ id, value, onChange, placeholder, error, autoComplete, required }: {
  id: string; value: string; onChange: (v: string) => void;
  placeholder?: string; error?: string; autoComplete?: string; required?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <TextInput
      id={id} type={show ? "text" : "password"} value={value} onChange={onChange}
      placeholder={placeholder} icon={Lock} error={error}
      autoComplete={autoComplete} required={required}
      rightSlot={
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="ml-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      }
    />
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function AuthModal({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const { setUser } = useAuth();
  const uid = useId();
  const firstInputRef = useRef<HTMLInputElement>(null);

  const [isLogin, setIsLogin] = useState(true);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [fields, setFields] = useState({
    mobile: "9999999999",
    password: "password123",
    firstName: "",
    lastName: "",
    age: "",
    aadhaar: "",
  });
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});

  // Focus first input when mode changes
  useEffect(() => { firstInputRef.current?.focus(); }, [isLogin]);

  // Trap focus inside modal & close on Escape
  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [onClose]);

  const set = (field: FieldKey) => (value: string) => {
    setFields(f => ({ ...f, [field]: value }));
    if (touched[field]) {
      setFieldErrors(e => ({ ...e, [field]: validators[field](value) }));
    }
  };

  const blur = (field: FieldKey) => () => {
    setTouched(t => ({ ...t, [field]: true }));
    setFieldErrors(e => ({ ...e, [field]: validators[field](fields[field]) }));
  };

  function validateAll() {
    const loginFields: FieldKey[] = ["mobile", "password"];
    const registerFields: FieldKey[] = ["mobile", "password", "firstName", "lastName", "age", "aadhaar"];
    const toCheck = isLogin ? loginFields : registerFields;

    const errors: Partial<Record<FieldKey, string>> = {};
    const allTouched: Partial<Record<FieldKey, boolean>> = {};
    toCheck.forEach(f => {
      errors[f] = validators[f](fields[f]);
      allTouched[f] = true;
    });
    setTouched(allTouched);
    setFieldErrors(errors);
    return Object.values(errors).every(e => !e);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    setSuccess("");

    if (!validateAll()) return;

    setLoading(true);
    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fields,
          age: fields.age ? Number(fields.age) : undefined,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setUser(data.user);
        setSuccess(isLogin ? "Welcome back!" : "Account created! Welcome aboard 🎉");
        setTimeout(onClose, 800);
      } else {
        setServerError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setServerError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(l => !l);
    setServerError("");
    setSuccess("");
    setTouched({});
    setFieldErrors({});
    setFields({ mobile: isLogin ? "" : "9999999999", password: isLogin ? "" : "password123", firstName: "", lastName: "", age: "", aadhaar: "" });
  };

  const fe = fieldErrors;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${uid}-title`}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white text-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="bg-brand-700 text-white rounded-t-2xl px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-200 uppercase tracking-widest">Where Is My Bus</p>
            <h2 id={`${uid}-title`} className="text-xl font-black mt-0.5">
              {isLogin ? "Sign In to Your Account" : "Create New Account"}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 rounded-full hover:bg-brand-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Server error / success */}
          {serverError && (
            <div role="alert" className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {serverError}
            </div>
          )}
          {success && (
            <div role="status" className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Register-only fields */}
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <FieldWrapper label="First Name" id={`${uid}-fn`} error={fe.firstName} required>
                    <TextInput id={`${uid}-fn`} value={fields.firstName} onChange={set("firstName")}
                      placeholder="Rahul" icon={User} error={fe.firstName}
                      autoComplete="given-name" maxLength={60} required
                      // Attach the ref via a different approach since TextInput uses the id
                    />
                  </FieldWrapper>
                  <FieldWrapper label="Last Name" id={`${uid}-ln`} error={fe.lastName} required>
                    <TextInput id={`${uid}-ln`} value={fields.lastName} onChange={set("lastName")}
                      placeholder="Sharma" icon={User} error={fe.lastName}
                      autoComplete="family-name" maxLength={60} required
                    />
                  </FieldWrapper>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FieldWrapper label="Age" id={`${uid}-age`} error={fe.age} required>
                    <TextInput id={`${uid}-age`} value={fields.age} onChange={set("age")}
                      onBlur={blur("age")} placeholder="25" icon={Calendar} error={fe.age}
                      inputMode="numeric" maxLength={3} required
                    />
                  </FieldWrapper>
                  <FieldWrapper label="Aadhaar No." id={`${uid}-aad`} error={fe.aadhaar} required>
                    <TextInput id={`${uid}-aad`} value={fields.aadhaar} onChange={set("aadhaar")}
                      placeholder="123456789012" icon={Hash} error={fe.aadhaar}
                      inputMode="numeric" maxLength={12} autoComplete="off" required
                    />
                  </FieldWrapper>
                </div>
              </>
            )}

            {/* Common fields */}
            <FieldWrapper label="Mobile Number" id={`${uid}-mob`} error={fe.mobile} required>
              <TextInput id={`${uid}-mob`} value={fields.mobile} onChange={set("mobile")}
                placeholder="9876543210" icon={Phone} error={fe.mobile}
                inputMode="tel" maxLength={10} autoComplete="tel" required
              />
            </FieldWrapper>

            <FieldWrapper label="Password" id={`${uid}-pw`} error={fe.password} required>
              <PasswordInput id={`${uid}-pw`} value={fields.password} onChange={set("password")}
                placeholder={isLogin ? "Your password" : "Min. 6 characters"} error={fe.password}
                autoComplete={isLogin ? "current-password" : "new-password"} required
              />
            </FieldWrapper>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-4 focus:ring-brand-300 mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          {/* Switch mode */}
          <p className="mt-5 text-center text-sm text-gray-600">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={switchMode}
              className="text-brand-600 font-bold hover:underline focus:outline-none focus:ring-2 focus:ring-brand-300 rounded"
            >
              {isLogin ? "Register here" : "Sign in"}
            </button>
          </p>

          {isLogin && (
            <p className="mt-2 text-center text-xs text-gray-400">
              <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg px-3 py-1.5 font-medium">
                Demo credentials are pre-filled — just click Sign In
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

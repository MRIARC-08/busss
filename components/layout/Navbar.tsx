"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bus, MapPin, AlertCircle, LayoutDashboard, UserCircle,
  ChevronDown, LogOut, User,
} from "lucide-react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useState, useRef, useEffect, useId } from "react";
import AuthModal from "@/components/auth/AuthModal";

// Live clock shown in top bar
function LiveClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const fmt = () =>
      setTime(
        new Date().toLocaleString("en-IN", {
          day: "2-digit", month: "short", year: "numeric",
          hour: "2-digit", minute: "2-digit", second: "2-digit",
          hour12: false,
        })
      );
    fmt();
    const id = setInterval(fmt, 1000);
    return () => clearInterval(id);
  }, []);
  return <time dateTime={new Date().toISOString()}>{time}</time>;
}

// User dropdown menu
function UserDropdown({ user, logout }: { user: { firstName: string; lastName: string }; logout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Also close on Escape
  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, []);

  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        className="flex items-center gap-2 hover:text-white text-blue-100 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-white rounded px-2 py-1 transition-colors"
      >
        <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-black border border-white/30" aria-hidden="true">
          {initials}
        </span>
        <span className="hidden sm:inline">{user.firstName}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="User menu"
          className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-xl shadow-2xl border border-gray-100 py-1.5 z-50"
        >
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-xs text-gray-400 font-medium">Signed in as</p>
            <p className="font-bold text-gray-800 text-sm truncate">{user.firstName} {user.lastName}</p>
          </div>
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50"
          >
            <User className="w-4 h-4 text-brand-600" aria-hidden="true" /> My Profile
          </Link>
          <button
            role="menuitem"
            onClick={() => { setOpen(false); logout(); }}
            className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors focus:outline-none focus:bg-red-50"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" /> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Navbar ─────────────────────────────────────────────────────────────
export default function Navbar() {
  const pathname = usePathname();
  const { t, language, setLanguage, fontSize, setFontSize } = useLanguage();
  const { user, logout } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const navLinks = [
    { href: "/", label: t("nav.home"), icon: Bus },
    { href: "/live", label: "Live Map", icon: MapPin },
    { href: "/report", label: t("nav.report"), icon: AlertCircle },
  ];

  return (
    <nav className="bg-brand-700 text-white shadow-lg sticky top-0 z-[200]" aria-label="Main navigation">
      {/* Top utility bar */}
      <div className="bg-brand-800 text-xs py-1.5 border-b border-brand-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center gap-4">
          <div className="flex items-center gap-4 text-blue-200">
            <span className="hidden sm:inline" aria-live="polite" aria-atomic="true">
              <LiveClock />
            </span>
            <div className="flex items-center gap-1.5" role="group" aria-label="Font size controls">
              {(["A-", "A", "A+"] as const).map((label, i) => {
                const sizes = ["small", "normal", "large"] as const;
                const size  = sizes[i];
                const active = fontSize === size;
                return (
                  <button
                    key={label}
                    onClick={() => setFontSize(size)}
                    aria-label={`Text size ${label}`}
                    aria-pressed={active}
                    className={`cursor-pointer px-1 rounded focus:outline-none focus:ring-1 focus:ring-white transition-colors ${
                      active ? "text-white underline underline-offset-2" : "text-blue-300 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setLanguage(language === "en" ? "hi" : "en")}
              aria-label={`Switch language to ${language === "en" ? "Hindi" : "English"}`}
              className="font-bold hover:text-white focus:outline-none focus:ring-1 focus:ring-white rounded px-1"
            >
              {language === "en" ? "हिंदी" : "English"}
            </button>
          </div>

          {/* Auth area */}
          <div className="flex items-center gap-4">
            {user ? (
              <UserDropdown user={user} logout={logout} />
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                aria-label="Sign in or create an account"
                className="font-bold hover:text-white uppercase px-2 py-1 bg-brand-600 hover:bg-brand-500 rounded focus:outline-none focus:ring-2 focus:ring-white transition-colors text-blue-100"
              >
                {t("nav.loginRegister")}
              </button>
            )}
            <a href="/#contact"
              className="hover:text-white text-blue-200 uppercase focus:outline-none focus:ring-1 focus:ring-white rounded px-1 hidden sm:inline"
            >
              {t("nav.contactUs")}
            </a>
          </div>
        </div>
      </div>

      {/* Main nav bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-white rounded" aria-label="Where Is My Bus — Home">
            <div className="bg-white p-1.5 rounded-full flex-shrink-0">
              <Bus className="h-7 w-7 text-brand-700" aria-hidden="true" />
            </div>
            <div className="hidden sm:block leading-none">
              <p className="font-black text-base">WHERE IS MY BUS</p>
              <p className="text-[10px] text-blue-200 font-medium tracking-widest">SMART NAVIGATOR</p>
            </div>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-0.5" role="list">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  role="listitem"
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white
                    ${isActive
                      ? "bg-white text-brand-700"
                      : "text-blue-100 hover:bg-brand-600 hover:text-white"
                    }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden lg:inline">{label}</span>
                </Link>
              );
            })}

            {/* Profile icon for logged-in users */}
            {user && (
              <Link
                href="/profile"
                aria-label="My Profile"
                aria-current={pathname === "/profile" ? "page" : undefined}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white
                  ${pathname === "/profile" ? "bg-white text-brand-700" : "text-blue-100 hover:bg-brand-600 hover:text-white"}`}
              >
                <UserCircle className="h-4 w-4" aria-hidden="true" />
                <span className="hidden lg:inline">Profile</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {isAuthOpen && <AuthModal onClose={() => setIsAuthOpen(false)} />}
    </nav>
  );
}

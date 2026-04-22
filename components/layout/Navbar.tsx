"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bus, MapPin, AlertCircle, LayoutDashboard, UserCircle } from "lucide-react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useState } from "react";
import AuthModal from "@/components/auth/AuthModal";

export default function Navbar() {
  const pathname = usePathname();
  const { t, language, setLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const navLinks = [
    { href: "/", label: t("nav.home"), icon: Bus },
    { href: "/live", label: "Live GTFS Map", icon: MapPin },
    { href: "/search", label: t("nav.findRoute"), icon: MapPin },
    { href: "/report", label: t("nav.report"), icon: AlertCircle },
  ];
  
  if (user?.mobile === "admin" || true) {
    // For simplicity keeping admin link visible
    navLinks.push({ href: "/admin", label: t("nav.admin"), icon: LayoutDashboard });
  }

  const handleLanguageToggle = () => {
    setLanguage(language === "en" ? "hi" : "en");
  };

  return (
    <nav className="bg-brand-700 text-white shadow-lg sticky top-0 z-50">
      {/* Top Header Row (IRCTC Style) */}
      <div className="bg-brand-800 text-xs py-1 border-b border-brand-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex gap-4">
            <span className="hidden sm:inline">22-Apr-2026 [05:49:26]</span>
            <div className="flex gap-2">
              <span className="cursor-pointer hover:text-blue-200">A-</span>
              <span className="cursor-pointer hover:text-blue-200 font-bold">A</span>
              <span className="cursor-pointer hover:text-blue-200">A+</span>
            </div>
            <button onClick={handleLanguageToggle} className="font-bold hover:text-blue-200">
              {language === "en" ? "हिंदी" : "English"}
            </button>
          </div>
          <div className="flex gap-4">
            {user ? (
              <div className="flex gap-4 items-center">
                <span>Welcome, {user.firstName}</span>
                <button onClick={logout} className="font-bold hover:text-blue-200">LOGOUT</button>
              </div>
            ) : (
              <button onClick={() => setIsAuthOpen(true)} className="font-bold hover:text-white uppercase px-2 py-1 bg-brand-600 hover:bg-brand-500 rounded">
                {t("nav.loginRegister")}
              </button>
            )}
            <Link href="/contact" className="hover:text-blue-200 uppercase">{t("nav.contactUs")}</Link>
            <Link href="/alerts" className="hover:text-blue-200 uppercase">{t("nav.alerts")}</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-white p-1.5 rounded-full">
              <Bus className="h-8 w-8 text-brand-700" />
            </div>
            <div className="hidden sm:block">
              <p className="font-bold text-lg leading-none">SMART BUS</p>
              <p className="text-xs text-blue-200 leading-none">Navigator</p>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${isActive
                      ? "bg-white text-brand-700"
                      : "text-blue-100 hover:bg-brand-600"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{label}</span>
                </Link>
              );
            })}
          </div>

        </div>
      </div>
      
      {isAuthOpen && <AuthModal onClose={() => setIsAuthOpen(false)} />}
    </nav>
  );
}

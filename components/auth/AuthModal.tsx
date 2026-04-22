"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const { setUser } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    mobile: "9999999999",
    password: "password123",
    firstName: "Demo",
    lastName: "User",
    age: "30",
    aadhaar: "123456789012"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      
      if (data.success) {
        setUser(data.user);
        onClose();
      } else {
        setError(data.error || "Authentication failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white text-gray-800 rounded-lg shadow-2xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-xl font-bold">&times;</button>
        
        <h2 className="text-2xl font-bold mb-6 text-brand-700 text-center">
          {isLogin ? t("auth.login") : t("auth.register")}
        </h2>
        
        {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm font-medium">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">{t("auth.firstName")}</label>
                <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">{t("auth.lastName")}</label>
                <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">{t("auth.age")}</label>
                <input required type="number" name="age" value={formData.age} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">{t("auth.aadhaar")}</label>
                <input required type="text" name="aadhaar" value={formData.aadhaar} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{t("auth.mobile")}</label>
            <input required type="text" name="mobile" value={formData.mobile} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{t("auth.password")}</label>
            <input required type="password" name="password" value={formData.password} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
          </div>
          
          <button type="submit" disabled={loading} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2 rounded focus:ring-4 focus:ring-brand-300 transition">
            {loading ? "Please wait..." : (isLogin ? t("auth.login") : t("auth.register"))}
          </button>
        </form>
        
        <div className="mt-4 text-center text-sm">
          <span className="text-gray-600">{isLogin ? t("auth.dontHaveAccount") : t("auth.alreadyHaveAccount")} </span>
          <button onClick={() => setIsLogin(!isLogin)} className="text-brand-600 font-bold hover:underline">
            {!isLogin ? t("auth.login") : t("auth.register")}
          </button>
        </div>
      </div>
    </div>
  );
}

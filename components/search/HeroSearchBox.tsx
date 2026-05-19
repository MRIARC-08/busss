"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Search, ArrowRight, Calendar, Briefcase, LayoutGrid, AlertCircle } from "lucide-react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import AuthModal from "@/components/auth/AuthModal";

const POPULAR_STOPS = [
  "Sonipat Bus Stand", "Noida Sector 37", "Bawana Chowk",
  "Chandigarh ISBT Sector 17", "Anand Vihar ISBT", "Kundli",
  "Narela Bus Stand", "Kashmere Gate ISBT"
];

export default function HeroSearchBox() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useAuth();

  const [from, setFrom] = useState("");
  const [to, setTo]     = useState("");
  
  const [currentDate, setCurrentDate] = useState("");
  
  // Hydration-safe date formatter
  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }));
  }, []);
  
  const [category, setCategory] = useState("GENERAL");
  
  const [fromSuggestions, setFromSuggestions] = useState<string[]>([]);
  const [toSuggestions, setToSuggestions]     = useState<string[]>([]);
  const [error, setError] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  
  const [options, setOptions] = useState({
    disability: false,
    flexible: false,
    pass: false,
  });

  const today = new Date().toISOString().split('T')[0];

  async function fetchStops(query: string, setter: (val: string[]) => void) {
    if (!query) {
      setter(POPULAR_STOPS);
      return;
    }
    
    let results: string[] = [];
    try {
      // Just an example network call, we mainly rely on static fallback for prototype
      const res = await fetch(`/api/stops/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.stops && data.stops.length > 0) {
        results = data.stops;
      }
    } catch (e) {
      // ignore
    }
    
    // Fallback/Combine with local
    const local = POPULAR_STOPS.filter(s => s.toLowerCase().includes(query.toLowerCase()));
    const finalSet = new Set([...results, ...local]);
    setter(Array.from(finalSet));
  }

  function handleSearch() {
    setError("");

    if (!user) {
      setShowAuth(true);
      return;
    }

    const fromClean = from.trim();
    const toClean = to.trim();

    if (!fromClean || !toClean) {
      setError("Please enter both From and To locations.");
      return;
    }

    if (fromClean.toLowerCase() === toClean.toLowerCase()) {
      setError("Origin and destination cannot be the same stop. Please choose two different locations.");
      return;
    }

    router.push(
      `/search?from=${encodeURIComponent(fromClean)}&to=${encodeURIComponent(toClean)}`
    );
  }

  return (
    <div id="tour-search" className="bg-white rounded-lg shadow-2xl flex flex-col w-full max-w-lg overflow-hidden border border-gray-200">
      
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      <div className="p-6 text-left flex flex-col gap-5">
        
        <h2 className="text-2xl font-black text-[#213d77] text-center mb-2 tracking-wide uppercase">
          {t("hero.bookTicket")}
        </h2>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded border border-red-200 flex items-center gap-2 text-sm font-medium">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-center">
          
          {/* FROM */}
          <div className="relative">
            <div className="relative border border-gray-300 rounded p-2 focus-within:border-blue-500 flex items-center bg-gray-50">
              <MapPin className="h-5 w-5 text-brand-700 mr-2" />
              <input
                type="text"
                value={from}
                onFocus={() => {
                  fetchStops(from, setFromSuggestions);
                }}
                onChange={(e) => {
                  setFrom(e.target.value);
                  fetchStops(e.target.value, setFromSuggestions);
                }}
                onBlur={() => setTimeout(() => setFromSuggestions([]), 200)}
                placeholder={t("hero.from")}
                className="w-full focus:outline-none text-brand-900 font-bold placeholder-gray-400 bg-transparent"
              />
            </div>
            {fromSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded shadow-lg mt-1 overflow-hidden max-h-48 overflow-y-auto">
                {fromSuggestions.map((s) => (
                  <li key={s} onMouseDown={() => { setFrom(s); setFromSuggestions([]); }} className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0">{s}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Swap Arrow */}
          <button onClick={() => { const t = from; setFrom(to); setTo(t); }} className="mx-auto block text-[#213d77] hover:text-orange-500 transition-colors">
            <ArrowRight className="h-5 w-5" />
          </button>

          {/* TO */}
          <div className="relative">
            <div className="relative border border-gray-300 rounded p-2 focus-within:border-blue-500 flex items-center bg-gray-50">
              <MapPin className="h-5 w-5 text-brand-700 mr-2" />
              <input
                type="text"
                value={to}
                onFocus={() => {
                  fetchStops(to, setToSuggestions);
                }}
                onChange={(e) => {
                  setTo(e.target.value);
                  fetchStops(e.target.value, setToSuggestions);
                }}
                onBlur={() => setTimeout(() => setToSuggestions([]), 200)}
                placeholder={t("hero.to")}
                className="w-full focus:outline-none text-brand-900 font-bold placeholder-gray-400 bg-transparent"
              />
            </div>
            {toSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded shadow-lg mt-1 overflow-hidden max-h-48 overflow-y-auto">
                {toSuggestions.map((s) => (
                  <li key={s} onMouseDown={() => { setTo(s); setToSuggestions([]); }} className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0">{s}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Date Display */}
        <div className="mt-2">
          <div className="relative border border-gray-300 rounded p-3 flex flex-col bg-gray-50">
            <label className="text-[10px] text-brand-700 font-bold uppercase mb-1">{t("hero.date")}</label>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-brand-700 mr-2" />
              <span className="w-full text-brand-900 font-bold uppercase bg-transparent">
                {currentDate || "..."}
              </span>
            </div>
          </div>
        </div>

        {/* Quota */}
       
     
        {/* Search Engine */}
        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={handleSearch}
            className="bg-[#fb792b] hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-md uppercase tracking-wide w-full"
          >
            {t("hero.search")}
          </button>
        </div>

      </div>
    </div>
  );
}

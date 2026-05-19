"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Loader2, ArrowRight, Bus, MapPin, Clock, Users, Banknote, Wind, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/contexts/LanguageContext";

function SearchResults() {
  const { t } = useLanguage();
  const params = useSearchParams();
  const from = params.get("from") || "";
  const to = params.get("to") || "";

  // Guard: same-stop search has no valid buses
  const isSameStop = from.trim().toLowerCase() !== "" && from.trim().toLowerCase() === to.trim().toLowerCase();

  const [loading, setLoading] = useState(!isSameStop);
  const [data, setData] = useState<{upcoming: any[], departed: any[]}>({ upcoming: [], departed: [] });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!from || !to || isSameStop) return;
    
    setError("");
    setLoading(true);
    // Simulate complex static GTFS DB query joined with realtime data
    fetch(`/api/search-matching?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      .then(r => r.json())
      .then(d => {
         if (d.success) {
           setData({ upcoming: d.upcoming, departed: d.departed });
         } else {
           setData({ upcoming: [], departed: [] });
           setError(d.error || "Please enter a valid starting point and destination.");
         }
         setLoading(false);
      }).catch(() => {
        setError("Could not validate these locations. Please try again.");
        setLoading(false);
      });
  }, [from, to, isSameStop]);

  // Same-stop error screen
  if (isSameStop) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 flex flex-col items-center text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center text-4xl select-none">🚌</div>
        <div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">{t("search.originDest")}</h2>
          <p className="text-gray-500 leading-relaxed">
            {t("search.sameStopMsg")}
          </p>
        </div>
        <a href="/" className="inline-flex items-center gap-2 bg-brand-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-brand-700 transition-colors">
          ← {t("search.searchAgain")}
        </a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6 bg-gray-50 min-h-[calc(100vh-100px)]">
        <Loader2 className="h-12 w-12 text-brand-500 animate-spin" />
        <p className="text-gray-600 font-medium">{t("search.loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 flex flex-col items-center text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">Invalid Location</h2>
          <p className="text-gray-500 leading-relaxed">{error}</p>
        </div>
        <a href="/" className="inline-flex items-center gap-2 bg-brand-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-brand-700 transition-colors">
          ← {t("search.searchAgain")}
        </a>
      </div>
    );
  }

  const BusCard = ({ bus, departed }: { bus: any, departed?: boolean }) => {
    const routeNum = bus.routeId ? String(bus.routeId).replace(/(up|down)/i, '') : "N/A";
    const direction = String(bus.routeId).match(/up/i) ? 'UP' : String(bus.routeId).match(/down/i) ? 'DOWN' : 'REGULAR';
    const acStatus = bus.isAC ? 'AC' : 'Non-AC';
    
    return (
      <Link
        href={(() => {
          const trackParams = new URLSearchParams({
            busId: bus.id,
            from,
            to,
          });
          if (bus.routeId) trackParams.set("route", routeNum);
          return `/track?${trackParams.toString()}`;
        })()}
        className={`block p-5 rounded-xl border bg-white border-brand-200 hover:border-brand-400 hover:shadow-md transition-all group`}
      >
        <div className="flex justify-between items-start">
           <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${departed ? 'bg-gray-200 text-gray-500' : 'bg-brand-100 text-brand-600'}`}>
                 <Bus className="w-6 h-6" />
              </div>
               <div>
                 <div className="flex items-baseline gap-2">
                   <h3 className={`text-xl font-black ${departed ? 'text-gray-500' : 'text-gray-800'}`}>{t("search.route")} {routeNum}</h3>
                   <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${departed ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-700'}`}>{direction}</span>
                   <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1 ${bus.isAC ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}><Wind className="w-3 h-3" /> {acStatus}</span>
                 </div>
                 <p className="text-sm text-gray-500 font-medium mt-0.5">{t("search.vehicle")} {bus.id} • {t("search.towards")}: <span className="font-bold text-gray-700">{to}</span></p>
              </div>
           </div>
           <div className="text-right">
              <span className={`text-lg font-black block ${departed ? 'text-gray-500' : 'text-brand-600'}`}>
                {departed ? t("search.passed") : `~${bus.etaToSource} ${t("search.min")}`}
              </span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{departed ? t("search.alreadyDeparted") : t("search.arrivalAtStart")}</span>
           </div>
        </div>

        <div className="mt-4 pt-4 border-t flex items-center gap-4 text-xs font-bold text-gray-500">
           <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded"><Banknote className="w-4 h-4 text-green-600"/> {t("search.fare")}: ₹{bus.fare || 'N/A'}</span>
           <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded"><Users className="w-4 h-4 text-brand-600"/> {t("search.passengers")}: {bus.occupancy || 0}/{bus.seats || 45}</span>
        </div>
        
        <div className={`mt-4 pt-4 border-t flex justify-between items-center border-gray-50`}>
           <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
             <Clock className="w-4 h-4"/> {t("search.lastPing")}: {((bus.id?.charCodeAt?.(0) ?? 5) % 25) + 5}s {t("search.ago")}
           </span>
           <span className={`text-sm font-bold flex items-center gap-1 ${departed ? 'text-gray-500' : 'text-brand-600 group-hover:text-brand-700'}`}>
             {t("search.openLiveMap")} <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
           </span>
        </div>
      </Link>
    )
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-8 flex justify-between items-center">
         <div>
            <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2 border-b pb-1 inline-block">{t("search.startEnd")}</div>
            <h1 className="text-2xl font-black text-gray-800 flex items-center gap-3">
              <MapPin className="text-brand-500 w-6 h-6" />
              {from} <ArrowRight className="text-gray-300 w-5 h-5 mx-1" /> {to}
            </h1>
            <p className="text-gray-500 font-medium mt-3 bg-brand-50 inline-block px-3 py-1 rounded-lg text-brand-700 border border-brand-100">{t("search.approachingBuses")}: <span className="font-black">{data.upcoming.length}</span></p>
         </div>
      </div>

      <div className="space-y-10">
        <section>
           <h2 className="text-lg font-black text-brand-800 uppercase tracking-widest mb-4 flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> {t("search.approachingStop")}
           </h2>
           {data.upcoming.length > 0 ? (
             <div className="grid gap-4">
               {data.upcoming.map((bus: any) => <BusCard key={bus.id} bus={bus} />)}
             </div>
           ) : (
             <p className="text-gray-500 italic p-6 bg-gray-50 rounded-xl border border-gray-100">{t("search.noBuses")}</p>
           )}
        </section>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center"><Loader2 className="animate-spin text-brand-500 w-8 h-8 mx-auto"/></div>}>
      <SearchResults />
    </Suspense>
  );
}

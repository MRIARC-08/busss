"use client";

import Link from "next/link";
import { ArrowRight, History, MapPin } from "lucide-react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useState, useEffect } from "react";

const crowdBadge = {
  LOW:    "bg-green-100 text-green-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH:   "bg-red-100 text-red-600",
};

export default function PopularRoutes() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      try {
        const searchKey = `user-logs-searches-${user.mobile}`;
        const data = JSON.parse(localStorage.getItem(searchKey) || "[]");
        setRecent(data.slice(0, 3));
      } catch (e) {
        console.error("Failed to load local recent searches", e);
      }
    }
  }, [user]);

  const routes = [
    { from: "Sonipat Bus Stand", to: "Kashmere Gate ISBT", crowd: "MEDIUM", time: `75 ${t("routes.time")}` },
    { from: "Chandigarh ISBT",   to: "Kashmere Gate ISBT", crowd: "LOW",    time: `4.5 ${t("routes.time")}` },
    { from: "Narela Bus Stand",  to: "Kashmere Gate ISBT", crowd: "HIGH",   time: `40 ${t("routes.time")}` },
  ];

  return (
    <div className="bg-gray-50 border-t border-gray-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Popular Routes */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-6">{t("routes.title")}</h2>
          <div className="space-y-3">
            {routes.map((r, i) => (
              <Link
                key={i}
                href={`/search?from=${encodeURIComponent(r.from)}&to=${encodeURIComponent(r.to)}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 bg-white rounded-xl
                           border border-gray-200 px-5 py-4 hover:border-brand-300
                           hover:shadow-sm transition-all group"
              >
                <div className="flex items-center flex-wrap gap-2 sm:gap-3 text-sm">
                  <span className="font-medium text-gray-800">{r.from}</span>
                  <ArrowRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
                  <span className="font-medium text-gray-800">{r.to}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium
                    ${crowdBadge[r.crowd as keyof typeof crowdBadge]}`}>
                    {r.crowd}
                  </span>
                  <span className="text-xs text-gray-400">{r.time}</span>
                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-brand-500
                                         group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Searches */}
        <div className="mt-12 pt-8 border-t border-gray-200/60">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <History className="w-5 h-5 text-brand-600" />
            Recent Searches
          </h3>

          {recent.length > 0 ? (
            <div className="space-y-3">
              {recent.map((r, i) => (
                <Link
                  key={i}
                  href={`/search?from=${encodeURIComponent(r.from)}&to=${encodeURIComponent(r.to)}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 bg-white rounded-xl
                             border border-gray-200 px-5 py-4 hover:border-brand-300 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center flex-wrap gap-2 sm:gap-3 text-sm">
                    <div className="p-1.5 bg-brand-50 rounded text-brand-600">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-gray-700">{r.from}</span>
                    <ArrowRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
                    <span className="font-semibold text-gray-700">{r.to}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">
                      {new Date(r.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                    <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-gray-200 rounded-2xl p-8 text-center text-gray-400 bg-white/50">
              <History className="w-8 h-8 text-gray-300 mx-auto mb-2 animate-pulse" />
              <p className="text-sm font-black text-gray-600">No recent searches logged</p>
              <p className="text-xs mt-1 max-w-xs mx-auto">
                {user 
                  ? "Log your first search from the ticket box above to see quick-reroute access here!" 
                  : "Sign in and run route searches to enable quick route histories here."}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

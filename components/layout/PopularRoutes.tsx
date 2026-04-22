"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/contexts/LanguageContext";

const crowdBadge = {
  LOW:    "bg-green-100 text-green-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH:   "bg-red-100 text-red-600",
};

export default function PopularRoutes() {
  const { t } = useLanguage();

  const routes = [
    { from: "Sonipat Bus Stand", to: "Kashmere Gate ISBT", crowd: "MEDIUM", time: `75 ${t("routes.time")}` },
    { from: "Chandigarh ISBT",   to: "Kashmere Gate ISBT", crowd: "LOW",    time: `4.5 ${t("routes.time")}` },
    { from: "Narela Bus Stand",  to: "Kashmere Gate ISBT", crowd: "HIGH",   time: `40 ${t("routes.time")}` },
  ];

  return (
    <div className="bg-gray-50 border-t border-gray-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-xl font-bold text-gray-800 mb-6">{t("routes.title")}</h2>
        <div className="space-y-3">
          {routes.map((r, i) => (
            <Link
              key={i}
              href={`/search?from=${encodeURIComponent(r.from)}&to=${encodeURIComponent(r.to)}`}
              className="flex items-center justify-between bg-white rounded-xl
                         border border-gray-200 px-5 py-4 hover:border-brand-300
                         hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium text-gray-800">{r.from}</span>
                <ArrowRight className="h-4 w-4 text-gray-300" />
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
    </div>
  );
}

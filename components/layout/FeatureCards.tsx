"use client";

import { MapPin, Clock, BarChart3, Shield } from "lucide-react";
import { useLanguage } from "@/lib/contexts/LanguageContext";

export default function FeatureCards() {
  const { t } = useLanguage();

  const features = [
    { icon: MapPin,    title: t("features.smartRoutes"),      desc: t("features.smartRoutesDesc"),  color: "text-blue-500 bg-blue-50" },
    { icon: Clock,     title: t("features.liveSim"),   desc: t("features.liveSimDesc"),              color: "text-green-500 bg-green-50" },
    { icon: BarChart3, title: t("features.crowdIntell"),desc: t("features.crowdIntellDesc"),       color: "text-orange-500 bg-orange-50" },
    { icon: Shield,    title: t("features.accountability"),    desc: t("features.accountabilityDesc"),                  color: "text-purple-500 bg-purple-50" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-14">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
        {t("features.title")}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {features.map(({ icon: Icon, title, desc, color }) => (
          <div key={title}
            className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className={`inline-flex p-3 rounded-xl ${color} mb-4`}>
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-gray-800 mb-2">{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

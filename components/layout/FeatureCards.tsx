"use client";

import { ShieldCheck, Wrench, UserCheck, BadgeCheck, Map } from "lucide-react";
// import { useLanguage } from "@/lib/contexts/LanguageContext";

export default function FeatureCards() {
  // const { t } = useLanguage();

  const features = [
    { letter: "S", title: "Security", desc: "Ensuring passenger safety at all times.", icon: ShieldCheck, color: "text-red-500", bg: "bg-red-50" },
    { letter: "M", title: "Maintenance", desc: "Keeping fleets in optimal condition.", icon: Wrench, color: "text-orange-500", bg: "bg-orange-50" },
    { letter: "A", title: "Accountability", desc: "Transparent operations and reporting.", icon: UserCheck, color: "text-amber-500", bg: "bg-amber-50" },
    { letter: "R", title: "Reliability", desc: "Consistent and dependable service.", icon: BadgeCheck, color: "text-green-500", bg: "bg-green-50" },
    { letter: "T", title: "Tracking Real-Time", desc: "Live ETA and location updates.", icon: Map, color: "text-blue-500", bg: "bg-blue-50" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-blue-100 border border-blue-200 rounded-full px-4 py-1.5 text-blue-700 text-xs font-bold uppercase tracking-widest mb-4">
          Our Core Values
        </div>
        <h2 className="text-3xl lg:text-4xl font-black text-gray-800 mb-3">The SMART Principle</h2>
        <p className="text-gray-500 text-sm max-w-xl mx-auto">Driving the future of public transportation through our five core pillars.</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {features.map(({ letter, title, desc, icon: Icon, color, bg }) => (
          <div key={letter} className="bg-white rounded-2xl p-5 text-center shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1">
            <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 ${bg}`}>
               <Icon className={`w-7 h-7 ${color}`} />
            </div>
            <div className="text-2xl font-black text-gray-800 mb-1">{letter}</div>
            <h3 className="font-bold text-gray-700 text-sm mb-2 uppercase tracking-wide">{title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

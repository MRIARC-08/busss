"use client";

import { useRouter } from "next/navigation";
import {
  Clock, Users, ArrowRight,
  CheckCircle, ChevronDown, ChevronUp,
  Navigation, Banknote
} from "lucide-react";
import { useState } from "react";

const CROWD_CONFIG = {
  LOW:       { color: "text-green-600",  bg: "bg-green-50",  border: "border-green-200", label: "Low",       bar: "w-1/4  bg-green-500" },
  MEDIUM:    { color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200",label: "Medium",    bar: "w-2/4  bg-yellow-500" },
  HIGH:      { color: "text-red-500",    bg: "bg-red-50",    border: "border-red-200",   label: "High",      bar: "w-3/4  bg-red-500" },
  VERY_HIGH: { color: "text-red-700",    bg: "bg-red-100",   border: "border-red-300",   label: "Very High", bar: "w-full bg-red-700" },
};

export default function RouteResultCard({
  plan, isActive, label
}: {
  plan: any; isActive: boolean; label: string;
}) {
  const router = useRouter();
  const [showReasons, setShowReasons] = useState(isActive);
  const crowd = CROWD_CONFIG[plan.crowdLevel as keyof typeof CROWD_CONFIG]
             ?? CROWD_CONFIG.MEDIUM;

  return (
    <div className={`bg-white rounded-2xl border-2 shadow-sm transition-all
      ${isActive ? "border-brand-500 shadow-md" : "border-gray-100"}`}>

      {/* Card Header */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="inline-block text-xs font-semibold px-2.5 py-1
                             bg-brand-50 text-brand-700 rounded-full mb-2">
              {label}
            </span>
            <h3 className="font-bold text-gray-800 text-lg">
              {plan.routeNumber}
            </h3>
            <p className="text-sm text-gray-500">{plan.authority}</p>
          </div>
          {plan.score && (
            <div className="text-right">
              <div className="text-2xl font-bold text-brand-600">{plan.score}</div>
              <div className="text-xs text-gray-400">/ 100 score</div>
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">

          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <Clock className="h-4 w-4 text-brand-500 mx-auto mb-1" />
            <div className="font-bold text-gray-800 text-sm">{plan.totalMin} min</div>
            <div className="text-xs text-gray-400">Total time</div>
          </div>

          <div className={`${crowd.bg} ${crowd.border} border rounded-xl p-3 text-center`}>
            <Users className={`h-4 w-4 ${crowd.color} mx-auto mb-1`} />
            <div className={`font-bold text-sm ${crowd.color}`}>{crowd.label}</div>
            <div className="text-xs text-gray-400">Crowd</div>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <ArrowRight className="h-4 w-4 text-gray-400 mx-auto mb-1" />
            <div className="font-bold text-gray-800 text-sm">{plan.transfers}</div>
            <div className="text-xs text-gray-400">Transfer{plan.transfers !== 1 ? "s" : ""}</div>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <Banknote className="h-4 w-4 text-gray-400 mx-auto mb-1" />
            <div className="font-bold text-gray-800 text-sm">₹{plan.fare}</div>
            <div className="text-xs text-gray-400">Approx</div>
          </div>

        </div>

        {/* Crowd Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Crowd level</span>
            <span>{plan.occupancy}/{plan.capacity} seats</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${crowd.bar}`} />
          </div>
        </div>

        {/* Journey Path */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4
                        flex-wrap">
          {plan.legs.map((leg: any, i: number) => (
            <div key={i} className="flex items-center gap-2">
              {leg.type === "WALK" ? (
                <span className="text-xs bg-yellow-100 text-yellow-700
                                 px-2 py-0.5 rounded-full">
                  🚶 Walk {leg.durationMin}min
                </span>
              ) : (
                <>
                  <span className="font-medium text-brand-600">{leg.from}</span>
                  <span className="text-xs bg-blue-50 text-blue-600
                                   px-2 py-0.5 rounded-full">
                    {leg.routeNumber}
                  </span>
                  <span className="font-medium text-brand-600">{leg.to}</span>
                </>
              )}
              {i < plan.legs.length - 1 && (
                <ArrowRight className="h-3 w-3 text-gray-300 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Delay Badge */}
        {plan.delayMin > 0 && (
          <div className="mb-4 text-xs bg-orange-50 text-orange-700
                          border border-orange-200 rounded-lg px-3 py-2">
            ⚠️ Current delay: {plan.delayMin} minutes
          </div>
        )}

        {/* Why Recommended Toggle */}
        <button
          onClick={() => setShowReasons(!showReasons)}
          className="flex items-center gap-1.5 text-sm text-brand-600
                     hover:text-brand-700 font-medium"
        >
          {showReasons ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          Why this route?
        </button>

        {/* Reasons Panel */}
        {showReasons && plan.reasons?.length > 0 && (
          <div className="mt-3 bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">
              Smart Analysis
            </p>
            <ul className="space-y-1.5">
              {plan.reasons.map((reason: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-blue-800">
                  <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>

      {/* Card Footer */}
      <div className="border-t border-gray-100 px-5 py-3 flex gap-3">
        {plan.busId && (
          <button
            onClick={() => router.push(`/track/${plan.busId}`)}
            className="flex-1 bg-brand-600 hover:bg-brand-700 text-white
                       font-medium py-2.5 rounded-xl text-sm flex items-center
                       justify-center gap-2 transition-colors"
          >
            <Navigation className="h-4 w-4" />
            Track Bus Live
          </button>
        )}
        <button
          onClick={() => router.push(
            `/recommend?from=${encodeURIComponent(plan.legs[0]?.from || "")}&to=${encodeURIComponent(plan.legs[plan.legs.length-1]?.to || "")}`
          )}
          className="flex-1 border-2 border-brand-200 text-brand-600
                     hover:bg-brand-50 font-medium py-2.5 rounded-xl
                     text-sm flex items-center justify-center gap-2
                     transition-colors"
        >
          Compare All Routes
        </button>
      </div>

    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Clock, Navigation2, Users,
  CheckCircle, Circle, AlertCircle, ArrowLeft
} from "lucide-react";
import dynamic from "next/dynamic";

// Load map without SSR (Leaflet requires browser)
const TrackingMap = dynamic(
  () => import("@/components/tracking/TrackingMap"),
  { ssr: false, loading: () => (
    <div className="h-64 bg-gray-100 rounded-xl flex items-center justify-center">
      <p className="text-gray-400">Loading map...</p>
    </div>
  )}
);

const CROWD_LABEL = {
  LOW:       { text: "Low",       color: "text-green-600",  bg: "bg-green-100"  },
  MEDIUM:    { text: "Medium",    color: "text-yellow-600", bg: "bg-yellow-100" },
  HIGH:      { text: "High",      color: "text-red-500",    bg: "bg-red-100"    },
  VERY_HIGH: { text: "Very High", color: "text-red-700",    bg: "bg-red-100"    },
};

export default function TrackPage() {
  const { busId } = useParams();
  const router    = useRouter();
  const [bus,     setBus]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tick,    setTick]    = useState(0);

  useEffect(() => {
    async function fetchBus() {
      try {
        const r = await fetch(`/api/buses/track/${busId}`);
        const d = await r.json();
        setBus(d);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    }

    fetchBus();
    // Poll every 5 seconds
    const interval = setInterval(() => {
      fetchBus();
      setTick(t => t + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, [busId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="text-center">
          <Navigation2 className="h-10 w-10 text-brand-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Locating bus...</p>
        </div>
      </div>
    );
  }

  if (!bus || bus.error) {
    return (
      <div className="max-w-xl mx-auto mt-16 p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
        <p className="text-gray-600">Bus not found or tracking unavailable</p>
        <button onClick={() => router.back()}
          className="mt-4 text-brand-600 underline text-sm">
          Go back
        </button>
      </div>
    );
  }

  const crowd = CROWD_LABEL[bus.crowdLevel as keyof typeof CROWD_LABEL]
             ?? CROWD_LABEL.MEDIUM;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-bold text-gray-800 text-lg">
            Bus {bus.busNumber}
          </h1>
          <p className="text-sm text-gray-500">{bus.routeName}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs
                        bg-green-50 text-green-600 border border-green-200
                        rounded-full px-3 py-1">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Live
        </div>
      </div>

      {/* Map */}
      <div className="mb-6 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
        <TrackingMap
          position={bus.position}
          busNumber={bus.busNumber}
          stops={bus.allStops}
          routeStops={bus.allStops}
        />
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 text-center">
          <Clock className="h-5 w-5 text-brand-500 mx-auto mb-1" />
          <div className="font-bold text-brand-700 text-xl">
            {bus.etaToNextStopMin}m
          </div>
          <div className="text-xs text-brand-500">To next stop</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
          <Navigation2 className="h-5 w-5 text-gray-500 mx-auto mb-1" />
          <div className="font-bold text-gray-700 text-xl">
            {bus.distanceToNextKm} km
          </div>
          <div className="text-xs text-gray-400">Distance</div>
        </div>
        <div className={`${crowd.bg} rounded-xl p-4 text-center border border-gray-200`}>
          <Users className={`h-5 w-5 ${crowd.color} mx-auto mb-1`} />
          <div className={`font-bold text-xl ${crowd.color}`}>{crowd.text}</div>
          <div className="text-xs text-gray-400">Crowd</div>
        </div>
      </div>

      {/* Current Info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-sm">
        <div className="flex justify-between text-sm mb-3">
          <span className="text-gray-500">Current stop</span>
          <span className="font-semibold text-gray-800">{bus.currentStop}</span>
        </div>
        <div className="flex justify-between text-sm mb-3">
          <span className="text-gray-500">Next stop</span>
          <span className="font-semibold text-brand-600">{bus.nextStop}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Status</span>
          <span className={`font-semibold ${bus.delayMin > 0 ? "text-orange-500" : "text-green-600"}`}>
            {bus.delayMin > 0 ? `⚠️ Delayed ${bus.delayMin}min` : "✅ On time"}
          </span>
        </div>
      </div>

      {/* Stop Timeline */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">All Stops</h2>
        <div className="space-y-3">
          {bus.allStops.map((stop: any, i: number) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                {stop.status === "DEPARTED" && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {stop.status === "CURRENT" && (
                  <div className="h-5 w-5 rounded-full bg-brand-500
                                  ring-4 ring-brand-100 flex items-center justify-center">
                    <div className="h-2 w-2 bg-white rounded-full" />
                  </div>
                )}
                {stop.status === "UPCOMING" && (
                  <Circle className="h-5 w-5 text-gray-300" />
                )}
                {i < bus.allStops.length - 1 && (
                  <div className={`w-0.5 h-6 mt-1
                    ${stop.status === "DEPARTED" ? "bg-green-300" : "bg-gray-200"}`}
                  />
                )}
              </div>
              <div className="flex-1 pb-1">
                <div className="flex justify-between">
                  <span className={`text-sm font-medium
                    ${stop.status === "CURRENT"  ? "text-brand-600 font-bold" :
                      stop.status === "DEPARTED" ? "text-gray-400" : "text-gray-700"}`}>
                    {stop.name}
                  </span>
                  {stop.status === "UPCOMING" && stop.etaMin && (
                    <span className="text-xs text-gray-400">
                      ~{stop.etaMin} min
                    </span>
                  )}
                  {stop.status === "CURRENT" && (
                    <span className="text-xs text-brand-500 font-medium">
                      🚌 Here now
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report Button */}
      <button
        onClick={() => router.push(`/report?busNumber=${bus.busNumber}`)}
        className="w-full border-2 border-red-200 text-red-500 hover:bg-red-50
                   rounded-xl py-3 text-sm font-medium flex items-center
                   justify-center gap-2 transition-colors"
      >
        <AlertCircle className="h-4 w-4" />
        Report Issue With This Bus
      </button>

    </div>
  );
}

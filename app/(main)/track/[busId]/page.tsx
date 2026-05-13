"use client";

import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useBusTracking } from "@/hooks/useBusTracking";
import {
  Loader2, AlertCircle, MapPin, Users, Zap, Clock,
  Navigation, ArrowLeft, RefreshCw, Bus,
} from "lucide-react";

// ─── Load map with SSR disabled ────────────────────────────────────────────────
const TrackingMap = dynamic(
  () => import("@/components/tracking/TrackingMap"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{ height: "320px" }}
        className="bg-gray-100 rounded-xl flex items-center justify-center"
      >
        <p className="text-gray-400 text-sm">Loading map…</p>
      </div>
    ),
  }
);

// ─── Crowd badge ───────────────────────────────────────────────────────────────
function CrowdBadge({ level }: { level: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    LOW:       { label: "Low crowd",   cls: "bg-green-100 text-green-700"  },
    MEDIUM:    { label: "Moderate",    cls: "bg-yellow-100 text-yellow-700" },
    HIGH:      { label: "High crowd",  cls: "bg-orange-100 text-orange-700" },
    VERY_HIGH: { label: "Very crowded",cls: "bg-red-100 text-red-700"      },
  };
  const { label, cls } = cfg[level] ?? { label: level, cls: "bg-gray-100 text-gray-700" };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${cls}`}>
      {label}
    </span>
  );
}

// ─── Occupancy bar ─────────────────────────────────────────────────────────────
function OccupancyBar({ occupied, capacity }: { occupied: number; capacity: number }) {
  const pct = Math.min(100, Math.round((occupied / capacity) * 100));
  const color =
    pct < 50 ? "bg-green-500" :
    pct < 75 ? "bg-yellow-500" :
    pct < 90 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{occupied} / {capacity} passengers</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function BusTrackPage() {
  const params    = useParams();
  const router    = useRouter();
  const busId     = params?.busId as string;

  const { busData, isLoading, error, refresh } = useBusTracking(busId);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
        <p className="text-gray-500 text-sm">Connecting to live bus feed…</p>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !busData) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 flex flex-col items-center gap-5 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-black text-gray-800">Tracking Unavailable</h2>
        <p className="text-gray-500 text-sm">{error ?? "Bus data could not be loaded."}</p>
        <div className="flex gap-3">
          <button
            onClick={refresh}
            className="flex items-center gap-2 bg-brand-600 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-brand-700 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 font-bold px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  // ── Main UI ────────────────────────────────────────────────────────────────
  const {
    busNumber, routeNumber, routeName, authority,
    position, currentStopName, nextStopName,
    distanceToNextKm, etaToNextStopMin,
    occupancy, capacity, crowdLevel,
    speedKmh, delayMin, allStops, lastUpdated,
  } = busData;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-5">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black text-gray-800 truncate">
            Bus {busNumber} — Route {routeNumber}
          </h1>
          <p className="text-xs text-gray-500 truncate">{routeName} · {authority}</p>
        </div>
        <button
          onClick={refresh}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Refresh tracking"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
        <TrackingMap
          position={position}
          busNumber={busNumber}
          allStops={allStops}
          routeNumber={routeNumber}
        />
      </div>

      {/* Live stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            icon: <Navigation className="w-4 h-4" />,
            label: "Speed",
            value: `${speedKmh} km/h`,
            cls: "text-blue-700",
          },
          {
            icon: <Clock className="w-4 h-4" />,
            label: "ETA Next Stop",
            value: `${etaToNextStopMin} min`,
            cls: "text-green-700",
          },
          {
            icon: <MapPin className="w-4 h-4" />,
            label: "Distance",
            value: `${distanceToNextKm} km`,
            cls: "text-orange-700",
          },
          {
            icon: <Zap className="w-4 h-4" />,
            label: "Delay",
            value: delayMin === 0 ? "On time" : `+${delayMin} min`,
            cls: delayMin === 0 ? "text-green-700" : "text-red-700",
          },
        ].map(({ icon, label, value, cls }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
            <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide mb-1 ${cls}`}>
              {icon} {label}
            </div>
            <p className={`text-lg font-black ${cls}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Current & next stop */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Bus className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Currently At</p>
            <p className="font-black text-gray-800 truncate">{currentStopName}</p>
          </div>
          <CrowdBadge level={crowdLevel} />
        </div>

        <div className="border-t border-dashed border-gray-200 pt-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-4 h-4 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Next Stop</p>
            <p className="font-black text-gray-800 truncate">{nextStopName}</p>
            <p className="text-xs text-gray-500 mt-0.5">{distanceToNextKm} km · {etaToNextStopMin} min away</p>
          </div>
        </div>

        {/* Occupancy */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-gray-400" />
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Occupancy</p>
          </div>
          <OccupancyBar occupied={occupancy} capacity={capacity} />
        </div>
      </div>

      {/* Route timeline */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-black text-gray-800 text-sm uppercase tracking-wider">Route Timeline</h2>
        </div>
        <div className="px-5 py-4 space-y-0">
          {allStops.map((stop, i) => {
            const isPassed  = stop.status === "DEPARTED";
            const isCurrent = stop.status === "CURRENT";
            const isLast    = i === allStops.length - 1;
            return (
              <div key={stop.sequence} className="flex gap-3 relative">
                {/* Vertical connector */}
                {!isLast && (
                  <div
                    className="absolute left-[9px] top-5 bottom-0 w-0.5"
                    style={{
                      background: isPassed ? "#e5e7eb" : isCurrent ? "#22c55e" : "#dbeafe",
                    }}
                  />
                )}
                {/* Dot */}
                <div className="flex-shrink-0 mt-0.5 z-10" style={{ width: 20 }}>
                  <div
                    className="rounded-full border-2 bg-white"
                    style={{
                      width:       isCurrent ? 18 : 14,
                      height:      isCurrent ? 18 : 14,
                      marginLeft:  isCurrent ? 0 : 2,
                      borderColor: isPassed ? "#d1d5db" : isCurrent ? "#3b82f6" : "#93c5fd",
                      background:  isCurrent ? "#3b82f6" : isPassed ? "#f3f4f6" : "#eff6ff",
                      boxShadow:   isCurrent ? "0 0 0 4px rgba(59,130,246,0.15)" : "none",
                    }}
                  />
                </div>
                {/* Content */}
                <div className={`pb-4 flex-1 flex items-start justify-between min-w-0 ${isLast ? "pb-0" : ""}`}>
                  <p
                    className="text-sm leading-snug truncate pr-2"
                    style={{
                      color:      isPassed ? "#9ca3af" : isCurrent ? "#1d4ed8" : "#1f2937",
                      fontWeight: isCurrent ? 900 : isPassed ? 400 : 600,
                    }}
                  >
                    {stop.stopName}
                    {isCurrent && (
                      <span className="ml-1.5 text-[9px] bg-blue-100 text-blue-600 rounded px-1 font-bold uppercase align-middle">
                        Here
                      </span>
                    )}
                    {i === 0 && (
                      <span className="ml-1.5 text-[9px] bg-orange-100 text-orange-600 rounded px-1 font-bold uppercase align-middle">
                        Origin
                      </span>
                    )}
                    {isLast && (
                      <span className="ml-1.5 text-[9px] bg-green-100 text-green-600 rounded px-1 font-bold uppercase align-middle">
                        Dest
                      </span>
                    )}
                  </p>
                  <span className="text-[11px] text-gray-400 font-mono flex-shrink-0">
                    {stop.etaFromNowMin != null
                      ? `+${stop.etaFromNowMin} min`
                      : isPassed ? "✓" : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Last updated */}
      <p className="text-center text-xs text-gray-400">
        Last updated: {new Date(lastUpdated).toLocaleTimeString("en-IN", {
          hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
        })} · Auto-refreshes every 4s
      </p>
    </main>
  );
}

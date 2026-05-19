"use client";

import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useBusTracking } from "@/hooks/useBusTracking";
import {
  Loader2, AlertCircle, MapPin, Users, Zap, Clock,
  Navigation, ArrowLeft, RefreshCw, Bus
} from "lucide-react";
import { useLanguage } from "@/lib/contexts/LanguageContext";

// Load map with SSR disabled
const TrackingMap = dynamic(
  () => import("@/components/tracking/TrackingMap"),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: "320px" }} className="bg-gray-100 rounded-xl flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading map…</p>
      </div>
    ),
  }
);

// ── Crowd badge ───────────────────────────────────────────────────────────────
function CrowdBadge({ level }: { level: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    LOW:       { label: "Low crowd",    cls: "bg-green-100 text-green-700"   },
    MEDIUM:    { label: "Moderate",     cls: "bg-yellow-100 text-yellow-700" },
    HIGH:      { label: "High crowd",   cls: "bg-orange-100 text-orange-700" },
    VERY_HIGH: { label: "Very crowded", cls: "bg-red-100 text-red-700"       },
  };
  const { label, cls } = cfg[level] ?? { label: level, cls: "bg-gray-100 text-gray-700" };
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${cls}`}>{label}</span>;
}

// ── Occupancy bar ─────────────────────────────────────────────────────────────
function OccupancyBar({ occupied, capacity }: { occupied: number; capacity: number }) {
  const pct = Math.min(100, Math.round((occupied / capacity) * 100));
  const color = pct < 50 ? "bg-green-500" : pct < 75 ? "bg-yellow-500" : pct < 90 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{occupied} / {capacity} passengers</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Resolve GTFS vehicle ID or numeric ID to a DB bus ID ─────────────────────
async function resolveDbBusId(rawId: string): Promise<number | null> {
  // If it's already a plain integer, use it directly
  const asInt = parseInt(rawId, 10);
  if (!isNaN(asInt) && String(asInt) === rawId) return asInt;

  // Try to match by busNumber (GTFS IDs often look like DL1PD6734)
  try {
    const res = await fetch(`/api/buses/resolve?id=${encodeURIComponent(rawId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.busId) return data.busId;
    }
  } catch {}

  return null;
}

// ── Main tracking UI ──────────────────────────────────────────────────────────
function TrackPageContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawBusId = searchParams.get("busId") || "";
  const fromQuery = searchParams.get("from") || "";
  const toQuery   = searchParams.get("to")   || "";
  const liveLatParam = searchParams.get("liveLat");
  const liveLonParam = searchParams.get("liveLon");
  const liveLat = Number(liveLatParam);
  const liveLon = Number(liveLonParam);
  const liveRoute = searchParams.get("liveRoute") || "";
  const routeQuery = searchParams.get("route") || "";
  const liveSpeedKmh = Number(searchParams.get("liveSpeedKmh"));
  const hasLivePosition = liveLatParam != null && liveLonParam != null && Number.isFinite(liveLat) && Number.isFinite(liveLon);

  const [dbBusId, setDbBusId]       = useState<number | null>(null);
  const [resolving, setResolving]   = useState(true);
  const [resolveErr, setResolveErr] = useState(false);

  // Resolve the raw busId → DB integer ID
  useEffect(() => {
    if (!rawBusId) { setResolving(false); setResolveErr(true); return; }
    resolveDbBusId(rawBusId).then((id) => {
      if (id) setDbBusId(id);
      else setResolveErr(true);
      setResolving(false);
    });
  }, [rawBusId]);

  const { busData, isLoading, error, refresh } = useBusTracking(dbBusId ?? 0, fromQuery, toQuery);
  const skipFetch = !dbBusId;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (resolving || (dbBusId && isLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 animate-in fade-in duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-brand-500 rounded-full animate-ping opacity-25" />
          <div className="bg-white border-4 border-brand-100 p-4 rounded-full relative shadow-xl">
            <Bus className="w-8 h-8 text-brand-600 animate-bounce" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <h2 className="font-black text-xl text-gray-800 tracking-tight">
            {resolving ? t("track.resolving") : "Locating your bus"}
          </h2>
          <p className="text-gray-500 text-sm font-medium">Connecting to live GPS network...</p>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (resolveErr || error || !busData) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 flex flex-col items-center gap-5 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-black text-gray-800">{t("track.unavailable")}</h2>
        <p className="text-gray-500 text-sm">
          {resolveErr
            ? t("track.notFound")
            : (error ?? t("track.loadError"))}
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          {!resolveErr && (
            <button onClick={refresh}
              className="flex items-center gap-2 bg-brand-600 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-brand-700 transition-colors text-sm">
              <RefreshCw className="w-4 h-4" /> {t("track.retry")}
            </button>
          )}
          <button onClick={() => router.back()}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 font-bold px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> {t("track.goBack")}
          </button>
        </div>
      </div>
    );
  }

  const {
    busNumber, routeNumber, routeName, authority,
    position,
    occupancy, capacity, crowdLevel,
    speedKmh, delayMin, allStops, lastUpdated,
  } = busData;

  function routeCodeFromPlace(place: string): string {
    const clean = place
      .replace(/\b(bus|stand|isbt|sector|chowk|terminal|station)\b/gi, "")
      .replace(/[^a-z0-9 ]/gi, " ")
      .trim();
    const words = clean.split(/\s+/).filter(Boolean);
    const base = words.length > 1
      ? words.map(word => word[0]).join("")
      : (words[0] || place).slice(0, 3);
    return base.toUpperCase().slice(0, 4);
  }

  const isRawVehicleId = rawBusId && !/^\d+$/.test(rawBusId);
  const derivedRouteNumber = fromQuery && toQuery
    ? `${routeCodeFromPlace(fromQuery)}-${routeCodeFromPlace(toQuery)}`
    : routeNumber;
  const displayPosition = hasLivePosition ? { lat: liveLat, lon: liveLon } : position;
  const displayBusNumber = hasLivePosition || isRawVehicleId ? rawBusId : busNumber;
  const displayRouteNumber = hasLivePosition && liveRoute
    ? liveRoute.replace(/(up|down)$/i, "")
    : routeQuery || derivedRouteNumber;
  const displaySpeedKmh = hasLivePosition && Number.isFinite(liveSpeedKmh) ? liveSpeedKmh : speedKmh;

  function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  let totalDistKm = 0;
  for (let i = 0; i < allStops.length - 1; i++) {
    totalDistKm += haversineKm(
      allStops[i].latitude, allStops[i].longitude,
      allStops[i+1].latitude, allStops[i+1].longitude
    );
  }
  const totalTimeMin = speedKmh > 0 ? (totalDistKm / speedKmh) * 60 : 0;
  const lastStopEta = allStops[allStops.length - 1]?.etaFromNowMin;

  function formatTimeMin(mins: number): string {
    const total = Math.round(mins);
    if (total < 60) return `${total} min`;
    const h = Math.floor(total / 60);
    const m = total % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-brand-200 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-white to-brand-50">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest mb-2 border border-green-200">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {t("track.status")}
          </div>
          <h1 className="text-2xl font-black text-gray-800">
            {t("track.route")} {displayRouteNumber}
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            {t("track.vehicle")} {displayBusNumber} • {t("track.towards")} <span className="font-bold text-gray-700">{routeName}</span>
          </p>
        </div>
          <div className="text-left sm:text-right w-full sm:w-auto pt-3 sm:pt-0 border-t border-brand-100 sm:border-0 mt-1 sm:mt-0 flex flex-col items-start sm:items-end gap-2">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t("track.speed")}</p>
              <p className="text-xl font-black text-brand-600">{displaySpeedKmh} <span className="text-sm text-brand-400">km/h</span></p>
            </div>
            <button
              onClick={() => router.push(`/report?busNumber=${encodeURIComponent(displayBusNumber)}`)}
              className="flex items-center gap-1.5 bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Report Issue
            </button>
          </div>
        </div>

      {/* Map */}
      <div id="tour-live-map" className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
        <TrackingMap
          position={displayPosition}
          busNumber={displayBusNumber}
          busId={dbBusId ?? rawBusId}
          allStops={allStops}
          routeNumber={displayRouteNumber}
          fromStop={fromQuery || undefined}
          toStop={toQuery || undefined}
          snapToRoute={!hasLivePosition}
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <MapPin      className="w-4 h-4" />, label: t("track.totalDist"),   value: `${totalDistKm.toFixed(1)} km`,                       cls: "text-blue-700"   },
          { icon: <Clock       className="w-4 h-4" />, label: t("track.totalTime"),   value: formatTimeMin(totalTimeMin),                    cls: "text-green-700"  },
          { icon: <Navigation  className="w-4 h-4" />, label: t("track.reachIn"),   value: lastStopEta != null ? formatTimeMin(lastStopEta) : t("track.reached"), cls: "text-orange-700" },
          { icon: <Zap         className="w-4 h-4" />, label: t("track.delay"),        value: delayMin === 0 ? t("track.onTime") : `+${delayMin} min`,      cls: delayMin === 0 ? "text-green-700" : "text-red-700" },
        ].map(({ icon, label, value, cls }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
            <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide mb-1 ${cls}`}>
              {icon} {label}
            </div>
            <p className={`text-lg font-black ${cls}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Occupancy */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{t("track.occupancy")}</p>
            </div>
            <CrowdBadge level={crowdLevel} />
          </div>
          <OccupancyBar occupied={occupancy} capacity={capacity} />
        </div>
      </div>

      {/* Route timeline */}
      <div id="tour-timeline" className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-black text-gray-800 text-sm uppercase tracking-wider">Route Timeline</h2>
        </div>
        <div className="px-5 py-4 space-y-0">
          {allStops.filter((_, i) => i === 0 || i === allStops.length - 1).map((stop, i, arr) => {
            const isPassed  = stop.status === "DEPARTED";
            const isCurrent = stop.status === "CURRENT";
            const isLast    = i === arr.length - 1;
            return (
              <div key={stop.sequence} className="flex gap-3 relative">
                {!isLast && (
                  <div className="absolute left-[9px] top-5 bottom-0 w-0.5"
                    style={{ background: isPassed ? "#e5e7eb" : isCurrent ? "#22c55e" : "#dbeafe" }} />
                )}
                <div className="flex-shrink-0 mt-0.5 z-10" style={{ width: 20 }}>
                  <div className="rounded-full border-2 bg-white" style={{
                    width:       isCurrent ? 18 : 14,
                    height:      isCurrent ? 18 : 14,
                    marginLeft:  isCurrent ? 0 : 2,
                    borderColor: isPassed ? "#d1d5db" : isCurrent ? "#3b82f6" : "#93c5fd",
                    background:  isCurrent ? "#3b82f6" : isPassed ? "#f3f4f6" : "#eff6ff",
                    boxShadow:   isCurrent ? "0 0 0 4px rgba(59,130,246,0.15)" : "none",
                  }} />
                </div>
                <div className={`pb-4 flex-1 flex items-start justify-between min-w-0 ${isLast ? "pb-0" : ""}`}>
                  <p className="text-sm leading-snug truncate pr-2" style={{
                    color:      isPassed ? "#9ca3af" : isCurrent ? "#1d4ed8" : "#1f2937",
                    fontWeight: isCurrent ? 900 : isPassed ? 400 : 600,
                  }}>
                    {stop.stopName}
                    {isCurrent && <span className="ml-1.5 text-[9px] bg-blue-100 text-blue-600 rounded px-1 font-bold uppercase align-middle">Here</span>}
                    {i === 0    && <span className="ml-1.5 text-[9px] bg-orange-100 text-orange-600 rounded px-1 font-bold uppercase align-middle">Origin</span>}
                    {isLast     && <span className="ml-1.5 text-[9px] bg-green-100 text-green-600 rounded px-1 font-bold uppercase align-middle">Dest</span>}
                  </p>
                  <span className="text-[11px] text-gray-400 font-mono flex-shrink-0">
                    {stop.etaFromNowMin != null ? `+${stop.etaFromNowMin} min` : isPassed ? "✓" : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-center text-xs text-gray-400">
        Last updated: {new Date(lastUpdated).toLocaleTimeString("en-IN", {
          hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
        })} · Auto-refreshes every 4s
      </p>
    </main>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="bg-white border-4 border-brand-100 p-4 rounded-full shadow-xl">
          <Bus className="w-8 h-8 text-brand-600 animate-pulse" />
        </div>
      </div>
    }>
      <TrackPageContent />
    </Suspense>
  );
}

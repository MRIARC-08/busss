"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface StopStatus {
  sequence: number;
  stopName: string;
  latitude: number;
  longitude: number;
  status: "DEPARTED" | "CURRENT" | "UPCOMING";
  etaFromNowMin: number | null;
}

export interface BusTrackingData {
  busId: number;
  busNumber: string;
  routeNumber: string;
  routeName: string;
  authority: string;
  position: { lat: number; lon: number };
  segmentIndex: number;
  progressPct: number;
  currentStopName: string;
  nextStopName: string;
  distanceToNextKm: number;
  etaToNextStopMin: number;
  occupancy: number;
  capacity: number;
  crowdLevel: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
  status: string;
  delayMin: number;
  speedKmh: number;
  allStops: StopStatus[];
  lastUpdated: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useBusTracking(busId: string | number) {
  const [busData, setBusData]   = useState<BusTrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const intervalRef             = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    if (!busId || busId === 0 || busId === "0") return; // not resolved yet
    try {
      const res = await fetch(`/api/buses/track/${busId}`, { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const data: BusTrackingData = await res.json();
      setBusData(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Could not reach tracking server");
    } finally {
      setIsLoading(false);
    }
  }, [busId]);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  return { busData, isLoading, error, refresh: fetchData };
}

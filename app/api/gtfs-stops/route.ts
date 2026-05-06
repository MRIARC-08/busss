export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

// Module-level cache — survives hot-reload in dev, persists across requests in prod
let stopTimesCache: any[] | null = null;
let stopsCacheMap: Map<string, { name: string; lat: number; lon: number }> | null = null;

function loadGtfsData(dataDir: string) {
  if (stopTimesCache && stopsCacheMap) return { ok: true };

  const timesPath = path.join(dataDir, "stop_times.txt");
  const stopsPath = path.join(dataDir, "stops.txt");
  if (!fs.existsSync(timesPath) || !fs.existsSync(stopsPath)) return { ok: false };

  try {
    const stopsRecords: any[] = parse(fs.readFileSync(stopsPath, "utf8"), {
      columns: true, skip_empty_lines: true,
    });
    stopsCacheMap = new Map();
    for (const s of stopsRecords) {
      stopsCacheMap.set(s.stop_id, {
        name: s.stop_name,
        lat: parseFloat(s.stop_lat),
        lon: parseFloat(s.stop_lon),
      });
    }
    stopTimesCache = parse(fs.readFileSync(timesPath, "utf8"), {
      columns: true, skip_empty_lines: true,
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

// ── Tiny Haversine distance (km) ─────────────────────────────────────────────
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Generate a geographically plausible mock route ────────────────────────────
// Uses real geocoded lat/lon of source & dest to interpolate intermediate stops
// along a straight-line path with slight random jitter.
function buildMockStops(
  sourceName: string,
  destName: string,
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number
) {
  const NUM_INTERMEDIATES = 5; // total stops = source + 5 + dest = 7
  const stops: any[] = [];

  // Source
  stops.push({
    stopId: "mock_0",
    sequence: 0,
    name: sourceName,
    lat: fromLat,
    lon: fromLon,
  });

  // Intermediates: evenly spaced along the straight line, slight jitter
  for (let i = 1; i <= NUM_INTERMEDIATES; i++) {
    const t = i / (NUM_INTERMEDIATES + 1);
    const jitterLat = (Math.random() - 0.5) * 0.005; // ±~550m
    const jitterLon = (Math.random() - 0.5) * 0.005;
    stops.push({
      stopId: `mock_${i}`,
      sequence: i,
      name: `Stop ${i}`,                  // generic label — no fake "Civil Lines"
      lat: fromLat + (toLat - fromLat) * t + jitterLat,
      lon: fromLon + (toLon - fromLon) * t + jitterLon,
    });
  }

  // Destination
  stops.push({
    stopId: `mock_${NUM_INTERMEDIATES + 1}`,
    sequence: NUM_INTERMEDIATES + 1,
    name: destName,
    lat: toLat,
    lon: toLon,
  });

  return stops;
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const tripId        = searchParams.get("tripId") || "";
  const busLat        = parseFloat(searchParams.get("lat") || "0");
  const busLon        = parseFloat(searchParams.get("lon") || "0");
  const currentSeq    = parseInt(searchParams.get("stopSequence") || "0");
  const journeyFrom   = (searchParams.get("from") || "").trim();
  const journeyTo     = (searchParams.get("to")   || "").trim();
  // Geocoded coordinates of the journey endpoints (passed by the frontend)
  const fromLat       = parseFloat(searchParams.get("fromLat") || "0");
  const fromLon       = parseFloat(searchParams.get("fromLon") || "0");
  const toLat         = parseFloat(searchParams.get("toLat")   || "0");
  const toLon         = parseFloat(searchParams.get("toLon")   || "0");

  if (!tripId) {
    return NextResponse.json({ success: false, error: "Missing tripId" }, { status: 400 });
  }

  // ── Same-stop guard ─────────────────────────────────────────────────────────
  const jfLower = journeyFrom.toLowerCase();
  const jtLower = journeyTo.toLowerCase();
  if (jfLower && jtLower && jfLower === jtLower) {
    return NextResponse.json(
      { success: false, sameStop: true, error: "Origin and destination cannot be the same stop." },
      { status: 400 }
    );
  }

  try {
    const dataDir = path.join(process.cwd(), "gtfs_data");
    const { ok } = loadGtfsData(dataDir);

    let allTripStops: any[] = [];

    // ── Real GTFS path ────────────────────────────────────────────────────────
    if (ok && stopTimesCache && stopsCacheMap) {
      const tripStops = stopTimesCache
        .filter((r: any) => r.trip_id === tripId)
        .sort((a: any, b: any) => parseInt(a.stop_sequence) - parseInt(b.stop_sequence));

      allTripStops = tripStops.map((ts: any) => {
        const stop = stopsCacheMap!.get(ts.stop_id);
        return {
          stopId: ts.stop_id,
          sequence: parseInt(ts.stop_sequence),
          name: stop?.name ?? `Stop ${ts.stop_id}`,
          lat: stop?.lat ?? null,
          lon: stop?.lon ?? null,
        };
      });
    }

    // ── Mock fallback ─────────────────────────────────────────────────────────
    // Only build mock when we have valid, distinct endpoints with geocoordinates.
    if (allTripStops.length === 0) {
      if (!journeyFrom || !journeyTo || jfLower === jtLower) {
        return NextResponse.json({
          success: true, stops: [], totalStops: 0,
          segmentBounds: { from: null, to: null },
        });
      }

      // Use geocoded coordinates if provided, otherwise fall back to bus position
      const srcLat = fromLat || busLat || 28.6139;
      const srcLon = fromLon || busLon || 77.2090;
      const dstLat = toLat || (busLat + 0.05) || 28.6500;
      const dstLon = toLon || (busLon + 0.05) || 77.2500;

      allTripStops = buildMockStops(journeyFrom, journeyTo, srcLat, srcLon, dstLat, dstLon);
    }

    // ── Journey bounds filtering ──────────────────────────────────────────────
    // Find source / destination in the real trip's stop list using fuzzy name match.
    // For mock data, the first/last stop IS already source/dest.
    let startIdx = 0;
    let endIdx   = allTripStops.length - 1;

    const isMock = String(allTripStops[0]?.stopId).startsWith("mock_");

    if (!isMock && journeyFrom && journeyTo) {
      const fi = allTripStops.findIndex(s => s.name.toLowerCase().includes(jfLower));
      const ti = allTripStops.findIndex(s => s.name.toLowerCase().includes(jtLower));
      if (fi >= 0) startIdx = fi;
      if (ti >= 0) endIdx   = ti;
    }

    // If both resolve to the same stop, return empty
    if (startIdx >= endIdx) {
      return NextResponse.json({
        success: false, sameStop: true,
        error: "Origin and destination resolve to the same stop on this route.",
        stops: [], totalStops: 0, segmentBounds: { from: null, to: null },
      });
    }

    const segmentStops = allTripStops.slice(startIdx, endIdx + 1);

    // ── Bus position within the segment ──────────────────────────────────────
    // Find the nearest stop to the bus's current position
    let nearestIdx = 0;
    if (busLat && busLon) {
      let minDist = Infinity;
      segmentStops.forEach((st, idx) => {
        if (st.lat != null && st.lon != null) {
          const d = haversineKm(busLat, busLon, st.lat, st.lon);
          if (d < minDist) { minDist = d; nearestIdx = idx; }
        }
      });
    }

    // ── Status assignment ────────────────────────────────────────────────────
    const now = Date.now();
    // Estimate time per stop: use currentSeq-based offset if available, else haversine
    const avgMinsPerStop = 3; // conservative default

    const finalStops = segmentStops.map((st, idx) => {
      let status: "passed" | "current" | "upcoming";
      if (currentSeq > 0) {
        if (st.sequence < currentSeq)   status = "passed";
        else if (st.sequence === currentSeq) status = "current";
        else                             status = "upcoming";
      } else {
        if (idx < nearestIdx)            status = "passed";
        else if (idx === nearestIdx)     status = "current";
        else                             status = "upcoming";
      }

      // ETA calculation
      const relativeIdx = idx - nearestIdx;
      let etaMs: number;
      if (status === "passed")   etaMs = now - (nearestIdx - idx) * avgMinsPerStop * 60000;
      else if (status === "current") etaMs = now;
      else                        etaMs = now + relativeIdx * avgMinsPerStop * 60000;

      const time = new Date(etaMs).toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", hour12: false,
      });

      return { ...st, status, time, isMock };
    });

    // Ensure exactly one "current" marker
    if (!finalStops.some(s => s.status === "current") && finalStops.length > 0) {
      const firstUpcoming = finalStops.findIndex(s => s.status === "upcoming");
      finalStops[firstUpcoming >= 0 ? firstUpcoming : 0].status = "current";
    }

    const src  = finalStops[0];
    const dest = finalStops[finalStops.length - 1];

    return NextResponse.json({
      success: true,
      stops: finalStops,
      totalStops: finalStops.length,
      isMock,
      segmentBounds: {
        from: src  ? { lat: src.lat,  lon: src.lon,  name: src.name  } : null,
        to:   dest ? { lat: dest.lat, lon: dest.lon, name: dest.name } : null,
      },
    });

  } catch (e: any) {
    console.error("GTFS processing error:", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

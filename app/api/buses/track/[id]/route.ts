import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface SimState {
  segmentIndex: number;
  progressPct: number;
  occupancy: number;
  delayMin: number;
  lastTickMs: number;
  speedKmh: number;
}

const simStates = (globalThis as any).simStates || new Map<number, SimState>();
(globalThis as any).simStates = simStates;

const geocodeCache = (globalThis as any).geocodeCache || new Map<string, {lat: number, lon: number}>();
(globalThis as any).geocodeCache = geocodeCache;

async function geocode(query: string) {
  if (!query) return null;
  const key = query.toLowerCase();
  if (geocodeCache.has(key)) return geocodeCache.get(key);

  const queryVariants = [
    `${query}, India`,
    `${query}, Delhi NCR, India`,
    `${query}, Delhi, India`,
    query,
  ];

  for (const variant of queryVariants) {
    try {
      const params = new URLSearchParams({
        format: "json",
        q: variant,
        limit: "1",
        countrycodes: "IN",
      });
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        headers: { "User-Agent": "SmartBusNavigator/1.0" },
      });
      const data = await res.json();
      if (data && data[0]) {
        const coord = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        geocodeCache.set(key, coord);
        return coord;
      }
    } catch {
      // Try the next query variant.
    }
  }

  return null;
}

function speedForType(type: string): number {
  switch (type.toUpperCase()) {
    case "ORDINARY":  return 30;
    case "EXPRESS":   return 50;
    case "INTERCITY": return 65;
    default:          return 35;
  }
}

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

function crowdLevel(occupancy: number, capacity: number): "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH" {
  const hour = new Date().getHours();
  const isPeak = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
  const loadPct = (occupancy / capacity) * 100 * (isPeak ? 1.3 : 1);
  if (loadPct < 40) return "LOW";
  if (loadPct < 65) return "MEDIUM";
  if (loadPct < 85) return "HIGH";
  return "VERY_HIGH";
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const busId = parseInt(params.id, 10);
  if (isNaN(busId)) {
    return NextResponse.json({ error: "Invalid bus ID" }, { status: 400 });
  }

  const url         = new URL(req.url);
  const fromStopRaw = url.searchParams.get("from")?.trim() ?? "";
  const toStopRaw   = url.searchParams.get("to")?.trim()   ?? "";
  const fromStop    = fromStopRaw.toLowerCase();
  const toStop      = toStopRaw.toLowerCase();

  let bus: any;
  try {
    bus = await prisma.bus.findUnique({
      where: { id: busId },
      include: {
        route: {
          include: {
            authority: true,
            stops: { orderBy: { sequence: "asc" } },
          },
        },
        authority: true,
      },
    });
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (!bus) return NextResponse.json({ error: "Bus not found" }, { status: 404 });

  let stops = bus.route.stops;

  // ── Dynamically override route geometry if user searched specific places ───
  if (fromStop && toStop) {
    const origin = await geocode(fromStopRaw);
    const dest = await geocode(toStopRaw);
    if (origin && dest) {
      const numPoints = 8;
      stops = Array.from({length: numPoints}).map((_, i) => {
        const frac = i / (numPoints - 1);
        return {
          sequence: i + 1,
          stopName: i === 0 ? fromStopRaw : i === numPoints - 1 ? toStopRaw : `Route Waypoint ${i}`,
          latitude: origin.lat + (dest.lat - origin.lat) * frac,
          longitude: origin.lon + (dest.lon - origin.lon) * frac,
        };
      });
    }
  }

  if (!stops || stops.length < 2) {
    return NextResponse.json({ error: "Route has insufficient stops" }, { status: 400 });
  }

  const vehicleOffset = parseFloat(url.searchParams.get("vehicleOffset") ?? "0") || 0;

  const now = Date.now();
  let sim = simStates.get(busId);

  if (!sim) {
    const initOcc = Math.floor(bus.capacity * (0.3 + Math.random() * 0.35));
    // Offset starting segment by vehicleOffset so different vehicles appear at different positions
    const startSeg = Math.min(
      Math.floor(vehicleOffset * (stops.length - 1)),
      stops.length - 2
    ) || Math.min(bus.simSegment ?? 0, stops.length - 2);

    sim = {
      segmentIndex: startSeg,
      progressPct:  (vehicleOffset * 100) % 100,
      occupancy:    bus.simOccupancy || initOcc,
      delayMin:     bus.simDelay ?? 0,
      lastTickMs:   now,
      speedKmh:     speedForType(bus.route.type),
    };
    simStates.set(busId, sim);
  }

  // ── Advance simulation ────────────────────────────────────────────────────
  const elapsedSec = (now - sim.lastTickMs) / 1000;

  if (sim.segmentIndex >= stops.length - 1) {
    sim.segmentIndex = 0;
    sim.progressPct  = 0;
  }

  const segStart = stops[sim.segmentIndex];
  const segEnd   = stops[sim.segmentIndex + 1];
  const segLenKm = haversineKm(
    segStart.latitude, segStart.longitude,
    segEnd.latitude,   segEnd.longitude
  );

  const distTraveledKm  = (sim.speedKmh / 3600) * elapsedSec;
  const progressInc     = segLenKm > 0 ? (distTraveledKm / segLenKm) * 100 : 0;
  let newProgress       = sim.progressPct + progressInc;

  while (newProgress >= 100) {
    newProgress -= 100;
    sim.segmentIndex++;
    const board  = Math.floor(Math.random() * 9);
    const alight = Math.floor(Math.random() * Math.min(13, sim.occupancy + 1));
    sim.occupancy = Math.max(0, Math.min(bus.capacity, sim.occupancy - alight + board));
    if (sim.segmentIndex >= stops.length - 1) {
      sim.segmentIndex = 0;
      newProgress      = 0;
      break;
    }
  }

  sim.progressPct = newProgress;
  sim.lastTickMs  = now;
  simStates.set(busId, sim);

  // ── Current interpolated position ─────────────────────────────────────────
  const curStart = stops[sim.segmentIndex];
  const curEnd   = stops[Math.min(sim.segmentIndex + 1, stops.length - 1)];
  const frac     = sim.progressPct / 100;

  const currentLat = curStart.latitude  + (curEnd.latitude  - curStart.latitude)  * frac;
  const currentLon = curStart.longitude + (curEnd.longitude - curStart.longitude) * frac;

  // ── ETA to NEXT stop (purely distance / speed) ────────────────────────────
  const curSegLenKm      = haversineKm(curStart.latitude, curStart.longitude, curEnd.latitude, curEnd.longitude);
  const remainingKm      = curSegLenKm * (1 - frac);
  const etaToNextStopMin = sim.speedKmh > 0 ? (remainingKm / sim.speedKmh) * 60 : 0;

  const segmentIndex = sim.segmentIndex;
  const speedKmh     = sim.speedKmh;

  // ── allStops with CORRECT cumulative ETA (Haversine + speed only) ─────────
  const allStops = stops.map((stop: any, index: number) => {
    if (index < segmentIndex) {
      return {
        sequence: stop.sequence, stopName: stop.stopName,
        latitude: stop.latitude, longitude: stop.longitude,
        status: "DEPARTED" as const, etaFromNowMin: null,
      };
    }

    if (index === segmentIndex) {
      return {
        sequence: stop.sequence, stopName: stop.stopName,
        latitude: stop.latitude, longitude: stop.longitude,
        status: "CURRENT" as const, etaFromNowMin: null,
      };
    }

    // UPCOMING: cumulative ETA from current position using real distances
    let cumulativeEta = etaToNextStopMin;
    for (let j = segmentIndex + 1; j < index; j++) {
      const segDist = haversineKm(
        stops[j].latitude, stops[j].longitude,
        stops[j + 1].latitude, stops[j + 1].longitude
      );
      cumulativeEta += (segDist / speedKmh) * 60;
    }

    return {
      sequence: stop.sequence, stopName: stop.stopName,
      latitude: stop.latitude, longitude: stop.longitude,
      status: "UPCOMING" as const,
      etaFromNowMin: parseFloat(cumulativeEta.toFixed(1)), // FIXED: 1 decimal so countdown is visible every 4s poll
    };
  });

  // ── Slice allStops to the user's requested from→to segment ─────────────────
  // Match stop names fuzzy (exact > partial) against the URL from/to params.
  function findStopIdx(query: string, fallback: number): number {
    if (!query) return fallback;
    // 1. exact match
    let idx = allStops.findIndex((s: any) => s.stopName.toLowerCase() === query);
    if (idx !== -1) return idx;
    // 2. stop name contains query
    idx = allStops.findIndex((s: any) => s.stopName.toLowerCase().includes(query));
    if (idx !== -1) return idx;
    // 3. query contains stop name
    idx = allStops.findIndex((s: any) => query.includes(s.stopName.toLowerCase()));
    if (idx !== -1) return idx;
    return fallback;
  }

  // Default: show the route from its origin unless the user supplied a from stop.
  const defaultStart = 0;
  const defaultEnd   = allStops.length - 1;

  let startIdx = findStopIdx(fromStop, defaultStart);
  let endIdx   = findStopIdx(toStop,   defaultEnd);

  // Ensure valid order
  if (startIdx > endIdx) [startIdx, endIdx] = [endIdx, startIdx];

  const slicedStops = allStops.slice(startIdx, endIdx + 1);

  // ── Dynamic Mock Overrides ──────────────────────────────────────────────────
  // If the user came from the search page with a specific from/to query, 
  // we dynamically inject those names into the mock route to maintain UI consistency.
  let dynamicRouteName = bus.route.name;
  
  function capitalize(str: string) {
    return str.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }

  if (fromStop && toStop) {
    dynamicRouteName = `${capitalize(fromStopRaw)} - ${capitalize(toStopRaw)}`;
    
    // Override the first stop name if we couldn't fuzzy match it
    if (slicedStops.length > 0 && findStopIdx(fromStop, -1) === -1) {
      slicedStops[0].stopName = capitalize(fromStopRaw);
    }
    // Override the last stop name if we couldn't fuzzy match it
    if (slicedStops.length > 1 && findStopIdx(toStop, -1) === -1) {
      slicedStops[slicedStops.length - 1].stopName = capitalize(toStopRaw);
    }
  }

  const displayStops = slicedStops.map((stop: any, index: number) => {
    if (index === 0) {
      return { ...stop, status: "CURRENT" as const, etaFromNowMin: null };
    }

    let cumulativeEta = 0;
    for (let j = 0; j < index; j++) {
      const segDist = haversineKm(
        slicedStops[j].latitude, slicedStops[j].longitude,
        slicedStops[j + 1].latitude, slicedStops[j + 1].longitude
      );
      cumulativeEta += speedKmh > 0 ? (segDist / speedKmh) * 60 : 0;
    }

    return {
      ...stop,
      status: "UPCOMING" as const,
      etaFromNowMin: parseFloat(cumulativeEta.toFixed(1)),
    };
  });

  const displayPositionStop = displayStops[0] ?? curStart;

  console.log(
    `[SIM] Bus ${busId} | Seg ${segmentIndex} | Progress ${sim.progressPct.toFixed(1)}% | ` +
    `Speed ${speedKmh}kmh | ETA next ${Math.round(etaToNextStopMin)}min | ` +
    `Slice ${startIdx}→${endIdx} (${slicedStops.length} stops)`
  );

  return NextResponse.json({
    busId:            bus.id,
    busNumber:        bus.busNumber,
    routeNumber:      bus.route.routeNumber,
    routeName:        dynamicRouteName,
    authority:        bus.authority.name,
    position:         { lat: displayPositionStop.latitude, lon: displayPositionStop.longitude },
    segmentIndex,
    progressPct:      parseFloat(sim.progressPct.toFixed(2)),
    currentStopName:  curStart.stopName,
    nextStopName:     curEnd.stopName,
    distanceToNextKm: parseFloat(remainingKm.toFixed(2)),
    etaToNextStopMin: parseFloat(etaToNextStopMin.toFixed(1)),
    occupancy:        sim.occupancy,
    capacity:         bus.capacity,
    crowdLevel:       crowdLevel(sim.occupancy, bus.capacity),
    status:           "ON_ROUTE",
    delayMin:         sim.delayMin,
    speedKmh,
    allStops:         displayStops,
    lastUpdated:      new Date().toISOString(),
  });
}

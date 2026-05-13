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

const simStates = new Map<number, SimState>();

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

  const url      = new URL(req.url);
  const fromStop = url.searchParams.get("from")?.trim().toLowerCase() ?? "";
  const toStop   = url.searchParams.get("to")?.trim().toLowerCase()   ?? "";

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

  const stops = bus.route.stops;
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

  // Default: start from current segment, end at last stop
  const defaultStart = segmentIndex;
  const defaultEnd   = allStops.length - 1;

  let startIdx = findStopIdx(fromStop, defaultStart);
  let endIdx   = findStopIdx(toStop,   defaultEnd);

  // Ensure valid order
  if (startIdx > endIdx) [startIdx, endIdx] = [endIdx, startIdx];
  // Never go before current position if from wasn't matched
  if (!fromStop) startIdx = Math.min(startIdx, segmentIndex);

  const slicedStops = allStops.slice(startIdx, endIdx + 1);

  console.log(
    `[SIM] Bus ${busId} | Seg ${segmentIndex} | Progress ${sim.progressPct.toFixed(1)}% | ` +
    `Speed ${speedKmh}kmh | ETA next ${Math.round(etaToNextStopMin)}min | ` +
    `Slice ${startIdx}→${endIdx} (${slicedStops.length} stops)`
  );

  return NextResponse.json({
    busId:            bus.id,
    busNumber:        bus.busNumber,
    routeNumber:      bus.route.routeNumber,
    routeName:        bus.route.name,
    authority:        bus.authority.name,
    position:         { lat: currentLat, lon: currentLon },
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
    allStops:         slicedStops,   // ← already sliced to from→to segment
    lastUpdated:      new Date().toISOString(),
  });
}

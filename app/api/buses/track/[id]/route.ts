import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Simple in-memory simulation state
const simState = new Map<number, any>();

function getOrInitState(bus: any) {
  if (!simState.has(bus.id)) {
    simState.set(bus.id, {
      segment:    bus.simSegment,
      progress:   bus.simProgress,
      occupancy:  bus.simOccupancy,
      delay:      bus.simDelay,
      lastTick:   Date.now(),
    });
  }
  return simState.get(bus.id)!;
}

function tickBus(state: any, stops: any[]) {
  const now     = Date.now();
  const elapsed = (now - state.lastTick) / 1000;
  const speedKmh = 35;
  const speedMs  = (speedKmh * 1000) / 3600;

  if (state.segment >= stops.length - 1) {
    return { ...state, status: "COMPLETED" };
  }

  const segStart  = stops[state.segment];
  const segEnd    = stops[state.segment + 1];
  const segDistKm = haversine(segStart, segEnd);
  const segDistM  = segDistKm * 1000;

  const progressIncrease = (speedMs * elapsed / segDistM) * 100;
  let newProgress = state.progress + progressIncrease;
  let newSegment  = state.segment;

  if (newProgress >= 100) {
    newProgress = 0;
    newSegment  = state.segment + 1;
    // Simulate passenger change
    const alighting = Math.floor(state.occupancy * 0.2 * Math.random());
    const boarding   = Math.floor(Math.random() * 12);
    state.occupancy  = Math.max(0, state.occupancy - alighting + boarding);
  }

  return {
    ...state,
    segment:  newSegment,
    progress: newProgress,
    lastTick: now,
    status:   "ON_ROUTE",
  };
}

function haversine(a: any, b: any) {
  const R    = 6371;
  const dLat = deg2rad(b.latitude - a.latitude);
  const dLon = deg2rad(b.longitude - a.longitude);
  const x    = Math.sin(dLat/2)**2 +
               Math.cos(deg2rad(a.latitude)) *
               Math.cos(deg2rad(b.latitude)) *
               Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}

function deg2rad(d: number) { return d * Math.PI / 180; }

function interpolate(a: any, b: any, pct: number) {
  const p = pct / 100;
  return {
    lat: a.latitude  + (b.latitude  - a.latitude)  * p,
    lon: a.longitude + (b.longitude - a.longitude) * p,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const busId = parseInt(params.id);
  if (isNaN(busId)) {
    return NextResponse.json({ error: "Invalid bus ID" }, { status: 400 });
  }

  try {
    const bus = await prisma.bus.findUnique({
      where: { id: busId },
      include: {
        route: {
          include: {
            stops: { orderBy: { sequence: "asc" } },
            authority: true,
          },
        },
        authority: true,
      },
    });

    if (!bus) {
      return NextResponse.json({ error: "Bus not found" }, { status: 404 });
    }

    const stops = bus.route.stops;
    let   state = getOrInitState(bus);
    state = tickBus(state, stops);
    simState.set(busId, state);

    const seg     = Math.min(state.segment, stops.length - 1);
    const nextSeg = Math.min(state.segment + 1, stops.length - 1);

    const currentStop = stops[seg];
    const nextStop    = stops[nextSeg];

    const position = seg < stops.length - 1
      ? interpolate(currentStop, nextStop, state.progress)
      : { lat: currentStop.latitude, lon: currentStop.longitude };

    const distToNext = seg < stops.length - 1
      ? haversine(position, nextStop) 
      : 0;

    const etaMin = distToNext > 0
      ? Math.max(1, Math.round((distToNext / 35) * 60))
      : 0;

    const load = state.occupancy / bus.capacity;
    const crowdLevel = load < 0.4 ? "LOW"
                     : load < 0.65 ? "MEDIUM"
                     : load < 0.85 ? "HIGH"
                     : "VERY_HIGH";

    return NextResponse.json({
      busId,
      busNumber:    bus.busNumber,
      routeNumber:  bus.route.routeNumber,
      routeName:    bus.route.name,
      authority:    bus.authority.code,
      position,
      currentStop:  currentStop.stopName,
      nextStop:     nextStop.stopName,
      distanceToNextKm: Math.round(distToNext * 10) / 10,
      etaToNextStopMin: etaMin,
      occupancy:    state.occupancy,
      capacity:     bus.capacity,
      crowdLevel,
      status:       state.status,
      delayMin:     state.delay,
      allStops:     stops.map((s, i) => ({
        sequence:   s.sequence,
        name:       s.stopName,
        status:     i < seg ? "DEPARTED"
                  : i === seg ? "CURRENT"
                  : "UPCOMING",
        etaMin:     i <= seg ? null
                  : Math.round(etaMin + (s.timeMinutes - currentStop.timeMinutes)),
      })),
      lastUpdated:  new Date().toISOString(),
    });

  } catch (error) {
    console.error("Tracking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

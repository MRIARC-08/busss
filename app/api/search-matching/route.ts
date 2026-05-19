export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import fetch from "node-fetch";

// Simulated server-side cache
const routeCache = new Map();
const geocodeCache = new Map<string, { lat: number, lon: number } | null>();

async function getCoordinates(query: string): Promise<{ lat: number, lon: number } | null> {
  const clean = query.trim();
  if (!clean) return null;

  const key = clean.toLowerCase();
  if (geocodeCache.has(key)) return geocodeCache.get(key)!;

  const params = new URLSearchParams({
    format: "json",
    q: `${clean}, India`,
    limit: "1",
    countrycodes: "IN",
  });

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: { "User-Agent": "SmartBusNavigator/1.0" },
    });
    const data: any = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const coord = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
      geocodeCache.set(key, coord);
      return coord;
    }
    geocodeCache.set(key, null);
    return null;
  } catch {
    return null;
  }
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ success: false, error: "Missing origin or destination" }, { status: 400 });
  }

  // Guard: cannot search a route from a place to itself
  if (from.trim().toLowerCase() === to.trim().toLowerCase()) {
    return NextResponse.json({
      success: false,
      sameStop: true,
      error: "Origin and destination are the same. Please choose different stops.",
    }, { status: 400 });
  }

  const [fromCoord, toCoord] = await Promise.all([
    getCoordinates(from),
    getCoordinates(to),
  ]);

  if (!fromCoord || !toCoord) {
    const badPlace = !fromCoord ? from : to;
    return NextResponse.json({
      success: false,
      invalidLocation: true,
      field: !fromCoord ? "from" : "to",
      error: `We could not recognize "${badPlace}". Please enter a valid stop, sector, bus stand, or landmark.`,
    }, { status: 422 });
  }

  try {
    const API_KEY = process.env.DELHI_GTFS_API_KEY;
    if (!API_KEY) throw new Error("API Key Missing");

    const res = await fetch(`https://otd.delhi.gov.in/api/realtime/VehiclePositions.pb?key=${API_KEY}`, {
       headers: { "User-Agent": "SmartBusNavigator/1.0" }
    });
    
    const buffer = await res.arrayBuffer();
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
    
    const vehicles: any[] = [];
    if (feed && feed.entity) {
      feed.entity.forEach((entity: any) => {
        if (entity.vehicle?.position?.latitude && entity.vehicle?.position?.longitude) {
           vehicles.push({
             id: entity.vehicle.vehicle?.id,
             routeId: entity.vehicle.trip?.routeId,
             tripId: entity.vehicle.trip?.tripId,
             latitude: entity.vehicle.position.latitude,
             longitude: entity.vehicle.position.longitude,
             speed: entity.vehicle.position.speed,
             stopSequence: entity.vehicle.currentStopSequence,
             timestamp: entity.vehicle.timestamp?.low,
           });
        }
      });
    }

    // FALLBACK MOCK DATA: If the live GTFS feed is empty (e.g. late night), generate mock buses
    if (vehicles.length === 0) {
      for (let i = 0; i < 50; i++) {
        vehicles.push({
          id: `MOCK-${1000 + i}`,
          routeId: `ROUTE-${(i % 10) + 1}UP`,
          tripId: `TRIP-${2000 + i}`,
          latitude: 28.6 + (Math.random() * 0.1),
          longitude: 77.2 + (Math.random() * 0.1),
          speed: 15 + Math.random() * 30,
          stopSequence: Math.floor(Math.random() * 25),
          timestamp: Math.floor(Date.now() / 1000),
        });
      }
    }

    // GTFS PIPELINE MOCK: probabilistically filter a valid subset of live buses
    const seed = from.length + to.length;
    let matchedBuses = vehicles.filter((v, i) => i % (seed % 10 + 2) === 0).slice(0, 20);
    
    // ── Distance-based fare calculation ─────────────────────────────────────────
    const routeHash     = (from + to).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    
    // Calculate accurate straight-line distance, multiply by 1.2 to approximate road distance
    let distanceKm = Math.round(haversineKm(fromCoord.lat, fromCoord.lon, toCoord.lat, toCoord.lon) * 1.2);
    // Ensure minimum of 5km for short inner-city hops
    distanceKm = Math.max(5, distanceKm);
    
    // 1rs/km for NON-AC, 1.5rs/km for AC
    const baseRouteFare = distanceKm * 1;          
    const acFare        = Math.round(distanceKm * 1.5);
    
    // fromOffset: where the user's "from" stop sits in the route sequence
    const fromOffset    = (routeHash % 15) + 8;           // stable 8–22

    const processed = matchedBuses.map(v => {
       const currentSeq = v.stopSequence || 0;

       // Buses before fromOffset are still approaching; at/after have passed
       const status = currentSeq < fromOffset ? "upcoming" : "departed";

       const vehicleHash = (v.id || "x").split("").reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
       const isAC        = vehicleHash % 3 === 0;
       const occupancy   = (vehicleHash % 35) + 5;
       // ETA to the user's starting point. Keep approaching buses near enough
       // to feel actionable while still varying per vehicle.
       const etaToSource = status === "upcoming" ? (vehicleHash % 5) + 2 : 0;

       return {
         ...v,
         status,
         etaToSource,
         isAC,
         fare:    isAC ? acFare : baseRouteFare,
         seats:   45,
         occupancy,
       };
    });

    const upcoming = processed.filter(b => b.status === "upcoming").sort((a,b) => a.etaToSource - b.etaToSource);
    const departed = processed.filter(b => b.status === "departed").sort((a,b) => a.etaToSource - b.etaToSource);

    return NextResponse.json({ success: true, upcoming, departed });

  } catch(e: any) {
    console.error("Search Pipeline Error:", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

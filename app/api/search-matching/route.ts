export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import fetch from "node-fetch";

// Simulated server-side cache
const routeCache = new Map();

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

  try {
    const API_KEY = process.env.DELHI_GTFS_API_KEY;
    if (!API_KEY) throw new Error("API Key Missing");

    const res = await fetch(`https://otd.delhi.gov.in/api/realtime/VehiclePositions.pb?key=${API_KEY}`, {
       headers: { "User-Agent": "SmartBusNavigator/1.0" }
    });
    
    const buffer = await res.arrayBuffer();
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
    
    const vehicles: any[] = [];
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

    // GTFS PIPELINE MOCK: If we had a locally ingested `stop_times.txt` SQLite DB, we would do:
    // SELECT trip_id FROM stop_times s1 JOIN stop_times s2 ON s1.trip_id = s2.trip_id
    // WHERE s1.stop_id = :from AND s2.stop_id = :to AND s1.stop_sequence < s2.stop_sequence
    // Since we don't have the static DB, we probabilistically filter a valid subset of live buses.
    
    const seed = from.length + to.length;
    let matchedBuses = vehicles.filter((v, i) => i % (seed % 10 + 2) === 0).slice(0, 20);
    
    const processed = matchedBuses.map(v => {
       const currentSeq = v.stopSequence || Math.floor(Math.random() * 25);
       const fromOffset = Math.floor(Math.random() * 20) + 2; 
       const toOffset = fromOffset + Math.floor(Math.random() * 10) + 2;
       
       let status = "upcoming";
       if (currentSeq >= fromOffset) {
          status = "departed";
       }
       
       return {
         ...v,
         status,
         etaToSource: Math.abs(fromOffset - currentSeq) * 4, // mock 4 mins per stop interval
         isAC: Math.random() > 0.5,
         fare: Math.floor(Math.random() * 30) + 15,
         seats: 45,
         occupancy: Math.floor(Math.random() * 45)
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

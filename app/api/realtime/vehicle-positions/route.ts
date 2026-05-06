import { NextResponse } from "next/server";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import fetch from "node-fetch";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const API_KEY = process.env.DELHI_GTFS_API_KEY;
    if (!API_KEY) {
      throw new Error("DELHI_GTFS_API_KEY is not defined in environment variables");
    }
    const res = await fetch(`https://otd.delhi.gov.in/api/realtime/VehiclePositions.pb?key=${API_KEY}`);
    
    if (!res.ok) {
      throw new Error(`Failed to fetch GTFS data: ${res.status} ${res.statusText}`);
    }
    
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
        const text = await res.text();
        throw new Error(`GTFS API returned HTML instead of Protobuf buffer. Rate limit? (${text.substring(0, 50)})`);
    }
    
    const buffer = await res.arrayBuffer();
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
    
    // Convert to a neat frontend array
    const vehicles = feed.entity.map(entity => {
      return {
        id: entity.vehicle?.vehicle?.id,
        routeId: entity.vehicle?.trip?.routeId,
        tripId: entity.vehicle?.trip?.tripId,
        latitude: entity.vehicle?.position?.latitude,
        longitude: entity.vehicle?.position?.longitude,
        speed: entity.vehicle?.position?.speed,
        stopSequence: entity.vehicle?.currentStopSequence,
        timestamp: (entity.vehicle?.timestamp as any)?.low || entity.vehicle?.timestamp,
      };
    }).filter(v => v.latitude && v.longitude);
    
    return NextResponse.json({ success: true, count: vehicles.length, vehicles });
  } catch (error: any) {
    console.error("Error fetching vehicle positions:", error);
    return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
  }
}

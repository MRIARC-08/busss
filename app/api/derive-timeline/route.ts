export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import fetch from "node-fetch";

const cache = new Map<string, any>();

async function reverseGeocode(lon: number, lat: number) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "SmartBusNavigator/1.0" } });
    const data: any = await res.json();
    return data && data.name ? data.name : (data && data.address ? (data.address.suburb || data.address.town || data.address.city_district || "Highway Checkpoint") : "Transit Node");
  } catch(e) {
    return "Transit Node";
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const coords = searchParams.get("coords");
  
  if (!coords) return NextResponse.json({ success: false });
  if (cache.has(coords)) return NextResponse.json({ success: true, timeline: cache.get(coords) });

  try {
    // 1. Fetch geometry from OSRM
    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=simplified&geometries=geojson`);
    const data: any = await res.json();
    
    if (!data || data.code !== "Ok" || !data.routes || !data.routes.length) {
      throw new Error("OSRM Failed");
    }

    const duration = data.routes[0].duration; // in seconds
    const pts = data.routes[0].geometry.coordinates; // [lon, lat][]
    
    // Pick 4 evenly spaced physical checkpoints
    const indices = [
      Math.floor(pts.length * 0.25),
      Math.floor(pts.length * 0.50),
      Math.floor(pts.length * 0.75),
      pts.length - 1
    ];

    const timeline = [];
    const now = new Date();

    for (let i = 0; i < indices.length; i++) {
        const pt = pts[indices[i]];
        // Respect Nominatim rate limit
        await new Promise(resolve => setTimeout(resolve, 600));
        let name = await reverseGeocode(pt[0], pt[1]);
        
        // Ensure names are cleaner
        if (name.length > 25) name = name.substring(0, 25) + "...";

        // Calculate time proportional to segment
        const segmentSeconds = duration * ((i + 1) * 0.25);
        const time = new Date(now.getTime() + segmentSeconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        timeline.push({
            name,
            time,
            status: "upcoming"
        });
    }

    // Add current position
    timeline.unshift({
        name: "Current Tracking Node",
        time: now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        status: "current"
    });

    // Add a mocked past position for visual consistency
    timeline.unshift({
        name: "Origin Node",
        time: new Date(now.getTime() - 10 * 60000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        status: "passed"
    });

    cache.set(coords, timeline);

    return NextResponse.json({ success: true, timeline });

  } catch(e) {
    return NextResponse.json({ success: false });
  }
}

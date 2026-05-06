export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import fetch from "node-fetch";

// In-memory cache for development/prototype (resets on server restart)
const geometryCache = new Map<string, any>();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const coords = searchParams.get("coords");
  
  if (!coords) {
    return NextResponse.json({ success: false, error: "Missing coordinates" }, { status: 400 });
  }

  // Expecting format: lon1,lat1;lon2,lat2
  if (geometryCache.has(coords)) {
    return NextResponse.json({ success: true, geometry: geometryCache.get(coords), cached: true });
  }

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
    
    const res = await fetch(url, {
      headers: { "User-Agent": "SmartBusNavigator/1.0" }
    });
    
    const data: any = await res.json();
    
    if (data.code === "Ok" && data.routes && data.routes.length > 0) {
      const geometry = data.routes[0].geometry;
      // Cache the resulting geojson line geometry
      geometryCache.set(coords, geometry);
      return NextResponse.json({ success: true, geometry, cached: false });
    }
    
    return NextResponse.json({ success: false, error: "Routing engine failed" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

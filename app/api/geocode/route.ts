export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import fetch from "node-fetch";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  try {
    if (lat && lon) {
      // Reverse geocoding
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14`, {
        headers: { "User-Agent": "SmartBusNavigator/1.0" }
      });
      const data: any = await res.json();
      return NextResponse.json({ success: true, name: data.display_name });
    } else if (q) {
      // Forward geocoding
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&countrycodes=IN`, {
        headers: { "User-Agent": "SmartBusNavigator/1.0" }
      });
      const data: any = await res.json();
      if (data.length > 0) {
        return NextResponse.json({ success: true, lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), name: data[0].display_name });
      }
      return NextResponse.json({ success: false, error: "Not found" });
    }
    return NextResponse.json({ success: false, error: "Invalid parameters" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

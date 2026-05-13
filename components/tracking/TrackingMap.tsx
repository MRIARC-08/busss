"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

// ── Fix Leaflet default icon paths ────────────────────────────────────────────
if (typeof window !== "undefined") {
  const L = require("leaflet");
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

// ── Module-level cache keyed by "routeNumber:startIdx:endIdx" ────────────────
const routeGeometryCache = new Map<string, Array<{ lat: number; lon: number }>>();

// ── OSRM fetch with straight-line fallback ────────────────────────────────────
async function fetchRoadPath(
  stops: Array<{ latitude: number; longitude: number }>
): Promise<Array<{ lat: number; lon: number }>> {
  if (stops.length < 2) return stops.map(s => ({ lat: s.latitude, lon: s.longitude }));

  try {
    const coords = stops.map(s => `${s.longitude},${s.latitude}`).join(";");
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res  = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    const data = await res.json();

    if (data.code === "Ok" && data.routes?.[0]?.geometry?.coordinates?.length > 1) {
      return (data.routes[0].geometry.coordinates as [number, number][]).map(
        ([lon, lat]) => ({ lat, lon })
      );
    }
  } catch {
    // fall through to straight-line
  }

  return stops.map(s => ({ lat: s.latitude, lon: s.longitude }));
}

// ── Stop name fuzzy match ─────────────────────────────────────────────────────
function matchStop(stopName: string, query: string): boolean {
  if (!query) return false;
  const s = stopName.toLowerCase().trim();
  const q = query.toLowerCase().trim();
  return s === q || s.includes(q) || q.includes(s);
}

// ── Slice allStops to the fromStop→toStop segment ─────────────────────────────
function sliceStops(
  allStops: StopData[],
  fromStop?: string,
  toStop?: string
): { stops: StopData[]; startIdx: number; endIdx: number } {
  if (!fromStop && !toStop) {
    return { stops: allStops, startIdx: 0, endIdx: allStops.length - 1 };
  }

  let startIdx = fromStop
    ? allStops.findIndex(s => matchStop(s.stopName, fromStop))
    : -1;

  let endIdx = toStop
    ? allStops.findIndex(s => matchStop(s.stopName, toStop))
    : -1;

  // If from/to not found, fall back to whole route
  if (startIdx === -1) startIdx = 0;
  if (endIdx   === -1) endIdx   = allStops.length - 1;

  // Ensure correct order
  if (startIdx > endIdx) [startIdx, endIdx] = [endIdx, startIdx];

  return {
    stops:    allStops.slice(startIdx, endIdx + 1),
    startIdx,
    endIdx,
  };
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface StopData {
  stopName:      string;
  latitude:      number;
  longitude:     number;
  status:        "DEPARTED" | "CURRENT" | "UPCOMING";
  etaFromNowMin: number | null;
}

interface TrackingMapProps {
  position:    { lat: number; lon: number };
  busNumber:   string;
  busId?:      string | number;
  routeNumber: string;
  allStops:    StopData[];
  fromStop?:   string;
  toStop?:     string;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function TrackingMap({
  position,
  busNumber,
  routeNumber,
  allStops,
  fromStop,
  toStop,
}: TrackingMapProps) {
  const containerRef   = useRef<HTMLDivElement>(null);
  const mapRef         = useRef<any>(null);
  const markerRef      = useRef<any>(null);
  const polylineRef    = useRef<any>(null);
  const stopMarkersRef = useRef<any[]>([]);

  // ── Initialize Leaflet map ONCE ───────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const L   = require("leaflet");
    const map = L.map(containerRef.current, {
      center:       [position.lat, position.lon],
      zoom:         12,
      preferCanvas: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    const busIcon = L.divIcon({
      html: `<div style="
        background:#1d4ed8;color:white;border-radius:50%;
        width:36px;height:36px;display:flex;align-items:center;
        justify-content:center;font-size:18px;border:3px solid white;
        box-shadow:0 2px 12px rgba(0,0,0,0.4);
        transform:translate(-50%,-50%);">🚌</div>`,
      iconSize:   [36, 36],
      iconAnchor: [18, 18],
      className:  "",
    });

    markerRef.current = L.marker([position.lat, position.lon], {
      icon: busIcon,
      zIndexOffset: 1000,
    })
      .bindPopup(`<strong>Bus ${busNumber}</strong>`)
      .addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current         = null;
      markerRef.current      = null;
      polylineRef.current    = null;
      stopMarkersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Draw sliced route when selection or stops change ─────────────────────
  useEffect(() => {
    if (!mapRef.current || !allStops || allStops.length < 2) return;
    const L = require("leaflet");

    const { stops: slicedStops, startIdx, endIdx } = sliceStops(allStops, fromStop, toStop);
    const cacheKey = `${routeNumber}:${startIdx}:${endIdx}`;

    // Remove old stop markers
    stopMarkersRef.current.forEach(m => { try { m.remove(); } catch {} });
    stopMarkersRef.current = [];

    // Draw stop circle markers only for the sliced segment
    slicedStops.forEach(stop => {
      if (!stop.latitude || !stop.longitude) return;
      const isDeparted  = stop.status === "DEPARTED";
      const isCurrent   = stop.status === "CURRENT";
      const fillColor   = isDeparted ? "#9ca3af" : isCurrent ? "#1d4ed8" : "#ffffff";
      const color       = isDeparted ? "#6b7280" : "#1d4ed8";
      const radius      = isCurrent ? 8 : isDeparted ? 4 : 5;
      const fillOpacity = isDeparted ? 0.7 : 1;

      const cm = L.circleMarker([stop.latitude, stop.longitude], {
        radius, fillColor, color, weight: 2, opacity: 1, fillOpacity,
      }).bindPopup(
        `<div style="font-size:12px;min-width:120px">
          <strong>${stop.stopName}</strong>
          <div style="color:#6b7280;font-size:10px;text-transform:uppercase;margin-top:2px">${stop.status}</div>
          ${stop.etaFromNowMin != null
            ? `<div style="color:#1d4ed8;font-size:11px;margin-top:2px">ETA: ${stop.etaFromNowMin} min</div>`
            : ""}
        </div>`
      ).addTo(mapRef.current);
      stopMarkersRef.current.push(cm);
    });

    // Draw road polyline for sliced segment
    async function drawRoute() {
      let pathCoords: Array<{ lat: number; lon: number }>;

      if (routeGeometryCache.has(cacheKey)) {
        pathCoords = routeGeometryCache.get(cacheKey)!;
      } else {
        pathCoords = await fetchRoadPath(slicedStops);
        routeGeometryCache.set(cacheKey, pathCoords);
      }

      if (!mapRef.current) return;

      if (polylineRef.current) {
        polylineRef.current.remove();
        polylineRef.current = null;
      }

      if (pathCoords.length > 1) {
        polylineRef.current = L.polyline(
          pathCoords.map(p => [p.lat, p.lon] as [number, number]),
          { color: "#1d4ed8", weight: 4, opacity: 0.85, lineJoin: "round" }
        ).addTo(mapRef.current);

        try {
          const b = polylineRef.current.getBounds();
          if (b.isValid()) mapRef.current.fitBounds(b, { padding: [40, 40] });
        } catch {}
      }
    }

    drawRoute();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeNumber, fromStop, toStop, allStops]);

  // ── Update bus marker position on every poll tick ─────────────────────────
  useEffect(() => {
    if (!markerRef.current) return;
    markerRef.current.setLatLng([position.lat, position.lon]);

    if (mapRef.current) {
      try {
        const bounds = mapRef.current.getBounds();
        if (!bounds.contains([position.lat, position.lon])) {
          mapRef.current.panTo([position.lat, position.lon], { animate: true, duration: 1 });
        }
      } catch {}
    }
  }, [position.lat, position.lon]);

  return (
    <div
      ref={containerRef}
      style={{ height: "320px", width: "100%" }}
      className="rounded-xl overflow-hidden"
    />
  );
}

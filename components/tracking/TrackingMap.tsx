"use client";

import { useEffect, useRef, useCallback } from "react";
import "leaflet/dist/leaflet.css";

if (typeof window !== "undefined") {
  const L = require("leaflet");
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

// ── Cache: routeNumber:startIdx:endIdx → road geometry ───────────────────────
const routeGeometryCache = new Map<string, [number, number][]>();

// ── OSRM road path ─────────────────────────────────────────────────────────────
async function fetchRoadPath(
  stops: Array<{ latitude: number; longitude: number }>
): Promise<[number, number][]> {
  if (stops.length < 2)
    return stops.map(s => [s.latitude, s.longitude] as [number, number]);

  try {
    const coords = stops.map(s => `${s.longitude},${s.latitude}`).join(";");
    const ctrl   = new AbortController();
    const timer  = setTimeout(() => ctrl.abort(), 7000);
    const res    = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`,
      { signal: ctrl.signal }
    );
    clearTimeout(timer);
    const data = await res.json();
    if (data.code === "Ok" && data.routes?.[0]?.geometry?.coordinates?.length > 1) {
      return (data.routes[0].geometry.coordinates as [number, number][]).map(
        ([lon, lat]) => [lat, lon] as [number, number]
      );
    }
  } catch { /* fall through */ }

  // straight-line fallback
  return stops.map(s => [s.latitude, s.longitude] as [number, number]);
}

// ── Snap a lat/lon to the nearest point on the polyline ──────────────────────
function snapToPolyline(
  lat: number, lon: number,
  path: [number, number][]
): [number, number] {
  if (path.length === 0) return [lat, lon];
  if (path.length === 1) return path[0];

  let bestDist = Infinity;
  let bestPt: [number, number] = path[0];

  for (let i = 0; i < path.length - 1; i++) {
    const [ax, ay] = path[i];
    const [bx, by] = path[i + 1];
    const dx = bx - ax, dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) continue;
    const t = Math.max(0, Math.min(1, ((lat - ax) * dx + (lon - ay) * dy) / lenSq));
    const px = ax + t * dx, py = ay + t * dy;
    const d  = (lat - px) ** 2 + (lon - py) ** 2;
    if (d < bestDist) { bestDist = d; bestPt = [px, py]; }
  }
  return bestPt;
}

// ── Types ─────────────────────────────────────────────────────────────────────
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
}: TrackingMapProps) {
  const containerRef   = useRef<HTMLDivElement>(null);
  const wrapperRef     = useRef<HTMLDivElement>(null);
  const mapRef         = useRef<any>(null);
  const markerRef      = useRef<any>(null);
  const polylineRef    = useRef<any>(null);
  const stopMarkersRef = useRef<any[]>([]);
  // stores the full OSRM path so we can snap the bus to it
  const roadPathRef    = useRef<[number, number][]>([]);
  // true after first fitBounds — prevents auto-zoom on every 4s poll
  const routeDrawnRef  = useRef<boolean>(false);
  // stores latest snapped position for the locate button
  const snappedPosRef  = useRef<[number, number]>([position.lat, position.lon]);

  // ── Init map once ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const L   = require("leaflet");
    const map = L.map(containerRef.current, {
      center:       [position.lat, position.lon],
      zoom:         13,
      preferCanvas: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    const busIcon = L.divIcon({
      html: `<div style="
        background:#1d4ed8;color:white;border-radius:50%;
        width:38px;height:38px;display:flex;align-items:center;
        justify-content:center;font-size:20px;border:3px solid white;
        box-shadow:0 2px 14px rgba(0,0,0,0.45);
        transform:translate(-50%,-50%);">🚌</div>`,
      iconSize:   [38, 38],
      iconAnchor: [19, 19],
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
      roadPathRef.current    = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Draw route + stop markers when allStops changes ──────────────────────
  useEffect(() => {
    if (!mapRef.current || !allStops || allStops.length < 1) return;
    const L        = require("leaflet");
    const cacheKey = `${routeNumber}:${allStops.length}`;

    // Rebuild stop markers
    stopMarkersRef.current.forEach(m => { try { m.remove(); } catch {} });
    stopMarkersRef.current = [];

    allStops.forEach(stop => {
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

    // Fetch or use cached road path
    async function drawRoute() {
      let path: [number, number][];

      if (routeGeometryCache.has(cacheKey)) {
        path = routeGeometryCache.get(cacheKey)!;
      } else {
        path = await fetchRoadPath(allStops);
        routeGeometryCache.set(cacheKey, path);
      }

      if (!mapRef.current) return;
      roadPathRef.current = path;

      // Snap bus to road immediately
      const snapped = path.length > 1
        ? snapToPolyline(position.lat, position.lon, path)
        : [position.lat, position.lon] as [number, number];
      snappedPosRef.current = snapped;
      if (markerRef.current) markerRef.current.setLatLng(snapped);

      // Redraw polyline
      if (polylineRef.current) { polylineRef.current.remove(); polylineRef.current = null; }
      if (path.length > 1) {
        polylineRef.current = L.polyline(path, {
          color: "#1d4ed8", weight: 5, opacity: 0.85, lineJoin: "round",
        }).addTo(mapRef.current);

        // Only fit bounds on first draw — never auto-zoom after that
        if (!routeDrawnRef.current) {
          try {
            const b = polylineRef.current.getBounds();
            if (b.isValid()) mapRef.current.fitBounds(b, { padding: [48, 48] });
            routeDrawnRef.current = true;
          } catch {}
        }
      }
    }

    drawRoute();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeNumber, allStops]);

  // ── Snap bus marker on every position poll (NO auto-pan) ─────────────────
  useEffect(() => {
    if (!markerRef.current) return;
    const road    = roadPathRef.current;
    const snapped = road.length > 1
      ? snapToPolyline(position.lat, position.lon, road)
      : [position.lat, position.lon] as [number, number];
    snappedPosRef.current = snapped;
    markerRef.current.setLatLng(snapped);
    // ✅ No auto-pan — user controls the viewport
  }, [position.lat, position.lon]);

  // ── Locate bus button ─────────────────────────────────────────────────────
  const locateBus = useCallback(() => {
    if (!mapRef.current) return;
    mapRef.current.flyTo(snappedPosRef.current, 14, { animate: true, duration: 0.8 });
  }, []);

  return (
    <div ref={wrapperRef}
      style={{ position: "relative", height: "320px", width: "100%", isolation: "isolate" }}
      className="rounded-xl overflow-hidden">
      {/* Map container */}
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />

      {/* 🎯 Locate bus button — always on top */}
      <button
        onClick={locateBus}
        title="Locate bus"
        style={{ position: "absolute", bottom: 12, right: 12, zIndex: 1000 }}
        className="flex items-center gap-1.5 bg-white border border-gray-200 shadow-lg rounded-xl px-3 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50 active:scale-95 transition-all"
      >
        <span style={{ fontSize: 16 }}>🎯</span> Locate Bus
      </button>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
const L = typeof window !== "undefined" ? require("leaflet") : null;
import "leaflet/dist/leaflet.css";
import { Navigation2, Activity, MapPin, X, Loader2 } from "lucide-react";
import Draggable from "react-draggable";

const DEFAULT_RADIUS_KM = 5;
const MIN_RADIUS_KM = 1;
const MAX_RADIUS_KM = 30;

const DELHI_REGIONS = [
  { name: "Central Delhi", lat: 28.6448, lon: 77.2167 },
  { name: "North Delhi", lat: 28.6833, lon: 77.2167 },
  { name: "South Delhi", lat: 28.4965, lon: 77.2526 },
  { name: "East Delhi", lat: 28.6258, lon: 77.3020 },
  { name: "West Delhi", lat: 28.6520, lon: 77.0620 },
  { name: "New Delhi", lat: 28.6139, lon: 77.2090 },
];

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

export default function LiveMapTab() {
  const router = useRouter();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [regionMode, setRegionMode] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [selectedRegion, setSelectedRegion] = useState("");
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userLayerRef = useRef<L.LayerGroup | null>(null);

  const nearbyVehicles = userLocation
    ? vehicles
        .map(v => ({
          ...v,
          distanceKm: haversineKm(userLocation.lat, userLocation.lon, v.latitude, v.longitude),
        }))
        .filter(v => v.distanceKm <= radiusKm)
        .sort((a, b) => a.distanceKm - b.distanceKm)
    : [];
  const visibleVehicles = regionMode ? nearbyVehicles : vehicles;

  useEffect(() => {
    async function fetchRealtime() {
      try {
        const res = await fetch("/api/realtime/vehicle-positions");
        const data = await res.json();
        if (data.success && data.vehicles) {
          setVehicles(data.vehicles);
          setLoading(false);
        }
      } catch (e) {
        console.error("Failed to fetch real-time GTFS");
      }
    }
    
    fetchRealtime();
    const interval = setInterval(fetchRealtime, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = L.map(mapContainer.current, {
      preferCanvas: true,
      center: [28.6139, 77.2090], // Heart of Delhi
      zoom: 11,
      zoomControl: true
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution: '&copy; <a href="https://carto.com/">CartoDB</a>',
        subdomains: 'abcd',
        maxZoom: 19
      }
    ).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    userLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    // Efficiently wipe and redraw on the canvas
    markersLayerRef.current.clearLayers();

    visibleVehicles.forEach(v => {
      if (!v.longitude || !v.latitude) return;
      
      const routeNum = v.routeId ? String(v.routeId).replace(/(up|down)/i, '') : "N/A";
      const direction = String(v.routeId).match(/up/i) ? 'UP' : String(v.routeId).match(/down/i) ? 'DOWN' : 'LIVE';
      
      const tooltipContent = `
        <div style="font-family: inherit; min-width: 150px; padding: 2px;">
          <div style="font-weight: 800; font-size: 14px; border-bottom: 2px solid #ff5722; padding-bottom: 6px; margin-bottom: 6px; display: flex; justify-content: space-between;">
            <span>🚌 ${v.id || "Unknown"}</span>
            <span style="background: #ff5722; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px;">${direction}</span>
          </div>
          <div style="font-size: 12px; margin-bottom: 4px; display: flex; justify-content: space-between;">
            <span style="color: #666;">Route Number:</span> 
            <strong style="color: #111;">${routeNum}</strong>
          </div>
          <div style="font-size: 12px; margin-bottom: 4px; display: flex; justify-content: space-between;">
            <span style="color: #666;">Speed:</span> 
            <strong style="color: #111;">${v.speed ? Math.round(v.speed * 3.6) + " km/h" : "Moving"}</strong>
          </div>
          ${v.distanceKm != null
            ? `<div style="font-size: 12px; margin-bottom: 4px; display: flex; justify-content: space-between;">
                <span style="color: #666;">Distance:</span>
                <strong style="color: #111;">${v.distanceKm.toFixed(2)} km</strong>
              </div>`
            : ""}
          <div style="font-size: 11px; color: #888; margin-top: 8px; border-top: 1px solid #eee; padding-top: 4px;">
            📍 Pos: ${v.latitude.toFixed(4)}, ${v.longitude.toFixed(4)}
          </div>
        </div>
      `;

      const marker = L.circleMarker([v.latitude, v.longitude], {
        radius: 4,
        fillColor: "#ff5722",
        color: "#ff5722",
        weight: 1,
        opacity: 0.9,
        fillOpacity: 0.9
      }).bindTooltip(tooltipContent, {
        direction: 'top',
        offset: [0, -10],
        opacity: 1
      });

      markersLayerRef.current?.addLayer(marker);
    });

  }, [visibleVehicles]);

  useEffect(() => {
    if (!mapRef.current || !userLayerRef.current) return;

    userLayerRef.current.clearLayers();
    if (!regionMode || !userLocation) return;

    const userMarker = L.circleMarker([userLocation.lat, userLocation.lon], {
      radius: 8,
      fillColor: "#2563eb",
      color: "#ffffff",
      weight: 3,
      opacity: 1,
      fillOpacity: 1,
    }).bindTooltip("Region Center", {
      direction: "top",
      offset: [0, -10],
      opacity: 1,
    });

    const radiusCircle = L.circle([userLocation.lat, userLocation.lon], {
      radius: radiusKm * 1000,
      color: "#60a5fa",
      fillColor: "#2563eb",
      weight: 2,
      opacity: 0.85,
      fillOpacity: 0.12,
    });

    userLayerRef.current.addLayer(radiusCircle);
    userLayerRef.current.addLayer(userMarker);
  }, [regionMode, radiusKm, userLocation]);

  function updateRadius(value: string) {
    const next = Number(value);
    if (!Number.isFinite(next)) return;
    setRadiusKm(Math.min(MAX_RADIUS_KM, Math.max(MIN_RADIUS_KM, next)));
  }

  function handleRegionSelect(regionName: string) {
    if (!regionName) {
      setRegionMode(false);
      setSelectedRegion("");
      userLayerRef.current?.clearLayers();
      mapRef.current?.flyTo([28.6139, 77.2090], 11, { animate: true, duration: 0.8 });
      return;
    }

    const reg = DELHI_REGIONS.find(r => r.name === regionName);
    if (reg) {
      setSelectedRegion(regionName);
      setUserLocation({ lat: reg.lat, lon: reg.lon });
      setRegionMode(true);
      mapRef.current?.flyTo([reg.lat, reg.lon], 12, {
        animate: true,
        duration: 0.8,
      });
    }
  }

  return (
    <div className="relative isolate w-full h-[calc(100vh-140px)] bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
      {/* Stats Overlay */}
      <Draggable handle=".drag-handle">
        <div className="absolute top-6 left-6 z-[1200] w-[min(360px,calc(100vw-48px))] bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl shadow-2xl">
          <h1 className="text-white font-bold text-xl flex items-center gap-2 drag-handle cursor-move pb-1 border-b border-white/10 select-none">
            <Activity className="h-5 w-5 text-orange-400" />
            Live Delhi GTFS Network
          </h1>
          <p className="text-gray-300 text-sm mt-3 mb-3">Monitoring active vehicles directly from Delhi OTD Protobuf feeds</p>
        
        <div className="flex items-center gap-3 bg-black/40 p-3 rounded-lg border border-white/10">
          <div className="flex items-center justify-center h-10 w-10 bg-orange-500/20 rounded-full">
            <Navigation2 className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <div className="text-white text-2xl font-black">
              {loading ? "..." : regionMode ? nearbyVehicles.length : vehicles.length}
            </div>
            <div className="text-gray-400 text-xs uppercase tracking-wider font-bold">
              {regionMode ? `Buses in ${selectedRegion} (${radiusKm}km)` : "Total Active Buses"}
            </div>
          </div>
        </div>

        <label className="mt-4 block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Select Region</span>
          <select 
            value={selectedRegion} 
            onChange={(e) => handleRegionSelect(e.target.value)}
            className="mt-1 w-full bg-black/40 border border-white/20 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
          >
            <option value="">All of Delhi</option>
            {DELHI_REGIONS.map(r => (
              <option key={r.name} value={r.name}>{r.name}</option>
            ))}
          </select>
        </label>

        {regionMode && (
          <label className="mt-3 block">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Region Scan Radius</span>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="range"
                min={MIN_RADIUS_KM}
                max={MAX_RADIUS_KM}
                step="0.5"
                value={radiusKm}
                onChange={e => updateRadius(e.target.value)}
                className="min-w-0 flex-1 accent-orange-500"
              />
              <div className="flex h-10 w-24 items-center rounded-lg border border-white/15 bg-black/30 px-2">
                <input
                  type="number"
                  min={MIN_RADIUS_KM}
                  max={MAX_RADIUS_KM}
                  step="0.5"
                  value={radiusKm}
                  onChange={e => updateRadius(e.target.value)}
                  className="w-full bg-transparent text-right text-sm font-black text-white outline-none"
                />
                <span className="ml-1 text-xs font-bold text-gray-300">km</span>
              </div>
            </div>
          </label>
        )}
      </div>
      </Draggable>

      <div ref={mapContainer} className="relative z-0 w-full h-full" />
    </div>
  );
}

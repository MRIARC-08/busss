"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Navigation2, Activity } from "lucide-react";

export default function LiveMapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

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

    vehicles.forEach(v => {
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

  }, [vehicles]);

  return (
    <div className="relative w-full h-[calc(100vh-64px)] bg-gray-900">
      {/* Stats Overlay */}
      <div className="absolute top-6 left-6 z-10 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl shadow-2xl">
        <h1 className="text-white font-bold text-xl flex items-center gap-2">
          <Activity className="h-5 w-5 text-orange-400" />
          Live Delhi GTFS Network
        </h1>
        <p className="text-gray-300 text-sm mt-1 mb-3">Monitoring active vehicles directly from Delhi OTD Protobuf feeds</p>
        
        <div className="flex items-center gap-3 bg-black/40 p-3 rounded-lg border border-white/10">
          <div className="flex items-center justify-center h-10 w-10 bg-orange-500/20 rounded-full">
            <Navigation2 className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <div className="text-white text-2xl font-black">{loading ? "..." : vehicles.length}</div>
            <div className="text-gray-400 text-xs uppercase tracking-wider font-bold">Active Buses</div>
          </div>
        </div>
      </div>

      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}

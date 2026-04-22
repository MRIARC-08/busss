"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface Props {
  position?: { lat: number; lon: number };
  busNumber?: string;
  stops?: any[];
  routeStops?: any[];
}

export default function TrackingMap({ position, busNumber }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const markersRef = useRef<{ [id: string]: mapboxgl.Marker }>({});

  useEffect(() => {
    async function fetchRealtime() {
      try {
        const res = await fetch("/api/realtime/vehicle-positions");
        const data = await res.json();
        if (data.success && data.vehicles) {
          setVehicles(data.vehicles);
        }
      } catch (e) {
        console.error("Failed to fetch real-time GTFS");
      }
    }
    
    fetchRealtime();
    const interval = setInterval(fetchRealtime, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // We provide a dummy token to bypass the token check since we use free OSM raster tiles.
    mapboxgl.accessToken = "pk.eyJ1IjoiZHVtbXkiLCJhIjoiY2xwMGx2czI2MHQzbTJxbmIzMm5zbm4yayJ9.dummy";

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm",
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: position && position.lat ? [position.lon, position.lat] : [77.1025, 28.7041], // Default Delhi
      zoom: 12,
    });
    
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Real-Time Markers
  useEffect(() => {
    if (!mapRef.current) return;

    // 1. Maintain active incoming real-time buses
    const activeIds = new Set<string>();

    vehicles.forEach(v => {
      if (!v.longitude || !v.latitude) return;
      const id = v.id || v.tripId || Math.random().toString();
      activeIds.add(id);
      
      let marker = markersRef.current[id];
      if (!marker) {
        const el = document.createElement("div");
        el.innerHTML = "🚌";
        el.style.fontSize = "16px";
        el.style.background = "#fb792b";
        el.style.borderRadius = "50%";
        el.style.width = "28px";
        el.style.height = "28px";
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";
        el.style.border = "2px solid white";
        el.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
        el.title = `Bus: ${v.id} | Route: ${v.routeId}`;

        marker = new mapboxgl.Marker(el)
          .setLngLat([v.longitude, v.latitude])
          .addTo(mapRef.current!);
        
        markersRef.current[id] = marker;
      } else {
        marker.setLngLat([v.longitude, v.latitude]);
      }
    });

    // Cleanup stale markers out of range
    Object.keys(markersRef.current).forEach(id => {
      if (id !== "tracked-dummy" && !activeIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

  }, [vehicles]);

  // Handle tracked dummy bus explicitly
  useEffect(() => {
    if (mapRef.current && position && position.lat && position.lon) {
      let marker = markersRef.current["tracked-dummy"];
      if (!marker) {
        const el = document.createElement("div");
        el.innerHTML = "🎯";
        el.style.fontSize = "20px";
        el.style.background = "#213d77";
        el.style.borderRadius = "50%";
        el.style.width = "32px";
        el.style.height = "32px";
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";
        el.style.border = "2px solid white";
        el.style.boxShadow = "0 4px 8px rgba(0,0,0,0.4)";
        el.style.zIndex = "100";

        marker = new mapboxgl.Marker(el)
          .setLngLat([position.lon, position.lat])
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<strong>Tracked Bus ${busNumber}</strong>`))
          .addTo(mapRef.current);
        
        markersRef.current["tracked-dummy"] = marker;
      } else {
        marker.setLngLat([position.lon, position.lat]);
      }
      
      // Keep center gracefully centered on the tracked bus
      mapRef.current.panTo([position.lon, position.lat]);
    }
  }, [position, busNumber]);

  return <div ref={mapContainer} className="w-full h-full min-h-[300px]" />;
}

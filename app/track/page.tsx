"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense, useRef } from "react";
import { Loader2, Info, MapPin } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ─── Geometry helper ──────────────────────────────────────────────────────────
function sqr(x: number) { return x * x; }
function dist2(v: { lat: number; lon: number }, w: { lat: number; lon: number }) {
  return sqr(v.lon - w.lon) + sqr(v.lat - w.lat);
}
function distToSegSq(
  p: { lat: number; lon: number },
  v: { lat: number; lon: number },
  w: { lat: number; lon: number }
) {
  const l2 = dist2(v, w);
  if (l2 === 0) return dist2(p, v);
  let t = ((p.lon - v.lon) * (w.lon - v.lon) + (p.lat - v.lat) * (w.lat - v.lat)) / l2;
  t = Math.max(0, Math.min(1, t));
  return dist2(p, { lon: v.lon + t * (w.lon - v.lon), lat: v.lat + t * (w.lat - v.lat) });
}
function isOnCorridor(
  p: { lat: number; lon: number },
  v: { lat: number; lon: number },
  w: { lat: number; lon: number }
) {
  return Math.sqrt(distToSegSq(p, v, w)) < 0.04;
}

// ─── Stop marker helper ───────────────────────────────────────────────────────
function renderStopMarkers(stops: any[], layer: L.LayerGroup) {
  stops.forEach((st) => {
    if (!st.lat || !st.lon) return;
    const fill =
      st.status === "passed" ? "#9ca3af" : st.status === "current" ? "#3b82f6" : "#22c55e";
    L.circleMarker([st.lat, st.lon], {
      radius: st.status === "current" ? 8 : 5,
      fillColor: fill,
      color: "#fff",
      weight: st.status === "current" ? 2 : 1,
      opacity: 1,
      fillOpacity: 0.95,
      zIndexOffset: st.status === "current" ? 500 : 0,
    })
      .bindTooltip(
        '<div style="font-family:inherit;font-size:12px">' +
          '<span style="font-size:9px;text-transform:uppercase;color:#888;display:block">' +
          st.status +
          "</span>" +
          "<strong>" +
          st.name +
          "</strong></div>"
      )
      .addTo(layer);
  });
}

// ─── Main component ───────────────────────────────────────────────────────────
function TrackContent() {
  const params = useSearchParams();
  const fromQuery = params.get("from") || "";
  const toQuery = params.get("to") || "";
  const initialBusId = params.get("busId");

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [geoPoints, setGeoPoints] = useState<{ from?: any; to?: any }>({});
  const [loading, setLoading] = useState(true);
  const [selectedBus, setSelectedBus] = useState<any>(null);
  const [busHistory, setBusHistory] = useState<Record<string, { lat: number; lon: number }[]>>({});

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const activeMarkersRef = useRef<{ [id: string]: L.Marker }>({});
  const pathLayerRef = useRef<L.LayerGroup | null>(null);
  const selectedBusPathRef = useRef<L.LayerGroup | null>(null);
  const stopsLayerRef = useRef<L.LayerGroup | null>(null);

  // ── Geocode source + destination ───────────────────────────────────────────
  useEffect(() => {
    if (!fromQuery || !toQuery) return;
    (async () => {
      try {
        const f = await fetch("/api/geocode?q=" + encodeURIComponent(fromQuery));
        const fd = await f.json();
        await new Promise((r) => setTimeout(r, 500));
        const t = await fetch("/api/geocode?q=" + encodeURIComponent(toQuery));
        const td = await t.json();
        setGeoPoints({
          from: fd.success ? { lat: fd.lat, lon: fd.lon } : null,
          to: td.success ? { lat: td.lat, lon: td.lon } : null,
        });
      } catch (_) {}
    })();
  }, [fromQuery, toQuery]);

  // ── Live GTFS feed ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch("/api/realtime/vehicle-positions");
        const data = await res.json();
        if (!data.success) return;

        setVehicles(data.vehicles);

        setBusHistory((prev) => {
          const next = { ...prev };
          data.vehicles.forEach((v: any) => {
            if (!v.latitude || !v.longitude) return;
            const id = v.id || v.tripId;
            if (!id) return;
            if (!next[id]) next[id] = [];
            const last = next[id][next[id].length - 1];
            if (!last || last.lat !== v.latitude || last.lon !== v.longitude) {
              next[id] = [...next[id], { lat: v.latitude, lon: v.longitude }].slice(-50);
            }
          });
          return next;
        });

        // Auto-select bus from deep-link
        if (initialBusId) {
          const target = data.vehicles.find(
            (v: any) => v.id === initialBusId || v.tripId === initialBusId
          );
          if (target) {
            setTimeout(() => {
              const routeNum = target.routeId
                ? String(target.routeId).replace(/(up|down)/i, "")
                : "N/A";
              const direction = /up/i.test(String(target.routeId))
                ? "UP"
                : /down/i.test(String(target.routeId))
                ? "DOWN"
                : "ACTIVE";
              setSelectedBus((prev: any) =>
                prev?.id === target.id
                  ? prev
                  : {
                      ...target,
                      routeNum,
                      direction,
                      address: "Pinpointing satellite location...",
                      addressLoaded: false,
                      timelineLoaded: false,
                      timeline: [
                        { status: "passed", time: "--:--", name: "Initializing..." },
                        { status: "current", time: "--:--", name: "Locating bus..." },
                      ],
                      seats: { total: 45, occupied: 15 },
                    }
              );
            }, 500);
          }
        }
      } catch (_) {}
      finally { setLoading(false); }
    };
    fetch_();
    const id = setInterval(fetch_, 5000);
    return () => clearInterval(id);
  }, []);

  // ── Corridor filter ───────────────────────────────────────────────────────
  const filteredVehicles =
    geoPoints.from && geoPoints.to
      ? vehicles.filter((v) =>
          isOnCorridor({ lat: v.latitude, lon: v.longitude }, geoPoints.from, geoPoints.to)
        )
      : vehicles;

  // ── Init map ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainer.current || mapRef.current || loading) return;
    const map = L.map(mapContainer.current, {
      preferCanvas: true,
      center: [28.6139, 77.209],
      zoom: 10,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; CartoDB",
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [loading]);

  // ── Base route corridor (blue) ────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !geoPoints.from || !geoPoints.to) return;
    if (pathLayerRef.current) mapRef.current.removeLayer(pathLayerRef.current);

    (async () => {
      try {
        const coords = `${geoPoints.from.lon},${geoPoints.from.lat};${geoPoints.to.lon},${geoPoints.to.lat}`;
        const res = await fetch("/api/route-geometry?coords=" + coords);
        const d = await res.json();
        if (d.success && d.geometry) {
          const geo = L.geoJSON(d.geometry, {
            style: { color: "rgba(56,189,248,0.8)", weight: 6, opacity: 0.9, lineJoin: "round" },
          });
          const grp = L.layerGroup([geo]);
          grp.addLayer(
            L.circleMarker([geoPoints.from.lat, geoPoints.from.lon], {
              color: "white", fillColor: "#fb792b", weight: 3, opacity: 1, fillOpacity: 1, radius: 8,
            })
          );
          grp.addLayer(
            L.circleMarker([geoPoints.to.lat, geoPoints.to.lon], {
              color: "white", fillColor: "#10b981", weight: 3, opacity: 1, fillOpacity: 1, radius: 8,
            })
          );
          grp.addTo(mapRef.current!);
          pathLayerRef.current = grp;
          mapRef.current!.fitBounds(geo.getBounds(), { padding: [50, 50] });
        }
      } catch (_) {}
    })();
  }, [geoPoints]);

  // ── Selected bus: green trail + OSRM geometry + stop circles ─────────────
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear previous selection layer
    if (selectedBusPathRef.current) {
      mapRef.current.removeLayer(selectedBusPathRef.current);
      selectedBusPathRef.current = null;
    }

    // Nothing selected → restore corridor, clear dots
    if (!selectedBus) {
      pathLayerRef.current?.eachLayer((l: any) => {
        try { l.setStyle?.({ opacity: 0.9, fillOpacity: 1 }); } catch (_) {}
      });
      stopsLayerRef.current?.clearLayers();
      return;
    }

    // Hide blue corridor completely to remove visual clutter when tracking a specific route
    pathLayerRef.current?.eachLayer((l: any) => {
      try { l.setStyle?.({ opacity: 0, fillOpacity: 0 }); } catch (_) {}
    });

    const group = L.layerGroup();

    // 1. Breadcrumb trail (historic path)
    // Style: Faint, dashed line to represent "past / completed"
    const hist = busHistory[selectedBus.id];
    if (hist && hist.length > 1) {
      L.polyline(
        hist.map((p) => [p.lat, p.lon] as [number, number]),
        { color: "#9ca3af", weight: 4, dashArray: "5, 10", lineCap: "round" }
      ).addTo(group);
    }

    // OSRM road geometry + stops
    if (geoPoints.to) {
      (async () => {
        try {
          const coords =
            `${selectedBus.longitude},${selectedBus.latitude}` +
            `;${geoPoints.to.lon},${geoPoints.to.lat}`;

          // Active future track (Dynamic OSRM)
          // Style: Vibrant brand blue to indicate active focus
          const geoRes = await fetch("/api/route-geometry?coords=" + coords);
          const geoData = await geoRes.json();
          if (geoData.success && geoData.geometry) {
            L.geoJSON(geoData.geometry, { style: { color: "#38bdf8", weight: 6, opacity: 1, lineJoin: "round" } }).addTo(group);
          }

          // Stops layer
          if (!stopsLayerRef.current) {
            stopsLayerRef.current = L.layerGroup().addTo(mapRef.current!);
          }
          stopsLayerRef.current.clearLayers();

          if (!selectedBus.timelineLoaded) {
            const stopsRes = await fetch(
              "/api/gtfs-stops" +
                "?tripId=" + encodeURIComponent(selectedBus.tripId || selectedBus.id) +
                "&lat=" + selectedBus.latitude +
                "&lon=" + selectedBus.longitude +
                "&stopSequence=" + (selectedBus.stopSequence || 0) +
                "&from=" + encodeURIComponent(fromQuery) +
                "&to=" + encodeURIComponent(toQuery)
            );
            const td = await stopsRes.json();

            if (td.success && td.stops) {
              const now = new Date();
              const mapped: any[] = td.stops.map((st: any, i: number) => {
                let t = "--:--";
                if (st.status === "passed")
                  t = new Date(now.getTime() - (td.stops.length - i) * 60000).toLocaleTimeString([], {
                    hour: "2-digit", minute: "2-digit",
                  });
                if (st.status === "current")
                  t = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                if (st.status === "upcoming")
                  t = new Date(now.getTime() + i * 3 * 60000).toLocaleTimeString([], {
                    hour: "2-digit", minute: "2-digit",
                  });
                return { ...st, time: t };
              });

              setSelectedBus((prev: any) => ({ ...prev, timelineLoaded: true, timeline: mapped }));

              // Render map circles so the road doesn't look barren
              renderStopMarkers(mapped, stopsLayerRef.current!);

              // Zoom to segment
              if (td.segmentBounds?.from && td.segmentBounds?.to && mapRef.current) {
                const { from: sf, to: sd } = td.segmentBounds;
                const b = L.latLngBounds([sf.lat, sf.lon], [sd.lat, sd.lon]);
                if (b.isValid()) mapRef.current.fitBounds(b, { padding: [60, 60] });
              }
            }
          } else if (selectedBus.timeline) {
            // Re-render markers if already in state
            renderStopMarkers(selectedBus.timeline, stopsLayerRef.current!);
          }
        } catch (_) {}
      })();
    }

    selectedBusPathRef.current = group.addTo(mapRef.current);
  }, [selectedBus, busHistory, geoPoints.to]);

  // ── Bus markers ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;
    const layer = markersLayerRef.current;
    const activeIds = new Set<string>();

    filteredVehicles.forEach((v) => {
      if (!v.latitude || !v.longitude) return;
      const id = String(v.id || v.tripId || Math.random());
      activeIds.add(id);

      const routeNum = v.routeId ? String(v.routeId).replace(/(up|down)/i, "") : "N/A";
      const direction = /up/i.test(String(v.routeId)) ? "UP" : /down/i.test(String(v.routeId)) ? "DOWN" : "ACTIVE";
      const isSelected = selectedBus?.id === v.id;

      const tooltip =
        '<div style="font-family:inherit;padding:2px">' +
        '<div style="font-weight:800;font-size:14px;color:' + (isSelected ? "#22c55e" : "#fb792b") + '">' +
        "🚌 Bus " + (v.id || "Unknown") + "</div>" +
        '<div style="font-size:12px;margin-top:2px">Route ' + routeNum +
        ' <span style="font-size:10px;background:#eee;padding:1px 4px;border-radius:4px">' + direction + "</span></div>" +
        '<div style="font-size:11px;color:#888;margin-top:4px">Click to track</div></div>';

      const icon = L.divIcon({
        html:
          '<div style="background:' + (isSelected ? "#38bdf8" : "#fb792b") + ";" +
          "border:" + (isSelected ? "4px" : "2px") + " solid white;" +
          "box-shadow: 0 4px 10px rgba(0,0,0,0.5);" +
          "border-radius:50%;" +
          "width:" + (isSelected ? "20px" : "12px") + ";" +
          "height:" + (isSelected ? "20px" : "12px") + ";" +
          "opacity:" + (selectedBus && !isSelected ? "0.3" : "1") + ";" +
          "transition:all 0.3s ease;" +
          "margin-left:" + (isSelected ? "-10px" : "-6px") + ";" +
          'margin-top:' + (isSelected ? "-10px" : "-6px") + '"></div>',
        className: "leaflet-smooth-marker",
      });

      let marker = activeMarkersRef.current[id];
      if (!marker) {
        marker = L.marker([v.latitude, v.longitude], { icon, zIndexOffset: isSelected ? 1000 : 0 })
          .bindTooltip(tooltip, { direction: "top", offset: [0, -10] })
          .on("click", (e) => {
            L.DomEvent.stopPropagation(e);
            if (selectedBus?.id === v.id) {
              setSelectedBus(null);
              stopsLayerRef.current?.clearLayers();
              return;
            }
            const seats = 45;
            const occ = Math.floor((Math.random() * 0.4 + 0.6) * seats);
            setSelectedBus({
              ...v, routeNum, direction,
              address: "Pinpointing satellite location...", addressLoaded: false,
              timelineLoaded: false,
              timeline: [
                { status: "passed", time: "--:--", name: "Scanning topology..." },
                { status: "current", time: "--:--", name: "Connecting to bus..." },
              ],
              seats: { total: seats, occupied: occ },
            });
          });
        marker.addTo(layer);
        activeMarkersRef.current[id] = marker;
      } else {
        marker.setIcon(icon);
        marker.setLatLng([v.latitude, v.longitude]);
        marker.setTooltipContent(tooltip);
        marker.setZIndexOffset(isSelected ? 1000 : 0);
      }
    });

    // Purge stale markers
    Object.keys(activeMarkersRef.current).forEach((id) => {
      if (!activeIds.has(id)) {
        layer.removeLayer(activeMarkersRef.current[id]);
        delete activeMarkersRef.current[id];
      }
    });
  }, [filteredVehicles, selectedBus]);

  // ── Reverse geocode on click ──────────────────────────────────────────────
  useEffect(() => {
    if (!selectedBus || selectedBus.addressLoaded) return;
    fetch(`/api/geocode?lat=${selectedBus.latitude}&lon=${selectedBus.longitude}`)
      .then((r) => r.json())
      .then((d) => {
        setSelectedBus((prev: any) => {
          if (prev?.id !== selectedBus.id) return prev;
          return { ...prev, address: d.success ? d.name : "Location untraceable", addressLoaded: true };
        });
      })
      .catch(() => {});
  }, [selectedBus]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="h-10 w-10 text-brand-500 animate-spin" />
        <p className="text-gray-500">Connecting to Live GTFS Network...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <style dangerouslySetInnerHTML={{ __html: ".leaflet-smooth-marker{transition:transform 4.8s linear}" }} />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            {fromQuery} <span className="text-brand-400">→</span> {toQuery}
          </h1>
          <p className="text-sm text-green-600 font-bold mt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {filteredVehicles.length} buses on corridor
          </p>
        </div>
        <div className="bg-brand-50 px-4 py-2 rounded-lg border border-brand-100 flex flex-col items-end">
          <span className="text-xs text-brand-500 font-bold uppercase tracking-wider">Tracked Vehicles</span>
          <span className="text-2xl font-black text-brand-700 leading-none">{filteredVehicles.length}</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Map */}
        <div className="flex-1 bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 shadow-sm h-[620px] relative">
          <div ref={mapContainer} className="w-full h-full" />
          {!geoPoints.from && !geoPoints.to && (
            <div className="absolute top-4 left-4 right-4 bg-yellow-100 border border-yellow-300 text-yellow-800 p-3 rounded-lg text-sm z-[1000] shadow-md">
              ⚠️ <strong>Showing all buses</strong> — geocoding unavailable or rate-limited.
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-96">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm max-h-[620px] overflow-y-auto">
            {selectedBus ? (
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-black text-2xl text-gray-800">Bus {selectedBus.id}</h3>
                    <p className="text-brand-600 font-bold flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> Route {selectedBus.routeNum}
                    </p>
                  </div>
                  <span className="bg-brand-100 text-brand-700 font-bold text-xs px-3 py-1 rounded-full uppercase">
                    {selectedBus.direction}
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Position */}
                  <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">
                      Active Ground Position
                    </span>
                    {selectedBus.addressLoaded ? (
                      <span className="text-gray-800 font-medium leading-tight">{selectedBus.address}</span>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" /> Translating coordinates...
                      </div>
                    )}
                  </div>

                  {/* Speed + Status */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl">
                      <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block mb-1">
                        Current Speed
                      </span>
                      <span className="text-blue-900 font-black text-xl">
                        {selectedBus.speed ? Math.round(selectedBus.speed * 3.6) + " km/h" : "Moving"}
                      </span>
                    </div>
                    <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl">
                      <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest block mb-1">
                        Occupancy
                      </span>
                      <span className="text-orange-900 font-black text-xl">
                        {selectedBus.seats?.occupied}/{selectedBus.seats?.total}
                      </span>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="bg-white border border-gray-100 p-4 rounded-xl pb-4">
                    <h4 className="text-gray-800 font-black text-sm uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                      Live Timeline
                    </h4>
                    <div className="relative pl-3">
                      {selectedBus.timeline?.map((stop: any, i: number, arr: any[]) => (
                        <div key={i} className="relative flex items-center py-2.5">
                          {i < arr.length - 1 && (
                            <div
                              className="absolute left-0 top-1/2 bottom-[-50%] w-[3px] -ml-[1.5px]"
                              style={{
                                background: stop.status === "passed" ? "#d1d5db" : "#22c55e",
                                zIndex: 0,
                              }}
                            />
                          )}
                          <div
                            className="absolute left-0 rounded-full z-10 bg-white"
                            style={{
                              transform: "translateX(-50%)",
                              width: stop.status === "current" ? "16px" : "12px",
                              height: stop.status === "current" ? "16px" : "12px",
                              border:
                                stop.status === "passed"
                                  ? "3px solid #d1d5db"
                                  : stop.status === "current"
                                  ? "4px solid #3b82f6"
                                  : "3px solid #22c55e",
                            }}
                          />
                          <div className="ml-5 flex items-center gap-1 flex-1">
                            <span
                              className="text-[11px] font-bold w-12"
                              style={{ color: stop.status === "current" ? "#2563eb" : "#9ca3af" }}
                            >
                              {stop.time}
                            </span>
                            <span
                              className="text-[13px] leading-tight pr-2"
                              style={{
                                fontWeight: stop.status === "current" ? 900 : stop.status === "passed" ? 400 : 700,
                                color:
                                  stop.status === "current"
                                    ? "#1e40af"
                                    : stop.status === "passed"
                                    ? "#9ca3af"
                                    : "#1f2937",
                              }}
                            >
                              {stop.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-6 space-y-3 min-h-[300px]">
                <Info className="w-12 h-12 text-gray-200" />
                <p className="font-medium text-gray-500">Select a bus on the map to view its live route details.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      }
    >
      <TrackContent />
    </Suspense>
  );
}

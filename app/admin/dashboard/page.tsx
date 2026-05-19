"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, FileText, Bus, MapPin, Users,
  LogOut, Shield, RefreshCw, CheckCircle,
  Clock, AlertTriangle, XCircle, Loader2, Search, PhoneCall,
  ChevronDown, ChevronUp, X, User, Menu, Star, Phone,
  MessageSquare, LocateFixed,
} from "lucide-react";
import dynamic from "next/dynamic";

const LiveMapTab = dynamic(() => import("./LiveMapTab"), { ssr: false });

type Tab = "overview" | "live" | "sos" | "reports" | "buses" | "routes" | "users" | "feedback";

const statusColour: Record<string, string> = {
  OPEN:        "bg-red-100 text-red-700 border-red-200",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700 border-yellow-200",
  RESOLVED:    "bg-green-100 text-green-700 border-green-200",
  CLOSED:      "bg-gray-100 text-gray-500 border-gray-200",
};
const severityColour: Record<string, string> = {
  LOW:       "bg-blue-100 text-blue-700",
  MEDIUM:    "bg-yellow-100 text-yellow-700",
  HIGH:      "bg-orange-100 text-orange-700",
  EMERGENCY: "bg-red-600 text-white",
  CRITICAL:  "bg-red-100 text-red-700",
};

function FeedbackTab({ token }: { token: string }) {
  const [items, setItems]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/feedback")
      .then(r => r.json())
      .then(d => { setItems(d.feedback ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const avg = items.length
    ? (items.reduce((s, f) => s + f.rating, 0) / items.length).toFixed(1)
    : "—";

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  if (items.length === 0) return (
    <div className="text-center py-16 text-gray-400">
      <Star className="w-12 h-12 mx-auto mb-3 text-gray-200" />
      <p className="font-medium">No feedback yet.</p>
      <p className="text-sm mt-1">Passenger reviews will appear here once submitted.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
          <p className="text-4xl font-black text-amber-500">{avg}</p>
          <div className="flex justify-center gap-0.5 my-1">
            {[1,2,3,4,5].map(i=><Star key={i} className={`w-4 h-4 ${i<=Math.round(Number(avg))?"fill-amber-400 text-amber-400":"text-gray-200"}`}/>)}
          </div>
          <p className="text-xs text-gray-500 font-medium">Average Rating</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
          <p className="text-4xl font-black text-blue-600">{items.length}</p>
          <p className="text-xs text-gray-500 font-medium mt-2">Total Reviews</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
          <p className="text-4xl font-black text-green-600">{items.filter(f=>f.rating>=4).length}</p>
          <p className="text-xs text-gray-500 font-medium mt-2">Positive (4–5★)</p>
        </div>
      </div>
      <div className="space-y-3">
        {items.map(f=>(
          <div key={f.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-black text-sm flex-shrink-0">
                  {f.name.split(" ").map((n: string)=>n[0]).join("").slice(0,2).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">{f.name}</p>
                  <p className="text-xs text-gray-400">{f.route || "App User"} · {new Date(f.createdAt).toLocaleDateString("en-IN")}</p>
                </div>
              </div>
              <div className="flex gap-0.5 flex-shrink-0">
                {[1,2,3,4,5].map(i=><Star key={i} className={`w-3.5 h-3.5 ${i<=f.rating?"fill-amber-400 text-amber-400":"text-gray-200"}`}/>)}
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-3 leading-relaxed">"{f.text}"</p>
            <div className="mt-3 text-right">
              <button onClick={async () => {
                if (confirm("Delete this feedback?")) {
                  await fetch(`/api/feedback?id=${f.id}`, { method: "DELETE", headers: { "x-admin-token": token } });
                  setItems(prev => prev.filter(i => i.id !== f.id));
                }
              }} className="text-xs text-red-500 font-bold hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, colour }: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colour}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-black text-gray-800">{value ?? "—"}</p>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">{label}</p>
      </div>
    </div>
  );
}

// ── User Detail Modal ──────────────────────────────────────────────────────────
function UserModal({ user, onClose }: { user: any; onClose: () => void }) {
  if (!user) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="font-black text-gray-800 text-lg">{user.firstName} {user.lastName}</h2>
              <p className="text-xs text-gray-400">User ID #{user.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="space-y-3">
          {[
            { label: "First Name",   value: user.firstName },
            { label: "Last Name",    value: user.lastName },
            { label: "Mobile",       value: user.mobile },
            { label: "Age",          value: user.age ? `${user.age} years` : "—" },
            { label: "Aadhaar",      value: user.aadhaar ? `XXXX-XXXX-${user.aadhaar.slice(-4)}` : "—" },
            { label: "Registered",   value: user.createdAt ? new Date(user.createdAt).toLocaleString("en-IN") : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
              <span className="text-sm font-semibold text-gray-700">{value ?? "—"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Bus Edit Modal ─────────────────────────────────────────────────────────────
function BusModal({ bus, token, onClose, onSave }: { bus: any; token: string; onClose: () => void; onSave: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    busNumber: bus?.busNumber || "",
    capacity: bus?.capacity || 55,
    type: bus?.type || "ORDINARY",
    isActive: bus?.isActive ?? true,
  });
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const isNew = !bus.id;
      const res = await fetch("/api/admin/data?resource=buses", {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify(isNew ? formData : { id: bus.id, ...formData }),
      });
      if (!res.ok) throw new Error("Failed to save");
      onSave();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this bus?")) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/data?resource=buses&id=${bus.id}`, { method: "DELETE", headers: { "x-admin-token": token } });
      onSave();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!bus) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Bus className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="font-black text-gray-800 text-lg">Edit Bus</h2>
              <p className="text-xs text-gray-400">ID #{bus.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        {error && <div className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bus Number</label>
            <input type="text" value={formData.busNumber} onChange={e => setFormData({...formData, busNumber: e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Capacity</label>
              <input type="number" value={formData.capacity} onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})} className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                <option value="ORDINARY">ORDINARY</option>
                <option value="AC">AC</option>
                <option value="ELECTRIC">ELECTRIC</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" id="bus-active" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4" />
            <label htmlFor="bus-active" className="text-sm font-semibold text-gray-700 cursor-pointer">Is Active</label>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl transition-all disabled:opacity-50">
              {loading ? "Saving..." : "Save Changes"}
            </button>
            {bus.id && (
              <button type="button" onClick={handleDelete} disabled={loading} className="bg-red-100 hover:bg-red-200 text-red-600 px-4 rounded-xl font-bold transition-all disabled:opacity-50">
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Route Edit Modal ───────────────────────────────────────────────────────────
function RouteModal({ route, token, onClose, onSave }: { route: any; token: string; onClose: () => void; onSave: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    routeNumber: route?.routeNumber || "",
    name: route?.name || "",
    type: route?.type || "ORDINARY",
    baseFare: route?.baseFare || 0,
    isActive: route?.isActive ?? true,
  });
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const isNew = !route.id;
      const res = await fetch("/api/admin/data?resource=routes", {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify(isNew ? formData : { id: route.id, ...formData }),
      });
      if (!res.ok) throw new Error("Failed to save");
      onSave();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this route?")) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/data?resource=routes&id=${route.id}`, { method: "DELETE", headers: { "x-admin-token": token } });
      onSave();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!route) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="font-black text-gray-800 text-lg">Edit Route</h2>
              <p className="text-xs text-gray-400">ID #{route.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        {error && <div className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Route No.</label>
              <input type="text" value={formData.routeNumber} onChange={e => setFormData({...formData, routeNumber: e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Base Fare</label>
              <input type="number" value={formData.baseFare} onChange={e => setFormData({...formData, baseFare: parseFloat(e.target.value)})} className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500" required step="0.1" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
            <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500">
              <option value="ORDINARY">ORDINARY</option>
              <option value="AC">AC</option>
              <option value="EXPRESS">EXPRESS</option>
            </select>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" id="route-active" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4" />
            <label htmlFor="route-active" className="text-sm font-semibold text-gray-700 cursor-pointer">Is Active</label>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl transition-all disabled:opacity-50">
              {loading ? "Saving..." : "Save Changes"}
            </button>
            {route.id && (
              <button type="button" onClick={handleDelete} disabled={loading} className="bg-red-100 hover:bg-red-200 text-red-600 px-4 rounded-xl font-bold transition-all disabled:opacity-50">
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Reports Tab ────────────────────────────────────────────────────────────────
function ReportsTab({ token }: { token: string }) {
  const [reports, setReports]   = useState<any[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [status, setStatus]     = useState("");
  const [type, setType]         = useState("");
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.set("status", status);
    if (type)   params.set("type", type);
    const res  = await fetch(`/api/admin/reports?${params}`, { headers: { "x-admin-token": token } });
    const data = await res.json();
    setReports(data.reports ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [token, page, status, type]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: number, newStatus: string) {
    await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ id, status: newStatus }),
    });
    load();
  }

  const filtered = search
    ? reports.filter(r =>
        r.description?.toLowerCase().includes(search.toLowerCase()) ||
        r.type?.toLowerCase().includes(search.toLowerCase()) ||
        r.busNumber?.toLowerCase().includes(search.toLowerCase()))
    : reports;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reports…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400" />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400">
          <option value="">All Status</option>
          {["OPEN","IN_PROGRESS","RESOLVED","CLOSED"].map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={type} onChange={e => { setType(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400">
          <option value="">All Types</option>
          {["OVERCROWDING","LATE_BUS","BREAKDOWN","DRIVER_BEHAVIOR","AC_ISSUE","ROUTE_ISSUE","OTHER"].map(t => <option key={t}>{t}</option>)}
        </select>
        <button onClick={load} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-2 border border-blue-200 rounded-xl hover:bg-blue-50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
        <span className="text-xs text-gray-400">{total} total</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No reports found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const isOpen = expanded === r.id;
            return (
              <div key={r.id} className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-all ${isOpen ? "border-blue-200" : "border-gray-100"}`}>
                {/* Header row — always visible */}
                <div
                  className="p-4 cursor-pointer flex flex-wrap gap-3 items-start justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : r.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="text-xs font-black text-gray-400">#{r.id}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${severityColour[r.severity] ?? "bg-gray-100 text-gray-600"}`}>{r.severity}</span>
                      <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">{r.type?.replace(/_/g," ")}</span>
                      {r.bus    && <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">🚌 {r.bus.busNumber}</span>}
                      {r.route  && <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">🗺 {r.route.routeNumber}</span>}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColour[r.status] ?? ""}`}>{r.status?.replace(/_/g," ")}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-snug line-clamp-1">{r.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-400">{new Date(r.createdAt).toLocaleDateString("en-IN")}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {/* Expanded detail panel */}
                {isOpen && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: "Report ID",  value: `#${r.id}` },
                        { label: "Type",       value: r.type?.replace(/_/g," ") },
                        { label: "Severity",   value: r.severity },
                        { label: "Status",     value: r.status?.replace(/_/g," ") },
                        { label: "Bus",        value: r.bus?.busNumber ?? r.busNumber ?? "—" },
                        { label: "Route",      value: r.route ? `${r.route.routeNumber} — ${r.route.name}` : "—" },
                        { label: "Submitted",  value: new Date(r.createdAt).toLocaleString("en-IN") },
                        { label: "Stop",       value: r.stop?.name ?? r.stopId ?? "—" },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-white rounded-xl border border-gray-100 p-3">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                          <p className="text-sm font-semibold text-gray-700 break-words">{String(value ?? "—")}</p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 p-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Full Description</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{r.description}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-500">Update Status:</span>
                      {["OPEN","IN_PROGRESS","RESOLVED","CLOSED"].map(s => (
                        <button key={s} onClick={() => updateStatus(r.id, s)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                            r.status === s
                              ? statusColour[s] + " ring-2 ring-offset-1 ring-current"
                              : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
                          }`}>
                          {s.replace(/_/g," ")}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {total > 20 && (
        <div className="flex justify-center gap-2 pt-2">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
            className="px-4 py-2 text-sm border rounded-xl disabled:opacity-40 hover:bg-gray-50">← Prev</button>
          <span className="px-4 py-2 text-sm text-gray-500">Page {page} of {Math.ceil(total/20)}</span>
          <button onClick={() => setPage(p => p+1)} disabled={page >= Math.ceil(total/20)}
            className="px-4 py-2 text-sm border rounded-xl disabled:opacity-40 hover:bg-gray-50">Next →</button>
        </div>
      )}
    </div>
  );
}

// ── Generic Data Tab ───────────────────────────────────────────────────────────
function DataTab({ token, resource, columns, onRowClick, refreshKey }: {
  token: string; resource: string;
  columns: { key: string; label: string; render?: (row: any) => React.ReactNode }[];
  onRowClick?: (row: any) => void;
  refreshKey?: number;
}) {
  const [rows, setRows]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/data?resource=${resource}`, { headers: { "x-admin-token": token } })
      .then(async r => {
        if (!r.ok) {
          console.error("API error", await r.text());
          return [];
        }
        return r.json();
      })
      .then(d => { setRows(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(err => { console.error("Fetch error:", err); setRows([]); setLoading(false); });
  }, [token, resource, refreshKey]);

  const filtered = search
    ? rows.filter(r => JSON.stringify(r).toLowerCase().includes(search.toLowerCase()))
    : rows;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${resource}…`}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400" />
        </div>
        <span className="text-xs text-gray-400">{filtered.length} records</span>
        {onRowClick && <span className="text-xs text-blue-500 italic">Click a row to view details</span>}
      </div>
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{columns.map(c => <th key={c.key} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{c.label}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((row, i) => (
                  <tr key={i}
                    onClick={() => onRowClick?.(row)}
                    className={`transition-colors ${onRowClick ? "cursor-pointer hover:bg-blue-50" : "hover:bg-gray-50"}`}>
                    {columns.map(c => (
                      <td key={c.key} className="px-4 py-3 text-gray-700">
                        {c.render ? c.render(row) : String(row[c.key] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="text-center py-12 text-gray-400">No records found.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router  = useRouter();
  const [token, setToken]       = useState("");
  const [tab, setTab]           = useState<Tab>("overview");
  const [stats, setStats]       = useState<any>(null);
  const [authed, setAuthed]     = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedBus, setSelectedBus]   = useState<any>(null);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [dataRefreshKey, setDataRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen]   = useState(false);

  useEffect(() => {
    const t = sessionStorage.getItem("adminToken") ?? "";
    if (!t) { router.replace("/admin"); return; }
    setToken(t);
    setAuthed(true);
    fetch("/api/admin/data?resource=stats", { headers: { "x-admin-token": t } })
      .then(r => r.json()).then(setStats).catch(() => {});
  }, [router]);

  function logout() {
    sessionStorage.removeItem("adminToken");
    router.replace("/admin");
  }

  function switchTab(id: Tab) { setTab(id); setSidebarOpen(false); }

  if (!authed) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview",  icon: LayoutDashboard },
    { id: "live",     label: "Live Map",  icon: LocateFixed },
    { id: "sos",      label: "SOS Logs",  icon: PhoneCall },
    { id: "reports",  label: "Reports",   icon: FileText },
    { id: "feedback", label: "Feedback",  icon: MessageSquare },
    { id: "buses",    label: "Buses",     icon: Bus },
    { id: "routes",   label: "Routes",    icon: MapPin },
    { id: "users",    label: "Users",     icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {selectedUser && <UserModal user={selectedUser} onClose={() => setSelectedUser(null)} />}
      {selectedBus && <BusModal bus={selectedBus} token={token} onClose={() => setSelectedBus(null)} onSave={() => { setSelectedBus(null); setDataRefreshKey(k => k + 1); }} />}
      {selectedRoute && <RouteModal route={selectedRoute} token={token} onClose={() => setSelectedRoute(null)} onSave={() => { setSelectedRoute(null); setDataRefreshKey(k => k + 1); }} />}

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar — fixed on mobile overlay, static on desktop */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col
        transform transition-transform duration-200
        lg:static lg:translate-x-0 lg:shrink-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="font-black text-sm leading-none">Admin Panel</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Where Is My Bus</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => switchTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                tab === id ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}>
              <Icon className="w-4 h-4" />
              {label}
              {id === "reports" && (stats?.openReports ?? 0) > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{stats.openReports}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-auto">
        {/* Mobile topbar */}
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="font-black text-gray-800 text-sm">Admin Panel</span>
          </div>
          <span className="ml-auto text-xs text-gray-400 capitalize">{tab}</span>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-black text-gray-800 capitalize">
            {tab === "overview" ? "Dashboard Overview" : tab === "feedback" ? "Passenger Feedback" : tab === "live" ? "Live Fleet Tracking" : tab === "sos" ? "Emergency SOS Logs" : tab}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Where Is My Bus — Admin Control Panel</p>
        </div>

        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <StatCard label="Total Buses"     value={stats?.buses}       icon={Bus}           colour="bg-blue-100 text-blue-600" />
              <StatCard label="Routes"           value={stats?.routes}      icon={MapPin}        colour="bg-purple-100 text-purple-600" />
              <StatCard label="Users"            value={stats?.users}       icon={Users}         colour="bg-green-100 text-green-600" />
              <StatCard label="Total Reports"    value={stats?.reports}     icon={FileText}      colour="bg-orange-100 text-orange-600" />
              <StatCard label="Open Reports"     value={stats?.openReports} icon={AlertTriangle} colour="bg-red-100 text-red-600" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: CheckCircle, colour: "text-green-500",  label: "Reports Resolved", desc: "Closed / resolved reports" },
                { icon: Clock,       colour: "text-yellow-500", label: "In Progress",      desc: "Reports being actively handled" },
                { icon: XCircle,     colour: "text-red-500",    label: "Open Issues",      desc: "Unreviewed user reports" },
              ].map(({ icon: Icon, colour, label, desc }) => (
                <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
                  <Icon className={`w-7 h-7 flex-shrink-0 ${colour}`} />
                  <div>
                    <p className="font-black text-gray-800 text-sm">{label}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <p className="font-black text-gray-800 mb-3">Quick Navigation</p>
              <div className="flex gap-2 flex-wrap">
                {tabs.filter(t => t.id !== "overview").map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => switchTab(id)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 border border-gray-200 hover:border-blue-200 rounded-xl text-sm font-medium transition-colors">
                    <Icon className="w-4 h-4" /> {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "reports"  && <ReportsTab token={token} />}
        {tab === "feedback" && <FeedbackTab token={token} />}
        {tab === "live"     && <LiveMapTab />}
        
        {tab === "sos" && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3">
              <PhoneCall className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-red-800 text-sm">Emergency Calls Monitoring</h3>
                <p className="text-xs text-red-600 mt-1">This log tracks whenever a user long-presses the SOS button to dial 100. It includes their IP address and browser details for security audits.</p>
              </div>
            </div>
            <DataTab token={token} resource="sos" columns={[
              { key: "id",        label: "ID" },
              { key: "ipAddress", label: "IP Address", render: r => <span className="font-mono text-xs">{r.ipAddress || "Unknown"}</span> },
              { key: "createdAt", label: "Timestamp",  render: r => new Date(r.createdAt).toLocaleString("en-IN") },
              { key: "userAgent", label: "Browser User Agent", render: r => <span className="text-xs text-gray-500 line-clamp-1 max-w-sm" title={r.userAgent}>{r.userAgent || "Unknown"}</span> },
            ]} />
          </div>
        )}

        {tab === "buses" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => setSelectedBus({ isActive: true, capacity: 55, type: "ORDINARY" })} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-xl transition-all text-sm shadow-sm">
                + Add New Bus
              </button>
            </div>
            <DataTab token={token} resource="buses" refreshKey={dataRefreshKey} onRowClick={row => setSelectedBus(row)} columns={[
              { key: "id",        label: "ID" },
              { key: "busNumber", label: "Bus Number" },
              { key: "route",     label: "Route",     render: r => r.route?.routeNumber ?? "—" },
              { key: "authority", label: "Authority", render: r => r.authority?.name ?? "—" },
              { key: "type",      label: "Type" },
              { key: "capacity",  label: "Capacity" },
              { key: "simSegment",label: "Sim Seg." },
              { key: "isActive",  label: "Active", render: r => r.isActive
                ? <span className="text-green-600 font-bold text-xs">✓ Active</span>
                : <span className="text-red-500 font-bold text-xs">✗ Inactive</span> },
              { key: "edit",      label: "",        render: () => <span className="text-xs text-blue-500 font-medium">Edit →</span> },
            ]} />
          </div>
        )}

        {tab === "routes" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => setSelectedRoute({ isActive: true, type: "ORDINARY", baseFare: 0 })} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-xl transition-all text-sm shadow-sm">
                + Add New Route
              </button>
            </div>
            <DataTab token={token} resource="routes" refreshKey={dataRefreshKey} onRowClick={row => setSelectedRoute(row)} columns={[
              { key: "routeNumber", label: "Route No." },
              { key: "name",        label: "Name" },
              { key: "authority",   label: "Authority", render: r => r.authority?.name ?? "—" },
              { key: "type",        label: "Type" },
              { key: "totalKm",     label: "Distance",  render: r => `${r.totalKm} km` },
              { key: "baseFare",    label: "Base Fare", render: r => `₹${r.baseFare}` },
              { key: "_count",      label: "Buses",     render: r => r._count?.buses ?? 0 },
              { key: "stops",       label: "Stops",     render: r => r._count?.stops ?? 0 },
              { key: "isActive",    label: "Active",    render: r => r.isActive
                ? <span className="text-green-600 font-bold text-xs">✓</span>
                : <span className="text-red-500 font-bold text-xs">✗</span> },
              { key: "edit",      label: "",        render: () => <span className="text-xs text-blue-500 font-medium">Edit →</span> },
            ]} />
          </div>
        )}

        {tab === "users" && (
          <DataTab token={token} resource="users"
            onRowClick={row => setSelectedUser(row)}
            columns={[
              { key: "id",        label: "ID" },
              { key: "firstName", label: "First Name" },
              { key: "lastName",  label: "Last Name" },
              { key: "mobile",    label: "Mobile" },
              { key: "age",       label: "Age",    render: r => r.age ? `${r.age} yrs` : "—" },
              { key: "aadhaar",   label: "Aadhaar", render: r => r.aadhaar ? `XXXX-XXXX-${String(r.aadhaar).slice(-4)}` : "—" },
              { key: "createdAt", label: "Joined",  render: r => new Date(r.createdAt).toLocaleDateString("en-IN") },
              { key: "view",      label: "",        render: () => <span className="text-xs text-blue-500 font-medium">View →</span> },
            ]} />
        )}
        </div>{/* end inner padding div */}
      </main>
    </div>
  );
}

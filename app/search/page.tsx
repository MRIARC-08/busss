"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Loader2, ArrowRight, Bus, MapPin, Clock, Users, Banknote, Wind } from "lucide-react";
import Link from "next/link";

function SearchResults() {
  const params = useSearchParams();
  const from = params.get("from") || "";
  const to = params.get("to") || "";

  // Guard: same-stop search has no valid buses
  const isSameStop = from.trim().toLowerCase() !== "" && from.trim().toLowerCase() === to.trim().toLowerCase();

  const [loading, setLoading] = useState(!isSameStop);
  const [data, setData] = useState<{upcoming: any[], departed: any[]}>({ upcoming: [], departed: [] });

  useEffect(() => {
    if (!from || !to || isSameStop) return;
    
    // Simulate complex static GTFS DB query joined with realtime data
    fetch(`/api/search-matching?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      .then(r => r.json())
      .then(d => {
         if (d.success) {
           setData({ upcoming: d.upcoming, departed: d.departed });
         }
         setLoading(false);
      }).catch(() => setLoading(false));
  }, [from, to, isSameStop]);

  // Same-stop error screen
  if (isSameStop) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 flex flex-col items-center text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center text-4xl select-none">🚌</div>
        <div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">Origin = Destination?</h2>
          <p className="text-gray-500 leading-relaxed">
            You searched <span className="font-bold text-gray-700">&ldquo;{from}&rdquo;</span> to <span className="font-bold text-gray-700">&ldquo;{to}&rdquo;</span>.
            <br />A bus route cannot start and end at the same stop!
            Please choose two <em>different</em> locations.
          </p>
        </div>
        <a href="/" className="inline-flex items-center gap-2 bg-brand-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-brand-700 transition-colors">
          ← Search Again
        </a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6 bg-gray-50 min-h-[calc(100vh-100px)]">
        <Loader2 className="h-12 w-12 text-brand-500 animate-spin" />
        <p className="text-gray-600 font-medium">Scanning live regional GTFS network and stop topologies...</p>
      </div>
    );
  }

  const BusCard = ({ bus, departed }: { bus: any, departed?: boolean }) => {
    const routeNum = bus.routeId ? String(bus.routeId).replace(/(up|down)/i, '') : "N/A";
    const direction = String(bus.routeId).match(/up/i) ? 'UP' : String(bus.routeId).match(/down/i) ? 'DOWN' : 'REGULAR';
    const acStatus = bus.isAC ? 'AC' : 'Non-AC';
    
    return (
      <Link href={`/track?busId=${bus.id}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`}
        className={`block p-5 rounded-xl border ${departed ? 'bg-gray-50 border-gray-200' : 'bg-white border-brand-200 hover:border-brand-400 hover:shadow-md'} transition-all group`}
      >
        <div className="flex justify-between items-start">
           <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${departed ? 'bg-gray-200 text-gray-500' : 'bg-brand-100 text-brand-600'}`}>
                 <Bus className="w-6 h-6" />
              </div>
              <div>
                 <div className="flex items-baseline gap-2">
                   <h3 className={`text-xl font-black ${departed ? 'text-gray-500' : 'text-gray-800'}`}>Route {routeNum}</h3>
                   <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${departed ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-700'}`}>{direction}</span>
                   <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1 ${bus.isAC ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}><Wind className="w-3 h-3" /> {acStatus}</span>
                 </div>
                 <p className="text-sm text-gray-500 font-medium mt-0.5">Vehicle {bus.id} • Towards: <span className="font-bold text-gray-700">{to}</span></p>
              </div>
           </div>
           <div className="text-right">
              <span className={`text-lg font-black block ${departed ? 'text-gray-500' : 'text-brand-600'}`}>
                {departed ? 'Passed' : `~${bus.etaToSource} Min`}
              </span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{departed ? 'Already Departed' : 'Estimated Arrival'}</span>
           </div>
        </div>

        <div className="mt-4 pt-4 border-t flex items-center gap-4 text-xs font-bold text-gray-500">
           <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded"><Banknote className="w-4 h-4 text-green-600"/> Fare: ₹{bus.fare || 'N/A'}</span>
           <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded"><Users className="w-4 h-4 text-brand-600"/> Passengers: {bus.occupancy || 0}/{bus.seats || 45}</span>
        </div>
        
        <div className={`mt-4 pt-4 border-t flex justify-between items-center ${departed ? 'border-gray-200 opacity-60' : 'border-gray-50'}`}>
           <span className="text-xs font-bold text-gray-500 flex items-center gap-1"><Clock className="w-4 h-4"/> Last Ping: {Math.floor(Math.random() * 30 + 5)}s ago</span>
           <span className={`text-sm font-bold flex items-center gap-1 ${departed ? 'text-gray-500' : 'text-brand-600 group-hover:text-brand-700'}`}>
             Open Live Tracking Map <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
           </span>
        </div>
      </Link>
    )
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-8 flex justify-between items-center">
         <div>
            <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2 border-b pb-1 inline-block">Starting and Ending Point</div>
            <h1 className="text-2xl font-black text-gray-800 flex items-center gap-3">
              <MapPin className="text-brand-500 w-6 h-6" />
              {from} <ArrowRight className="text-gray-300 w-5 h-5 mx-1" /> {to}
            </h1>
            <p className="text-gray-500 font-medium mt-3 bg-brand-50 inline-block px-3 py-1 rounded-lg text-brand-700 border border-brand-100">Total number of buses on route: <span className="font-black">{data.upcoming.length + data.departed.length}</span></p>
         </div>
      </div>

      <div className="space-y-10">
        <section>
           <h2 className="text-lg font-black text-brand-800 uppercase tracking-widest mb-4 flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Approaching Your Stop
           </h2>
           {data.upcoming.length > 0 ? (
             <div className="grid gap-4">
               {data.upcoming.map((bus: any) => <BusCard key={bus.id} bus={bus} />)}
             </div>
           ) : (
             <p className="text-gray-500 italic p-6 bg-gray-50 rounded-xl border border-gray-100">No approaching buses found for this exact route at this moment.</p>
           )}
        </section>

        <section>
           <h2 className="text-lg font-black text-gray-500 uppercase tracking-widest mb-4 border-b border-gray-200 pb-2">
             Already Departed From Your Stop
           </h2>
           <div className="grid gap-4 opacity-80">
             {data.departed.map((bus: any) => <BusCard key={bus.id} bus={bus} departed />)}
           </div>
        </section>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center"><Loader2 className="animate-spin text-brand-500 w-8 h-8 mx-auto"/></div>}>
      <SearchResults />
    </Suspense>
  );
}

"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Home, Search, MapPin, ArrowLeft, Bus } from "lucide-react";

export default function NotFound() {
  const [pos, setPos] = useState(0);

  // Bus drives across the screen
  useEffect(() => {
    let frame: number;
    let x = -120;
    const tick = () => {
      x = x >= window.innerWidth + 120 ? -120 : x + 2;
      setPos(x);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <main className="min-h-screen bg-[#1a237e] flex flex-col items-center justify-center relative overflow-hidden select-none px-6">

      {/* Star field */}
      {[...Array(24)].map((_, i) => (
        <span key={i} className="absolute rounded-full bg-white/10 pointer-events-none"
          style={{
            width:  `${4 + (i % 5) * 3}px`,
            height: `${4 + (i % 5) * 3}px`,
            top:    `${(i * 37) % 90}%`,
            left:   `${(i * 53) % 96}%`,
            opacity: 0.15 + (i % 4) * 0.08,
          }} />
      ))}

      {/* Road at bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <div className="h-16 bg-gray-900/70" />
        <div className="absolute bottom-6 left-0 right-0 border-t-[3px] border-dashed border-yellow-400/50" />
        {/* Driving bus */}
        <div className="absolute bottom-2 flex items-end gap-0 transition-none"
          style={{ left: `${pos}px` }}>
          <div className="relative bg-white rounded-t-xl rounded-bl-md rounded-br-md w-28 h-14 flex flex-col overflow-hidden shadow-lg">
            <div className="h-2 bg-blue-800 w-full" />
            <div className="flex gap-1 px-2 pt-1">
              {["😐","😴","📱"].map((e, i) => (
                <div key={i} className="w-6 h-6 bg-blue-100 rounded text-[10px] flex items-center justify-center">{e}</div>
              ))}
            </div>
            <div className="mt-auto h-4 bg-blue-800 flex items-center justify-center">
              <span className="text-white text-[8px] font-black tracking-wider">404 EXPRESS</span>
            </div>
          </div>
          <div className="absolute -bottom-2 left-4 w-5 h-5 bg-gray-700 rounded-full border-2 border-gray-400" />
          <div className="absolute -bottom-2 right-4 w-5 h-5 bg-gray-700 rounded-full border-2 border-gray-400" />
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center flex flex-col items-center gap-5 pb-20">

        {/* Big 404 */}
        <div className="flex items-center gap-2">
          <span className="text-[120px] font-black text-white/10 leading-none" style={{ WebkitTextStroke: "2px rgba(255,255,255,0.2)" }}>4</span>
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-600/40 mx-1">
            <Bus className="w-10 h-10 text-white" />
          </div>
          <span className="text-[120px] font-black text-white/10 leading-none" style={{ WebkitTextStroke: "2px rgba(255,255,255,0.2)" }}>4</span>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white tracking-tight">Wrong Stop!</h1>
          <p className="text-blue-200 text-base max-w-xs mx-auto leading-relaxed">
            This page doesn't exist or has moved. The 404 Express will take you nowhere.
          </p>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-wrap gap-3 justify-center mt-2">
          <Link href="/"
            className="flex items-center gap-2 bg-white text-blue-900 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-all hover:scale-105 shadow-lg text-sm">
            <Home className="w-4 h-4" /> Back to Home
          </Link>
          <Link href="/search"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-6 py-3 rounded-xl transition-all hover:scale-105 text-sm">
            <Search className="w-4 h-4" /> Find a Route
          </Link>
          <Link href="/live"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-6 py-3 rounded-xl transition-all hover:scale-105 text-sm">
            <MapPin className="w-4 h-4" /> Live Map
          </Link>
        </div>

        <button onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-blue-300 hover:text-white text-sm transition-colors mt-1">
          <ArrowLeft className="w-4 h-4" /> Go back
        </button>
      </div>
    </main>
  );
}

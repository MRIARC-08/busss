"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import { SOSModal } from "./SOSModal";

export function FloatingSOS() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Emergency SOS"
        className="fixed bottom-6 right-6 z-[9999] flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black px-4 py-4 rounded-full shadow-2xl shadow-red-600/40 transition-all hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-red-300"
      >
        <Phone className="w-6 h-6 animate-pulse" />
        <span className="hidden sm:inline mr-1 text-lg">SOS</span>
      </button>
      
      {isOpen && <SOSModal onClose={() => setIsOpen(false)} />}
    </>
  );
}

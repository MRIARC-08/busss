"use client";

import { useState, useRef } from "react";
import { Phone } from "lucide-react";
import { SOSModal } from "./SOSModal";

export function FloatingSOS() {
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const startPress = () => {
    isLongPress.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      window.location.href = "tel:100";
    }, 600); // 600ms long press to dial
  };

  const endPress = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!isLongPress.current) {
      setIsOpen(true);
    }
  };

  const cancelPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return (
    <>
      <button
        onMouseDown={startPress}
        onMouseUp={endPress}
        onMouseLeave={cancelPress}
        onTouchStart={startPress}
        onTouchEnd={endPress}
        onContextMenu={(e) => e.preventDefault()}
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

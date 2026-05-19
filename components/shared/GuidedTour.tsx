"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X, ArrowRight, Check } from "lucide-react";

export function GuidedTour() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [windowSize, setWindowSize] = useState({ w: 1000, h: 1000 });

  const [hasAuthModal, setHasAuthModal] = useState(false);
  const [hasPwaPrompt, setHasPwaPrompt] = useState(false);

  const getStepsForPage = (path: string) => {
    if (hasAuthModal) {
      return [
        { id: "tour-auth-modal", title: "Demo Authentication", desc: "Demo credentials are fully pre-filled for your convenience! Simply click 'Sign In' to authenticate and unlock live route tracking features instantly." }
      ];
    }
    if (path === "/") {
      const steps = [
        { id: "tour-lang", title: "Bilingual", desc: "Easily switch between English and Hindi." },
        { id: "tour-search", title: "Find Your Bus", desc: "Search for buses. Try searching now, or click Next to explore other features!" },
      ];
      if (hasPwaPrompt) {
        steps.push({ id: "tour-pwa-prompt", title: "Install Mobile App", desc: "Install Where Is My Bus as a native Progressive Web App (PWA) to unlock full offline schedules and home screen access." });
      }
      steps.push(
        { id: "tour-report", title: "Report Issues", desc: "Report delays, overcrowding, or unsafe behavior." },
        { id: "tour-sos", title: "Emergency SOS", desc: "Hold this button anytime you feel unsafe." }
      );
      return steps;
    }
    if (path.startsWith("/search")) {
      return [
        { id: "tour-search-header", title: "Route Summary", desc: "See your active search details, origin stop, and total approaching buses." },
        { id: "tour-track-btn", title: "Live Tracking", desc: "Tap any bus card to launch highly detailed live GPS tracking on the map." },
      ];
    }
    if (path.startsWith("/track")) {
      return [
        { id: "tour-live-map", title: "Live Map", desc: "Watch your bus move in real-time on the map." },
        { id: "tour-timeline", title: "Route Timeline", desc: "Check upcoming stops and precise ETAs." },
      ];
    }
    return [];
  };

  const steps = getStepsForPage(pathname);
  const tourKey = hasAuthModal ? 'bus-tour-auth-done' : `bus-tour-${pathname.split('/')[1] || 'home'}-done`;

  useEffect(() => {
    // Monitor modal existence in DOM
    const checkDOM = () => {
      const el = document.getElementById("tour-auth-modal");
      setHasAuthModal(!!el);
      const pwa = document.getElementById("tour-pwa-prompt");
      setHasPwaPrompt(!!pwa);
    };
    const interval = setInterval(checkDOM, 300);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setMounted(true);
    setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    
    if (steps.length > 0 && !localStorage.getItem(tourKey)) {
      setStepIndex(0);
      setTimeout(() => {
        setIsVisible(true);
        localStorage.setItem(tourKey, "true");
      }, 500);
    } else {
      setIsVisible(false);
    }
  }, [pathname, hasAuthModal]);

  useEffect(() => {
    if (!isVisible || steps.length === 0) return;

    const updateRect = () => {
      setWindowSize({ w: window.innerWidth, h: window.innerHeight });
      const el = document.getElementById(steps[stepIndex]?.id);
      if (el) {
        setRect(el.getBoundingClientRect());
        const elRect = el.getBoundingClientRect();
        if (elRect.top < 0 || elRect.bottom > window.innerHeight) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } else {
        setRect(null);
      }
    };

    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect);
    const interval = setInterval(updateRect, 500);

    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect);
      clearInterval(interval);
    };
  }, [stepIndex, isVisible, steps]);

  if (!mounted || !isVisible || steps.length === 0 || !rect) return null;

  const currentStep = steps[stepIndex];
  if (!currentStep) return null;
  const isLast = stepIndex === steps.length - 1;

  const handleNext = () => {
    if (isLast) setIsVisible(false);
    else setStepIndex(s => s + 1);
  };

  const closeTour = () => setIsVisible(false);

  // SVG path for cutout with rounded corners
  const padding = 12;
  const rTop = rect ? Math.max(0, rect.top - padding) : 0;
  const rLeft = rect ? Math.max(0, rect.left - padding) : 0;
  const rRight = rect ? Math.min(windowSize.w, rect.right + padding) : 0;
  const rBottom = rect ? Math.min(windowSize.h, rect.bottom + padding) : 0;
  
  const r = 16; // border radius of the cutout hole
  const holeW = Math.max(rRight - rLeft, r * 2);
  const holeH = Math.max(rBottom - rTop, r * 2);
  const actualRight = rLeft + holeW;
  const actualBottom = rTop + holeH;

  const svgPath = `
    M0,0 L${windowSize.w},0 L${windowSize.w},${windowSize.h} L0,${windowSize.h} Z 
    M${rLeft + r},${rTop}
    L${actualRight - r},${rTop}
    A${r},${r} 0 0 1 ${actualRight},${rTop + r}
    L${actualRight},${actualBottom - r}
    A${r},${r} 0 0 1 ${actualRight - r},${actualBottom}
    L${rLeft + r},${actualBottom}
    A${r},${r} 0 0 1 ${rLeft},${actualBottom - r}
    L${rLeft},${rTop + r}
    A${r},${r} 0 0 1 ${rLeft + r},${rTop}
    Z
  `;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* SVG Overlay with transparent hole */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none">
        <path 
          d={svgPath} 
          fill="rgba(15, 23, 42, 0.85)" 
          fillRule="evenodd" 
          className="transition-all duration-500 ease-in-out pointer-events-auto cursor-default" 
          onClick={closeTour}
        />
      </svg>

      {/* Highlight Border */}
      {rect && (
        <div
          className="fixed rounded-2xl pointer-events-none transition-all duration-500 ease-in-out border-2 border-brand-400 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
          style={{ top: rTop, left: rLeft, width: actualRight - rLeft, height: actualBottom - rTop }}
        />
      )}

      {/* Popover */}
      {rect && (
        <div
          className="fixed bg-white rounded-2xl p-5 w-auto sm:w-80 shadow-2xl pointer-events-auto transition-all duration-500 ease-in-out border border-gray-100"
          style={windowSize.w < 640 ? {
            bottom: "24px",
            left: "16px",
            right: "16px",
            width: "auto",
          } : {
            top: rBottom + 20 > windowSize.h - 200 ? Math.max(10, rTop - 180) : rBottom + 20,
            left: Math.max(10, Math.min(rect.left + rect.width / 2 - 160, windowSize.w - 330)),
          }}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-black text-gray-800 text-lg leading-tight">{currentStep.title}</h3>
            <button onClick={closeTour} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors rounded-full p-1 -mr-1 -mt-1">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">{currentStep.desc}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === stepIndex ? "w-5 bg-brand-600" : "w-1.5 bg-gray-200"}`} />
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={closeTour} className="px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-gray-800 transition-colors">
                Skip
              </button>
              <button onClick={handleNext} className="flex items-center gap-1.5 bg-[#fb792b] hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-lg shadow-orange-100">
                {isLast ? <><Check className="w-3.5 h-3.5"/> Finish</> : <>Next <ArrowRight className="w-3.5 h-3.5"/></>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

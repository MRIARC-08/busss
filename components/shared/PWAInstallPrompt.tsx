"use client";

import { useState, useEffect } from "react";
import { Download, X, Share } from "lucide-react";
import Image from "next/image";

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Basic detection
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    const dismissed = localStorage.getItem("pwa-prompt-dismissed");

    if (isStandalone || dismissed) return;

    if (isIOSDevice) {
      setIsIOS(true);
      // Add a small delay so it doesn't pop up instantly jarringly
      setTimeout(() => setIsVisible(true), 2000);
    } else {
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setIsVisible(true);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("pwa-prompt-dismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[9999] sm:top-auto sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm sm:w-full">
      <div className="bg-white rounded-2xl shadow-2xl border border-brand-100 p-4 flex items-center gap-3 animate-in slide-in-from-top-5 sm:slide-in-from-bottom-5 fade-in duration-500">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center overflow-hidden border border-gray-100 p-1">
            <Image src="/logo.jpg" alt="App Logo" width={48} height={48} className="object-contain rounded-lg" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-gray-800 text-sm tracking-tight">Get the Mobile App</h3>
          {isIOS ? (
            <p className="text-xs text-gray-500 mt-0.5 leading-snug">
              Tap <Share className="inline w-3 h-3 mx-0.5 text-blue-500" /> then <strong className="text-gray-700">Add to Home Screen</strong>
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-0.5 leading-snug">
              Install for offline tracking & faster access
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {!isIOS && (
            <button
              onClick={handleInstall}
              className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-black px-4 py-2 rounded-lg transition-colors shadow shadow-brand-500/20 uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              Install
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:bg-gray-100 hover:text-gray-600 p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

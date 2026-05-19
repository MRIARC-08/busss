"use client";

import { useState, useEffect } from "react";

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    const directHandler = async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        setDeferredPrompt(null);
      }
    };
    window.addEventListener("trigger-pwa-direct-install", directHandler);
    return () => window.removeEventListener("trigger-pwa-direct-install", directHandler);
  }, [deferredPrompt]);

  return null;
}

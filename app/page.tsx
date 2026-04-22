"use client";

import HeroSearchBox from "@/components/search/HeroSearchBox";
import FeatureCards from "@/components/layout/FeatureCards";
import PopularRoutes from "@/components/layout/PopularRoutes";
import { useLanguage } from "@/lib/contexts/LanguageContext";

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col pt-0">

      {/* Hero Section */}
      <div className="relative bg-brand-100 flex-1 flex flex-col justify-center py-8 lg:py-16 overflow-hidden">
        
        {/* Background Graphic / Image Placeholder */}
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-gradient-to-r from-blue-100 to-blue-300 relative">
            <svg className="absolute right-0 bottom-0 max-w-full h-auto opacity-50 text-brand-300" viewBox="0 0 800 600" fill="currentColor">
              {/* Dummy decorative bus path */}
              <path d="M100,500 C300,500 400,200 700,200 L800,200 L800,600 L100,600 Z" />
            </svg>
            {/* Optional real image here */}
            {/* <img src="/bus-hero.jpg" className="w-full h-full object-cover opacity-80" /> */}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 w-full relative z-10 flex flex-col lg:flex-row items-center gap-10">
          
          {/* Left Side: Search Box */}
          <div className="w-full lg:w-5/12 flex-shrink-0 animate-in slide-in-from-left duration-500">
            <HeroSearchBox />
          </div>

          {/* Right Side: Titles based on IRCTC "INDIAN RAILWAYS" text */}
          <div className="w-full lg:w-7/12 text-center lg:text-right text-[#213d77] animate-in slide-in-from-right duration-500 hidden lg:block">
            <h1 className="text-5xl lg:text-7xl font-black mb-4 tracking-tighter uppercase drop-shadow-md">
              {t("hero.title")}
            </h1>
            <div className="flex items-center justify-end gap-4 text-xl lg:text-3xl font-medium tracking-wide">
              <span>{t("hero.subtitle").split(" | ")[0]}</span>
              <span className="w-1.5 h-10 bg-[#fb792b]"></span>
              <span>{t("hero.subtitle").split(" | ")[1]}</span>
              <span className="w-1.5 h-10 bg-[#fb792b]"></span>
              <span>{t("hero.subtitle").split(" | ")[2]}</span>
            </div>
          </div>

        </div>
      </div>

      <div className="bg-white">
        {/* Feature Cards */}
        <FeatureCards />

        {/* Popular Routes */}
        <PopularRoutes />
      </div>

    </div>
  );
}

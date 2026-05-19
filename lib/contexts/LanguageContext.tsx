"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "hi";

type Translations = {
  [key in Language]: {
    [key: string]: string;
  }
};

const translations: Translations = {
  en: {
    "nav.home": "Home",
    "nav.findRoute": "Find Route",
    "nav.report": "Report",
    "nav.admin": "Admin",
    "nav.loginRegister": "LOGIN / REGISTER",
    "nav.contactUs": "CONTACT US",
    "nav.alerts": "ALERTS",
    "nav.ewallet": "E-WALLET",
    "nav.buses": "BUSES",
    "nav.meals": "MEALS",
    "nav.liveMap": "Live Map",
    "nav.profile": "Profile",
    
    "brand.title": "WHERE IS MY BUS",
    "brand.subtitle": "SMART NAVIGATOR",

    "testimonials.title": "What Commuters Are Saying",
    "testimonials.subtitle": "Real experiences from real passengers across Delhi, Haryana & Punjab",
    "testimonials.badge": "PASSENGER VOICES",
    "testimonials.reviews": "Commuter Reviews",
    "testimonials.share": "Share Your Experience",
    "testimonials.rating": "Your Rating *",
    "testimonials.nameOpt": "Your name (optional)",
    "testimonials.shareExp": "Share your experience with the app...",
    "testimonials.btn": "Share Experience",
    "testimonials.sending": "Sending...",
    "testimonials.thanks": "Thank you for your feedback!",
    "testimonials.thanksSub": "Your experience helps us improve.",
    "testimonials.submitAnother": "Submit another",

    "search.originDest": "Origin = Destination?",
    "search.sameStopMsg": "A bus route cannot start and end at the same stop! Please choose two different locations.",
    "search.searchAgain": "Search Again",
    "search.loading": "Analyzing routes and schedules...",
    "search.route": "Route",
    "search.vehicle": "Vehicle",
    "search.towards": "Towards",
    "search.passed": "Passed",
    "search.alreadyDeparted": "Already Departed",
    "search.estimatedArrival": "Estimated Arrival",
    "search.arrivalAtStart": "Arrival at Start",
    "search.fare": "Fare",
    "search.passengers": "Passengers",
    "search.lastPing": "Last Ping",
    "search.ago": "ago",
    "search.openLiveMap": "Open Live Tracking Map",
    "search.startEnd": "Starting and Ending Point",
    "search.approachingBuses": "Approaching buses",
    "search.approachingStop": "Approaching Your Stop",
    "search.noBuses": "No approaching buses found for this exact route at this moment.",
    "search.min": "Min",

    "track.resolving": "Resolving bus ID…",
    "track.connecting": "Connecting to live bus feed…",
    "track.unavailable": "Tracking Unavailable",
    "track.notFound": "Bus was not found in the system.",
    "track.loadError": "Bus data could not be loaded.",
    "track.retry": "Retry",
    "track.goBack": "Go Back",
    "track.status": "Live Status",
    "track.speed": "Speed",
    "track.totalDist": "Total Dist",
    "track.totalTime": "Total Time",
    "track.reachIn": "Reach In",
    "track.delay": "Delay",
    "track.onTime": "On time",
    "track.reached": "Reached",
    "track.currentlyAt": "Currently At",
    "track.nextStop": "Next Stop",
    "track.away": "away",
    "track.occupancy": "Occupancy",
    "track.liveRoute": "Live Route",
    "track.refreshing": "Refreshing in",
    "track.vehicle": "Vehicle",
    "track.route": "Route",
    "track.towards": "Towards",
    "track.routeTimeline": "Route Timeline",
    
    "contact.helpline": "Helpline",
    "contact.helplineSub": "Mon–Sat, 8am–8pm",
    "contact.email": "Email",
    "contact.emailSub": "Response within 24h",
    "contact.office": "Head Office",
    "contact.officeVal": "New Delhi, India",
    "contact.officeSub": "Govt. Transport Wing",

    "hero.bookTicket": "Look for Buses",
    "hero.from": "From",
    "hero.to": "To",
    "hero.date": "DD/MM/YYYY *",
    "hero.classes": "All Classes",
    "hero.search": "Search",
    "hero.title": "SMART BUS TRANSPORT",
    "hero.subtitle": "Safety | Security | Punctuality",
    "hero.general": "GENERAL",
    "hero.disability": "Person With Disability Concession",
    "hero.flexible": "Flexible With Date",
    "hero.pass": "Bus Pass Concession",
    
    "auth.mobile": "Mobile Number",
    "auth.password": "Password",
    "auth.login": "Login",
    "auth.register": "Register",
    "auth.firstName": "First Name",
    "auth.lastName": "Last Name",
    "auth.age": "Age",
    "auth.aadhaar": "Aadhaar Card Number",
    "auth.dontHaveAccount": "Don't have an account?",
    "auth.alreadyHaveAccount": "Already have an account?",

    "features.title": "Why SMART Bus Navigator?",
    "features.smartRoutes": "Smart Routes",
    "features.smartRoutesDesc": "AI-recommended route combinations across Delhi, Haryana, UP & Punjab",
    "features.liveSim": "Live Simulation",
    "features.liveSimDesc": "Real-time bus position tracking with arrival predictions",
    "features.crowdIntell": "Crowd Intelligence",
    "features.crowdIntellDesc": "Know crowd levels before you board — plan a comfortable journey",
    "features.accountability": "Report",
    "features.accountabilityDesc": "Report issues directly and track government response",

    "routes.title": "Popular Routes Today",
    "routes.time": "time",
  },
  hi: {
    "nav.home": "होम",
    "nav.findRoute": "रूट खोजें",
    "nav.report": "रिपोर्ट",
    "nav.admin": "एडमिन",
    "nav.loginRegister": "लॉगिन / रजिस्टर",
    "nav.contactUs": "संपर्क करें",
    "nav.alerts": "अलर्ट",
    "nav.ewallet": "ई-वॉलेट",
    "nav.buses": "बसें",
    "nav.meals": "भोजन",
    "nav.liveMap": "लाइव मैप",
    "nav.profile": "प्रोफ़ाइल",
    
    "brand.title": "मेरी बस कहाँ है",
    "brand.subtitle": "स्मार्ट नेविगेटर",

    "testimonials.title": "यात्री क्या कह रहे हैं",
    "testimonials.subtitle": "दिल्ली, हरियाणा और पंजाब के वास्तविक यात्रियों के वास्तविक अनुभव",
    "testimonials.badge": "यात्री की आवाज़",
    "testimonials.reviews": "यात्री समीक्षाएँ",
    "testimonials.share": "अपना अनुभव साझा करें",
    "testimonials.rating": "आपकी रेटिंग *",
    "testimonials.nameOpt": "आपका नाम (वैकल्पिक)",
    "testimonials.shareExp": "ऐप के साथ अपना अनुभव साझा करें...",
    "testimonials.btn": "अनुभव साझा करें",
    "testimonials.sending": "भेजा जा रहा है...",
    "testimonials.thanks": "आपकी प्रतिक्रिया के लिए धन्यवाद!",
    "testimonials.thanksSub": "आपका अनुभव हमें बेहतर बनाने में मदद करता है।",
    "testimonials.submitAnother": "एक और सबमिट करें",

    "search.originDest": "मूल = गंतव्य?",
    "search.sameStopMsg": "कोई बस मार्ग एक ही स्टॉप से शुरू और समाप्त नहीं हो सकता! कृपया दो अलग-अलग स्थान चुनें।",
    "search.searchAgain": "फिर से खोजें",
    "search.loading": "रूट्स और शेड्यूल का विश्लेषण किया जा रहा है...",
    "search.route": "रूट",
    "search.vehicle": "वाहन",
    "search.towards": "की ओर",
    "search.passed": "गुजर चुकी है",
    "search.alreadyDeparted": "पहले ही निकल चुकी है",
    "search.estimatedArrival": "अनुमानित आगमन",
    "search.arrivalAtStart": "शुरुआती बिंदु पर आगमन",
    "search.fare": "किराया",
    "search.passengers": "यात्री",
    "search.lastPing": "अंतिम पिंग",
    "search.ago": "पहले",
    "search.openLiveMap": "लाइव ट्रैकिंग मैप खोलें",
    "search.startEnd": "प्रारंभिक और अंतिम बिंदु",
    "search.approachingBuses": "आने वाली बसें",
    "search.approachingStop": "आपके स्टॉप पर आ रही हैं",
    "search.noBuses": "इस समय इस रूट के लिए कोई आने वाली बस नहीं मिली।",
    "search.min": "मिनट",

    "track.resolving": "बस आईडी जांची जा रही है...",
    "track.connecting": "लाइव बस फ़ीड से कनेक्ट हो रहा है...",
    "track.unavailable": "ट्रैकिंग उपलब्ध नहीं है",
    "track.notFound": "बस सिस्टम में नहीं मिली।",
    "track.loadError": "बस डेटा लोड नहीं किया जा सका।",
    "track.retry": "पुनः प्रयास करें",
    "track.goBack": "वापस जाएं",
    "track.status": "लाइव स्थिति",
    "track.speed": "गति",
    "track.totalDist": "कुल दूरी",
    "track.totalTime": "कुल समय",
    "track.reachIn": "पहुँचने का समय",
    "track.delay": "विलंब",
    "track.onTime": "समय पर",
    "track.reached": "पहुँच गया",
    "track.currentlyAt": "वर्तमान स्थान",
    "track.nextStop": "अगला स्टॉप",
    "track.away": "दूर",
    "track.occupancy": "यात्री क्षमता",
    "track.liveRoute": "लाइव रूट",
    "track.refreshing": "रिफ्रेश हो रहा है",
    "track.vehicle": "वाहन",
    "track.route": "रूट",
    "track.towards": "की ओर",
    "track.routeTimeline": "रूट टाइमलाइन",
    
    "contact.helpline": "हेल्पलाइन",
    "contact.helplineSub": "सोम-शनि, सुबह 8 - रात 8",
    "contact.email": "ईमेल",
    "contact.emailSub": "24 घंटे के भीतर प्रतिक्रिया",
    "contact.office": "प्रधान कार्यालय",
    "contact.officeVal": "नई दिल्ली, भारत",
    "contact.officeSub": "सरकारी परिवहन विंग",

    "hero.bookTicket": "रूट्स खोजें",
    "hero.from": "कहाँ से",
    "hero.to": "कहाँ तक",
    "hero.date": "दिन/महीना/वर्ष *",
    "hero.classes": "सभी श्रेणियां",
    "hero.search": "खोजें",
    "hero.title": "स्मार्ट बस ट्रांसपोर्ट",
    "hero.subtitle": "सुरक्षा | संरक्षित | समय की पाबंदी",
    "hero.general": "सामान्य",
    "hero.disability": "दिव्यांग रियायत",
    "hero.flexible": "तारीख के साथ लचीला",
    "hero.pass": "बस पास रियायत",
    
    "auth.mobile": "मोबाइल नंबर",
    "auth.password": "पासवर्ड",
    "auth.login": "लॉगिन",
    "auth.register": "रजिस्टर",
    "auth.firstName": "पहला नाम",
    "auth.lastName": "अंतिम नाम",
    "auth.age": "आयु",
    "auth.aadhaar": "आधार कार्ड नंबर",
    "auth.dontHaveAccount": "क्या आपके पास खाता नहीं है?",
    "auth.alreadyHaveAccount": "क्या आपके पास पहले से खाता है?",

    "features.title": "स्मार्ट बस नेविगेटर क्यों?",
    "features.smartRoutes": "स्मार्ट रूट्स",
    "features.smartRoutesDesc": "दिल्ली, हरियाणा, यूपी और पंजाब में एआई-अनुशंसित रूट संयोजन",
    "features.liveSim": "लाइव सिमुलेशन",
    "features.liveSimDesc": "आगमन भविष्यवाणियों के साथ वास्तविक समय बस स्थिति ट्रैकिंग",
    "features.crowdIntell": "भीड़ खुफिया",
    "features.crowdIntellDesc": "चढ़ने से पहले भीड़ का स्तर जानें - आरामदायक यात्रा की योजना बनाएं",
    "features.accountability": "जवाबदेही",
    "features.accountabilityDesc": "समस्याओं की सीधे रिपोर्ट करें और सरकारी प्रतिक्रिया को ट्रैक करें",

    "routes.title": "आज के लोकप्रिय रूट्स",
    "routes.time": "समय",
  }
};

type FontSize = "small" | "normal" | "large";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const [fontSize, setFontSize] = useState<FontSize>("normal");

  // Apply font size to <html> root so all rem-based sizes scale
  useEffect(() => {
    const sizeMap: Record<FontSize, string> = {
      small:  "14px",
      normal: "16px",
      large:  "18px",
    };
    document.documentElement.style.fontSize = sizeMap[fontSize];
  }, [fontSize]);

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, fontSize, setFontSize }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

"use client";

import { createContext, useContext, useState, ReactNode } from "react";

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
    
    "hero.bookTicket": "Look for routes",
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
    "features.accountability": "Accountability",
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
    
    "hero.bookTicket": "टिकट बुक करें",
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

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
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

"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { 
  BookOpen, Compass, ShieldAlert, HelpCircle, Search, 
  ChevronRight, ArrowRight, MessageSquare, PhoneCall, 
  Map, Users, Sparkles, Clock, Globe, Download
} from "lucide-react";

// Bilingual content object
const DOCS = {
  en: {
    title: "Help & Documentation",
    subtitle: "Learn how to use Where Is My Bus like a pro. Find quick answers, tutorials, and deep dives into our technical infrastructure.",
    searchPlaceholder: "Search guides, features, or FAQs...",
    categories: {
      gettingStarted: "Getting Started",
      coreFeatures: "Core Features",
      safety: "Safety & Emergency",
      faqs: "FAQs & Troubleshooting"
    },
    sections: [
      {
        id: "tracking",
        category: "coreFeatures",
        title: "Real-time Live GPS Tracking",
        icon: Compass,
        desc: "Watch your transit route move live on detailed interactive maps with zero latency.",
        content: `
### Real-world Road Geometries
Unlike typical tracking apps that show straight lines between stops, our system queries and renders actual physical road alignments using open-source routing APIs. This ensures you know the exact path your bus is taking.

### High-frequency Telemetry
Each bus transmits active GPS telemetry coordinates every 10–20 seconds. This live ping is rendered instantly as a moving icon on the map with a glowing animation to indicate active communication.

### Real-time ETAs
Instead of relying on rigid, outdated paper timetables, our proprietary prediction engine calculates arriving speed, remaining physical distance along the road network, and historical traffic indexes to predict arriving time dynamically.
        `
      },
      {
        id: "sos",
        category: "safety",
        title: "Emergency SOS Integration (100)",
        icon: ShieldAlert,
        desc: "Our high-priority life safety feature designed to keep commuters safe during critical times.",
        content: `
### One-Tap Dispatch
In critical situations, holding down the red floating SOS button for 2 seconds opens a physical dialer connected to the regional police emergency number (100).

### Advanced Telemetry Logging
When clicked, the app sends an secure background request containing:
- **Timestamp** of the incident.
- **Client IP address** for precise spatial locating.
- **Active Bus ID** (if triggered while tracking).

### Network Hardening (Keepalive)
Using modern HTML5 \`keepalive: true\` parameters, we ensure that the network logs reach our databases even if the user closes the browser or switches to the phone app.
        `
      },
      {
        id: "reporting",
        category: "coreFeatures",
        title: "Community Issue Reporting",
        icon: MessageSquare,
        desc: "Lodge real-time issues on overcrowding, delays, or broken amenities directly to administrators.",
        content: `
### Automated Bus ID Passing
If you experience an issue on a specific bus, tapping "Report" directly from that bus's tracking page pre-fills the Bus ID inside the form automatically so you don't have to memorize it.

### Admin Review Portal
All community feedback is monitored on our advanced Administrator Dashboard. Admins inspect issue locations, review user descriptions, and have permissions to securely delete outdated feedback when resolved.
        `
      },
      {
        id: "pwa",
        category: "gettingStarted",
        title: "Progressive Web App (PWA) Install",
        icon: Download,
        desc: "Install the app directly on your mobile device or desktop for instant standalone access.",
        content: `
### Home Screen Access
To experience full-screen standalone mode, tap the floating "Install App" banner at the bottom of the home screen, or select "Add to Home Screen" inside your web browser.

### Offline Operation
The application caches key route details, localized texts, and UI layouts to ensure you can load the schedule and contact numbers even in areas with zero cellular reception.
        `
      },
      {
        id: "bilingual",
        category: "gettingStarted",
        title: "Multi-Language Localization",
        icon: Globe,
        desc: "Switch dynamically between English and Hindi with full local settings preservation.",
        content: `
### Seamless Switching
Tap the language toggle in the top bar to translate the entire website instantly.

### Persistent Preferences
Your language and customized font preferences are saved in your browser's persistent storage, ensuring you never have to reconfigure them on subsequent visits.
        `
      }
    ],
    faqs: [
      {
        q: "Why is the live bus location not moving?",
        a: "Buses update their positions every 10–20 seconds. If a bus remains static for longer, it may have stopped at a major bus stand or signal, or has temporarily lost cellular connection."
      },
      {
        q: "Does the SOS button call the police automatically?",
        a: "For security, holding the SOS button triggers a quick background data dispatch to the admin logs and automatically loads '100' on your mobile dialer, requiring a single tap from you to confirm the call."
      },
      {
        q: "How do I log in to the administrator portal?",
        a: "Navigate to the admin portal path. Enter your secure administrator token in the field to authenticate and gain access to the audit logs."
      }
    ]
  },
  hi: {
    title: "सहायता और दस्तावेज़",
    subtitle: "Where Is My Bus का उपयोग एक पेशेवर की तरह करना सीखें। त्वरित उत्तर, ट्यूटोरियल और हमारे तकनीकी ढांचे के बारे में विस्तृत जानकारी प्राप्त करें।",
    searchPlaceholder: "गाइड, सुविधाएं या अक्सर पूछे जाने वाले प्रश्न खोजें...",
    categories: {
      gettingStarted: "शुरुआत करना",
      coreFeatures: "मुख्य विशेषताएं",
      safety: "सुरक्षा और आपातकाल",
      faqs: "अक्सर पूछे जाने वाले प्रश्न"
    },
    sections: [
      {
        id: "tracking",
        category: "coreFeatures",
        title: "वास्तविक समय लाइव जीपीएस ट्रैकिंग",
        icon: Compass,
        desc: "बिना किसी देरी के विस्तृत इंटरैक्टिव मानचित्रों पर अपने मार्ग को लाइव देखें।",
        content: `
### वास्तविक सड़क मार्ग
अन्य ट्रैकिंग ऐप्स के विपरीत जो स्टॉप के बीच सीधी रेखाएं दिखाते हैं, हमारा सिस्टम वास्तविक सड़क संरेखण का उपयोग करता है। इससे सुनिश्चित होता है कि आपको बस का सटीक मार्ग पता हो।

### उच्च आवृत्ति टेलीमेट्री
प्रत्येक बस हर 10-20 सेकंड में जीपीएस टेलीमेट्री कोऑर्डिनेट्स भेजती है। यह लाइव पिंग मानचित्र पर एक सक्रिय बस आइकन के रूप में तुरंत रेंडर होता है।

### वास्तविक समय आगमन समय (ETA)
पुराने टाइमटेबल पर निर्भर रहने के बजाय, हमारा भविष्यवाणी इंजन दूरी, गति और यातायात के आधार पर गतिशील रूप से आगमन समय की गणना करता है।
        `
      },
      {
        id: "sos",
        category: "safety",
        title: "आपातकालीन एसओएस एकीकरण (100)",
        icon: ShieldAlert,
        desc: "कम्यूटर्स को संकट के समय सुरक्षित रखने के लिए डिज़ाइन की गई हमारी उच्च-प्राथमिकता वाली जीवन सुरक्षा सुविधा।",
        content: `
### एक-टैप डिस्पैच
गंभीर परिस्थितियों में, लाल तैरते हुए SOS बटन को 2 सेकंड तक दबाए रखने से क्षेत्रीय पुलिस आपातकालीन नंबर (100) डायल करने के लिए मोबाइल डायलर खुल जाता है।

### उन्नत टेलीमेट्री लॉगिंग
क्लिक करने पर, ऐप निम्न डेटा के साथ एक सुरक्षित पृष्ठभूमि अनुरोध भेजता है:
- घटना का **समय**।
- सटीक स्थान के लिए **क्लाइंट आईपी पता**।
- **सक्रिय बस आईडी** (यदि ट्रैकिंग के दौरान ट्रिगर किया गया हो)।

### नेटवर्क सुरक्षा (Keepalive)
आधुनिक HTML5 \`keepalive: true\` मापदंडों का उपयोग करते हुए, हम सुनिश्चित करते हैं कि नेटवर्क लॉग हमारे डेटाबेस तक पहुंचें, भले ही उपयोगकर्ता ब्राउज़र बंद कर दे।
        `
      },
      {
        id: "reporting",
        category: "coreFeatures",
        title: "सामुदायिक समस्या रिपोर्टिंग",
        icon: MessageSquare,
        desc: "भीड़भाड़, देरी या टूटी हुई सुविधाओं की वास्तविक समय की समस्याओं को सीधे प्रशासकों को रिपोर्ट करें।",
        content: `
### स्वचालित बस आईडी
यदि आप किसी विशिष्ट बस में समस्या का सामना करते हैं, तो उस बस के ट्रैकिंग पेज से सीधे "रिपोर्ट" पर टैप करने से फॉर्म के भीतर बस आईडी स्वचालित रूप से भर जाती है।

### व्यवस्थापक समीक्षा पोर्टल
सभी सामुदायिक फीडबैक की निगरानी हमारे उन्नत एडमिनिस्ट्रेटर डैशबोर्ड पर की जाती है। व्यवस्थापक समस्याओं की समीक्षा करते हैं और उनके पास फीडबैक को सुरक्षित रूप से हटाने की अनुमति होती है।
        `
      },
      {
        id: "pwa",
        category: "gettingStarted",
        title: "प्रोग्रेसिव वेब ऐप (PWA) इंस्टॉल करें",
        icon: Download,
        desc: "त्वरित उपयोग के लिए ऐप को सीधे अपने मोबाइल डिवाइस या डेस्कटॉप पर इंस्टॉल करें।",
        content: `
### होम स्क्रीन एक्सेस
स्टैंडअलोन मोड का अनुभव करने के लिए, होम स्क्रीन के नीचे तैरते हुए "ऐप इंस्टॉल करें" बैनर पर टैप करें, या अपने ब्राउज़र में "होम स्क्रीन पर जोड़ें" चुनें।

### ऑफ़लाइन संचालन
एप्लिकेशन प्रमुख मार्ग विवरण और संपर्क नंबरों को कैश करता है ताकि आप बिना मोबाइल नेटवर्क के भी आवश्यक जानकारी लोड कर सकें।
        `
      },
      {
        id: "bilingual",
        category: "gettingStarted",
        title: "बहुभाषी अनुवाद",
        icon: Globe,
        desc: "पसंदीदा सेटिंग्स के साथ अंग्रेजी और हिंदी के बीच आसानी से स्विच करें।",
        content: `
### आसान बदलाव
पूरी वेबसाइट का तुरंत अनुवाद करने के लिए शीर्ष बार में भाषा टॉगल पर टैप करें।

### स्थायी प्राथमिकताएं
आपकी भाषा और फ़ॉन्ट प्राथमिकताएं आपके ब्राउज़र में सहेज ली जाती हैं, जिससे अगली बार आने पर आपको इन्हें फिर से सेट नहीं करना पड़ता।
        `
      }
    ],
    faqs: [
      {
        q: "लाइव बस की स्थिति क्यों नहीं हिल रही है?",
        a: "बसें हर 10-20 सेकंड में अपनी स्थिति अपडेट करती हैं। यदि बस लंबे समय तक स्थिर रहती है, तो हो सकता है कि वह किसी प्रमुख स्टैंड या सिग्नल पर रुकी हो, या उसका नेटवर्क अस्थायी रूप से टूट गया हो।"
      },
      {
        q: "क्या SOS बटन स्वचालित रूप से पुलिस को कॉल करता है?",
        a: "सुरक्षा के लिए, SOS बटन दबाने पर व्यवस्थापक लॉग को डेटा भेज दिया जाता है और आपके मोबाइल डायलर पर '100' लोड हो जाता है, जिससे कॉल शुरू करने के लिए आपको सिर्फ एक बार टैप करना होता है।"
      },
      {
        q: "मैं एडमिन पोर्टल पर कैसे लॉग इन करूं?",
        a: "एडमिन पोर्टल मार्ग पर जाएं। लॉग इन करने और ऑडिट लॉग तक पहुंच प्राप्त करने के लिए क्षेत्र में अपना सुरक्षित व्यवस्थापक टोकन दर्ज करें।"
      }
    ]
  }
};

export default function HelpPage() {
  const { language } = useLanguage();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const t = DOCS[language === "hi" ? "hi" : "en"];

  // Filter sections by search and category
  const filteredSections = t.sections.filter(sec => {
    const matchesSearch = 
      sec.title.toLowerCase().includes(search.toLowerCase()) || 
      sec.desc.toLowerCase().includes(search.toLowerCase()) ||
      sec.content.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "all" || sec.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 rounded-full px-4 py-1.5 text-brand-700 text-xs font-bold uppercase tracking-widest mb-4">
            <HelpCircle className="w-4 h-4 text-brand-500 animate-pulse" />
            {language === "hi" ? "सहायता केंद्र" : "Documentation Center"}
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-4">
            {t.title}
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-10 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-2xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-sm text-sm sm:text-base transition-all"
          />
        </div>

        {/* Categories Tab Bar */}
        <div className="flex flex-wrap gap-2 justify-center mb-12 border-b border-gray-200 pb-6">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeCategory === "all"
                ? "bg-brand-600 text-white shadow-lg shadow-brand-100"
                : "bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {language === "hi" ? "सभी मार्गदर्शिकाएँ" : "All Guides"}
          </button>
          {Object.entries(t.categories).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeCategory === key
                  ? "bg-brand-600 text-white shadow-lg shadow-brand-100"
                  : "bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Documentation Content Sections */}
        <div className="space-y-8 mb-16">
          {filteredSections.length > 0 ? (
            filteredSections.map(sec => {
              const IconComp = sec.icon;
              return (
                <div 
                  key={sec.id} 
                  id={`doc-${sec.id}`}
                  className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm transition-all duration-300 hover:shadow-md hover:border-brand-200 relative overflow-hidden group"
                >
                  <div className="absolute top-0 left-0 w-2 h-full bg-brand-500 transform scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300" />
                  
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-brand-50 rounded-xl text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors duration-300">
                      <IconComp className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-widest text-brand-500 block mb-1">
                        {t.categories[sec.category as keyof typeof t.categories]}
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight group-hover:text-brand-700 transition-colors">
                        {sec.title}
                      </h2>
                    </div>
                  </div>

                  <p className="text-gray-500 font-medium text-sm sm:text-base border-b border-gray-100 pb-4 mb-6">
                    {sec.desc}
                  </p>

                  <div className="prose prose-blue max-w-none text-gray-600 text-sm sm:text-base leading-relaxed space-y-4 whitespace-pre-line">
                    {sec.content}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl p-8">
              <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-800 font-bold text-lg">
                {language === "hi" ? "कोई गाइड नहीं मिली" : "No guides match your search"}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {language === "hi" ? "कृपया कुछ अलग खोजने का प्रयास करें।" : "Try refining your search keywords or selection."}
              </p>
              <button 
                onClick={() => { setSearch(""); setActiveCategory("all"); }}
                className="mt-4 px-4 py-2 bg-brand-50 text-brand-600 font-bold rounded-xl text-xs hover:bg-brand-100 transition-colors"
              >
                {language === "hi" ? "फ़िल्टर साफ़ करें" : "Reset Filters"}
              </button>
            </div>
          )}
        </div>

        {/* FAQs Accordion */}
        {activeCategory === "all" || activeCategory === "faqs" ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-6 flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-brand-500" />
              {language === "hi" ? "अक्सर पूछे जाने वाले प्रश्न" : "Frequently Asked Questions"}
            </h2>
            <div className="divide-y divide-gray-100">
              {t.faqs.map((faq, i) => (
                <div key={i} className="py-4 first:pt-0 last:pb-0">
                  <h3 className="font-bold text-gray-900 text-base flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 mt-1 text-brand-500 flex-shrink-0" />
                    {faq.q}
                  </h3>
                  <p className="text-gray-500 text-sm pl-6 mt-1.5 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
}

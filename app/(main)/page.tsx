"use client";

import HeroSearchBox from "@/components/search/HeroSearchBox";
import FeatureCards from "@/components/layout/FeatureCards";
import PopularRoutes from "@/components/layout/PopularRoutes";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { useState, useEffect } from "react";
import { Star, Send, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";

// ── Static passenger testimonials ────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: "Ramesh Kumar",
    route: "Sonipat → Delhi",
    rating: 5,
    text: "Live bus tracking saved me 30 minutes of waiting! I knew exactly when the HR-29 would arrive. This app is a game changer for daily commuters.",
    avatar: "RK",
    color: "bg-blue-600",
  },
  {
    name: "Priya Sharma",
    route: "Narela → Anand Vihar",
    rating: 4,
    text: "The crowd intelligence feature is so useful during rush hour. I wait for the next bus when it shows 'Very Crowded'. Much more comfortable journeys now.",
    avatar: "PS",
    color: "bg-pink-600",
  },
  {
    name: "Gurpreet Singh",
    route: "Chandigarh → Delhi",
    rating: 5,
    text: "Reported a broken AC in a bus via the app. Within 2 days I got a response that it was fixed. Finally some accountability in public transport!",
    avatar: "GS",
    color: "bg-orange-600",
  },
  {
    name: "Anita Verma",
    route: "Noida → Bawana",
    rating: 4,
    text: "The Hindi language option makes it so accessible. My mother who doesn't read English can now use it easily. Please keep adding more regional languages.",
    avatar: "AV",
    color: "bg-green-600",
  },
  {
    name: "Deepak Yadav",
    route: "Delhi → Chandigarh",
    rating: 5,
    text: "ETA predictions are surprisingly accurate. The simulation matches real-world timings within 2-3 minutes. Great engineering work by the team!",
    avatar: "DY",
    color: "bg-purple-600",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-4 h-4 ${i <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
      ))}
    </div>
  );
}

// ── Feedback form ─────────────────────────────────────────────────────────────
function FeedbackForm() {
  const [rating, setRating]     = useState(0);
  const [hover,  setHover]      = useState(0);
  const [name,   setName]       = useState("");
  const [text,   setText]       = useState("");
  const [done,   setDone]       = useState(false);
  const [loading, setLoading]   = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating || !text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || "Anonymous", rating, text: text.trim() }),
      });
      const data = await res.json();
      if (data.success) setDone(true);
    } finally {
      setLoading(false);
    }
  }

  if (done) return (
    <div className="text-center py-8">
      <div className="text-5xl mb-3">🙏</div>
      <p className="text-white font-bold text-lg">Thank you for your feedback!</p>
      <p className="text-blue-200 text-sm mt-1">Your experience helps us improve.</p>
      <button onClick={() => { setDone(false); setRating(0); setName(""); setText(""); }}
        className="mt-4 text-xs text-blue-300 underline hover:text-white">Submit another</button>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <p className="text-blue-200 text-sm font-semibold mb-2">Your Rating *</p>
        <div className="flex gap-1">
          {[1,2,3,4,5].map(i => (
            <button key={i} type="button"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(i)}>
              <Star className={`w-8 h-8 transition-colors ${i <= (hover || rating) ? "fill-amber-400 text-amber-400" : "text-white/30"}`} />
            </button>
          ))}
        </div>
      </div>
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Your name (optional)"
        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/60"
      />
      <textarea
        rows={3}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Share your experience with the app..."
        required
        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/60 resize-none"
      />
      <button
        type="submit"
        disabled={!rating || !text.trim() || loading}
        className="w-full bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-gray-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
      >
        {loading ? "Sending..." : <><Send className="w-4 h-4" /> Share Experience</>}
      </button>
    </form>
  );
}

// ── Testimonials carousel — reads from DB ─────────────────────────────────────
function TestimonialsCarousel() {
  const [items, setItems] = useState(TESTIMONIALS);
  const [idx,   setIdx]   = useState(0);

  useEffect(() => {
    fetch("/api/feedback")
      .then(r => r.json())
      .then(d => {
        if (d.feedback?.length) {
          setItems(d.feedback.map((f: any) => ({
            name:   f.name,
            route:  f.route || "App User",
            rating: f.rating,
            text:   f.text,
            avatar: f.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase(),
            color:  "bg-blue-600",
          })));
          setIdx(0);
        }
      })
      .catch(() => {}); // fall back to static on error
  }, []);

  const prev = () => setIdx(i => (i - 1 + items.length) % items.length);
  const next = () => setIdx(i => (i + 1) % items.length);
  const t = items[idx];

  return (
    <div className="relative">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 min-h-[200px] flex flex-col justify-between">
        <div>
          <StarRating rating={t.rating} />
          <p className="text-white mt-3 text-sm leading-relaxed">"{t.text}"</p>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white font-black text-sm flex-shrink-0`}>
            {t.avatar}
          </div>
          <div>
            <p className="text-white font-bold text-sm">{t.name}</p>
            <p className="text-blue-300 text-xs">{t.route}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3">
        <button onClick={prev} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex gap-1.5">
          {items.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === idx ? "bg-white w-4" : "bg-white/30"}`} />
          ))}
        </div>
        <button onClick={next} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col pt-0">

      {/* Hero Section */}
      <div className="relative bg-brand-100 flex-1 flex flex-col justify-center py-8 lg:py-16 overflow-hidden">

        {/* Background — z-0 so it stays behind content */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="w-full h-full bg-gradient-to-r from-blue-100 to-blue-300 relative">
            <svg className="absolute right-0 bottom-0 max-w-full h-auto opacity-30 text-brand-300"
              viewBox="0 0 800 600" fill="currentColor" aria-hidden="true">
              <path d="M100,500 C300,500 400,200 700,200 L800,200 L800,600 L100,600 Z" />
            </svg>
          </div>
        </div>

        {/* Content — z-10 so it stays above background */}
        <div className="max-w-7xl mx-auto px-4 w-full relative z-10 flex flex-col lg:flex-row items-center gap-10">

          {/* Left: Search Box */}
          <div className="w-full lg:w-5/12 flex-shrink-0 animate-in slide-in-from-left duration-500">
            <HeroSearchBox />
          </div>

          {/* Right: Title */}
          <div className="w-full lg:w-7/12 text-center lg:text-right text-[#213d77] animate-in slide-in-from-right duration-500 hidden lg:block">
            <h1 className="text-5xl lg:text-7xl font-black mb-4 tracking-tighter uppercase drop-shadow-md">
              {t("hero.title")}
            </h1>
            <div className="flex items-center justify-end gap-4 text-xl lg:text-3xl font-medium tracking-wide">
              <span>{t("hero.subtitle").split(" | ")[0]}</span>
              <span className="w-1.5 h-10 bg-[#fb792b]" />
              <span>{t("hero.subtitle").split(" | ")[1]}</span>
              <span className="w-1.5 h-10 bg-[#fb792b]" />
              <span>{t("hero.subtitle").split(" | ")[2]}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white">
        <FeatureCards />
        <PopularRoutes />
      </div>

      {/* ── Passenger Experience & Contact Section ─────────────────────────── */}
      <section id="contact" className="bg-gradient-to-br from-brand-700 via-brand-800 to-blue-900 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-blue-200 text-xs font-bold uppercase tracking-widest mb-4">
              <MessageSquare className="w-3.5 h-3.5" />
              Passenger Voices
            </div>
            <h2 className="text-3xl lg:text-4xl font-black text-white mb-3">What Commuters Are Saying</h2>
            <p className="text-blue-300 text-sm max-w-xl mx-auto">Real experiences from real passengers across Delhi, Haryana & Punjab</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-10 items-start">
            {/* Testimonials */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" /> Commuter Reviews
              </h3>
              <TestimonialsCarousel />
            </div>

            {/* Feedback form */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-300" /> Share Your Experience
              </h3>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <FeedbackForm />
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div className="mt-14 pt-8 border-t border-white/10 grid sm:grid-cols-3 gap-6 text-center">
            {[
              { emoji: "📞", label: "Helpline",    value: "1800-200-1234",       sub: "Mon–Sat, 8am–8pm" },
              { emoji: "✉️", label: "Email",       value: "support@wimb.in",     sub: "Response within 24h" },
              { emoji: "📍", label: "Head Office", value: "New Delhi, India",    sub: "Govt. Transport Wing" },
            ].map(({ emoji, label, value, sub }) => (
              <div key={label} className="bg-white/5 rounded-2xl p-5 border border-white/10">
                <div className="text-3xl mb-2">{emoji}</div>
                <p className="text-blue-300 text-xs uppercase tracking-widest font-bold mb-1">{label}</p>
                <p className="text-white font-bold">{value}</p>
                <p className="text-blue-400 text-xs mt-1">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}

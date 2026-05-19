import { X, Phone } from "lucide-react";

export function SOSModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-red-600 px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-red-200 text-xs uppercase tracking-widest font-bold">Emergency</p>
            <h2 className="text-white text-2xl font-black">SOS — Get Help Now</h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-3">
          {[
            { label: "Police",              number: "100",      color: "bg-blue-600"  },
            { label: "Ambulance",           number: "108",      color: "bg-green-600" },
            { label: "Women Helpline",      number: "1091",     color: "bg-pink-600"  },
            { label: "Delhi Bus Helpline",  number: "1800-200-1234", color: "bg-orange-600" },
            { label: "Child Helpline",      number: "1098",     color: "bg-purple-600"},
          ].map(({ label, number, color }) => (
            <a key={number} href={`tel:${number}`}
              onClick={() => fetch('/api/sos', { method: 'POST' }).catch(() => {})}
              className={`flex items-center justify-between w-full ${color} text-white px-5 py-3.5 rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all`}>
              <span className="flex items-center gap-2"><Phone className="w-4 h-4" />{label}</span>
              <span className="font-mono text-lg tracking-wider">{number}</span>
            </a>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 pb-4">Tap a number to call immediately</p>
      </div>
    </div>
  );
}

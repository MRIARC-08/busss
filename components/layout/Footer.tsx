import { Bus } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-400 py-8 px-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row
                      items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Bus className="h-4 w-4 text-brand-400" />
          <span className="text-sm text-gray-300 font-medium">
            Smart Bus Navigator
          </span>
        </div>
        <p className="text-xs text-center">
          Prototype · Student Project · Not for production use
        </p>
        <p className="text-xs">
          Data: OpenStreetMap · Simulation based
        </p>
      </div>
    </footer>
  );
}

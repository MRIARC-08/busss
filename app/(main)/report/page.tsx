"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle, Clock, Users,
  Wind, Shield, DollarSign, Wrench,
  CheckCircle, Loader2
} from "lucide-react";
import { Suspense } from "react";

const ISSUE_TYPES = [
  { key: "LATE_BUS",       label: "Late Bus",       icon: Clock,        color: "text-orange-500 bg-orange-50 border-orange-200" },
  { key: "OVERCROWDING",   label: "Overcrowded",    icon: Users,        color: "text-red-500 bg-red-50 border-red-200"          },
  { key: "CLEANLINESS",    label: "Cleanliness",    icon: Wind,         color: "text-blue-500 bg-blue-50 border-blue-200"       },
  { key: "UNSAFE_BEHAVIOR",label: "Unsafe Behavior",icon: Shield,       color: "text-purple-500 bg-purple-50 border-purple-200" },
  { key: "FARE_ISSUE",     label: "Fare Issue",     icon: DollarSign,   color: "text-green-500 bg-green-50 border-green-200"    },
  { key: "VEHICLE_PROBLEM",label: "Vehicle Problem",icon: Wrench,       color: "text-gray-500 bg-gray-50 border-gray-200"       },
];

const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "EMERGENCY"];

function ReportContent() {
  const params    = useSearchParams();
  const preBusNum = params.get("busNumber") || "";

  const [issueType,  setIssueType]  = useState("");
  const [severity,   setSeverity]   = useState("MEDIUM");
  const [description,setDescription]= useState("");
  const [busNumber,  setBusNumber]  = useState(preBusNum);
  const [loading,    setLoading]    = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!issueType || !description) {
      alert("Please select an issue type and write a description");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/reports/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: issueType, severity, description, busNumber }),
      });
      const d = await r.json();
      if (d.success) setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center p-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Report Submitted!</h2>
        <p className="text-gray-500 mb-6">
          Thank you for helping improve government bus transport.
          Your report has been logged.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="bg-brand-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium"
        >
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <AlertCircle className="h-6 w-6 text-red-500" />
          Report a Bus Issue
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Help improve government transport for everyone
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Issue Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Issue Type *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ISSUE_TYPES.map(({ key, label, icon: Icon, color }) => (
              <button
                key={key}
                type="button"
                onClick={() => setIssueType(key)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2
                  text-sm font-medium transition-all
                  ${issueType === key ? color : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"}`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Bus Number */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Bus Number (if known)
          </label>
          <input
            type="text"
            value={busNumber}
            onChange={e => setBusNumber(e.target.value)}
            placeholder="e.g. HR-29-4521"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3
                       focus:border-brand-500 focus:outline-none text-sm"
          />
        </div>

        {/* Severity */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Severity
          </label>
          <div className="flex gap-2">
            {SEVERITIES.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setSeverity(s)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all
                  ${severity === s
                    ? s === "EMERGENCY" ? "bg-red-600 text-white border-red-600"
                    : s === "HIGH"      ? "bg-orange-500 text-white border-orange-500"
                    : s === "MEDIUM"    ? "bg-yellow-500 text-white border-yellow-500"
                    :                    "bg-green-500 text-white border-green-500"
                    : "bg-white text-gray-500 border-gray-200"
                  }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe what happened in detail..."
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3
                       focus:border-brand-500 focus:outline-none text-sm resize-none"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold
                     py-3.5 rounded-xl flex items-center justify-center gap-2
                     transition-colors disabled:opacity-60"
        >
          {loading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
            : <><AlertCircle className="h-4 w-4" /> Submit Report</>
          }
        </button>

      </form>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-gray-400">Loading...</div>}>
      <ReportContent />
    </Suspense>
  );
}

"use client";

import { useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle, Clock, Users,
  Wind, Shield, DollarSign, Wrench,
  CheckCircle, Loader2, Camera, X, Phone
} from "lucide-react";
import { Suspense } from "react";
import { SOSModal } from "@/components/shared/SOSModal";
import { useAuth } from "@/lib/contexts/AuthContext";

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
  const { user }  = useAuth();

  const [issueType,   setIssueType]   = useState("");
  const [severity,    setSeverity]    = useState("MEDIUM");
  const [description, setDescription] = useState("");
  const [busNumber,   setBusNumber]   = useState(preBusNum);
  const [loading,     setLoading]     = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [showSOS,     setShowSOS]     = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [images,      setImages]      = useState<{ file: File; preview: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleImageAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const newImgs = files.slice(0, 3 - images.length).map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages(prev => [...prev, ...newImgs].slice(0, 3));
    e.target.value = "";
  }

  function removeImage(idx: number) {
    setImages(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!issueType || !description) {
      setErrorMessage("Please select an issue type and write a description to submit your report.");
      setShowErrorModal(true);
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
      if (d.success) {
        if (user) {
          const reportKey = `user-logs-reports-${user.mobile}`;
          const current = JSON.parse(localStorage.getItem(reportKey) || "[]");
          const newReport = {
            type: issueType,
            severity,
            description,
            busNumber,
            timestamp: new Date().toISOString(),
          };
          const updated = [newReport, ...current].slice(0, 10);
          localStorage.setItem(reportKey, JSON.stringify(updated));
        }
        setSubmitted(true);
      }
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
          Your report has been logged and will be reviewed.
        </p>
        <button
          onClick={() => { setSubmitted(false); setImages([]); }}
          className="bg-brand-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium"
        >
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <>
      {showSOS && <SOSModal onClose={() => setShowSOS(false)} />}
      
      {showErrorModal && (
        <div 
          className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setShowErrorModal(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-red-100 animate-in zoom-in-95 duration-200">
            <div className="bg-red-50 p-6 flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 animate-bounce">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">Missing Information</h3>
                <p className="text-sm text-gray-500 mt-2 font-medium leading-relaxed">
                  {errorMessage}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowErrorModal(false)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors shadow-lg shadow-red-200"
              >
                Okay, got it!
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-500" />
              Report a Bus Issue
            </h1>
            <p className="text-gray-500 text-sm mt-1">Help improve government transport for everyone</p>
          </div>
          {/* SOS Button */}
          <button
            onClick={() => setShowSOS(true)}
            className="flex-shrink-0 flex items-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black px-4 py-2.5 rounded-xl shadow-lg shadow-red-200 transition-all animate-pulse"
          >
            <Phone className="w-4 h-4" />
            SOS
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Issue Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Issue Type *</label>
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">Bus Number (if known)</label>
            <input
              type="text"
              value={busNumber}
              onChange={e => setBusNumber(e.target.value)}
              placeholder="e.g. HR-29-4521"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-brand-500 focus:outline-none text-sm"
            />
          </div>

          {/* Severity */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Severity</label>
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
            <textarea
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe what happened in detail..."
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-brand-500 focus:outline-none text-sm resize-none"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Attach Photos <span className="text-gray-400 font-normal">(up to 3)</span>
            </label>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageAdd} />

            <div className="flex flex-wrap gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.preview} alt={`attachment-${idx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {images.length < 3 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-brand-400 hover:text-brand-500 transition-colors"
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-xs font-medium">Add Photo</span>
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">📸 Photos help authorities act faster on your report</p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
              : <><AlertCircle className="h-4 w-4" /> Submit Report</>
            }
          </button>

        </form>
      </div>
    </>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-gray-400">Loading...</div>}>
      <ReportContent />
    </Suspense>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScanFace, Search, ArrowRight } from "lucide-react";

export default function PatientLookup() {
  const router = useRouter();
  const [patientId, setPatientId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = patientId.trim().replace(/^#/, "");
    if (!cleanId) return;
    setLoading(true);
    // Simulate slight delay for effect
    setTimeout(() => {
      router.push(`/dashboard/patient/${cleanId}`);
    }, 400);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-[80vh] flex flex-col justify-center">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Patient Lookup</h1>
        <p className="text-gray-500 mt-3 font-medium text-lg">Scan patient QR code or manually enter ID</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Manual Entry */}
        <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Search size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Manual ID Entry</h2>
          </div>
          
          <form onSubmit={handleLookup} className="flex-1 flex flex-col">
            <input
              type="text"
              placeholder="e.g. PATIENT-12345"
              className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-medium mb-6 flex-1 text-center text-lg tracking-wider"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
            />
            <button
              disabled={loading || !patientId}
              type="submit"
              className="w-full py-4 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? "Searching..." : "Access Records"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        </div>

        {/* QR Scanner Stub */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center text-white relative overflow-hidden group">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
          
          <div className="relative z-10 p-6 bg-white/10 backdrop-blur-md rounded-3xl mb-6 ring-1 ring-white/20 group-hover:scale-105 transition-transform duration-500">
            <ScanFace size={64} className="text-brand-300" strokeWidth={1.5} />
            {/* Animated scanning line */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-brand-400 shadow-[0_0_15px_#f472b6] animate-[scan_2s_ease-in-out_infinite]"></div>
          </div>
          
          <h2 className="relative z-10 text-2xl font-bold mb-2">QR Code Scanner</h2>
          <p className="relative z-10 text-gray-400 font-medium text-sm">
            Point camera at patient&apos;s MammaCare digital card.
          </p>
          
          <button className="relative z-10 mt-8 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/10 rounded-xl font-bold transition-all text-sm">
            Activate Camera
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 10%; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
      `}} />
    </div>
  );
}

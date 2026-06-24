"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BarcodeScanner from "@/components/BarcodeScanner";
import { Camera, ArrowLeft, UserSearch, AlertCircle } from "lucide-react";
import { api } from "@/utils/api";

export default function CameraLookup() {
  const router = useRouter();
  const [error, setError] = useState("");

  const handleScanSuccess = async (decodedText: string) => {
    // Expected format: PATIENT-XXXXX
    if (decodedText.startsWith("PATIENT-")) {
      try {
        await api.post("/hospital/checkin", { patientId: decodedText });
      } catch (err) {
        console.log("Auto-checkin on scan failed or patient already checked in", err);
      }
      router.push(`/dashboard/patient/${decodedText}`);
    } else {
      setError("Invalid patient identifier detected.");
      setTimeout(() => setError(""), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold"
        >
          <ArrowLeft size={20} /> Back to Directory
        </button>
        <div className="text-right">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Identity Scan</h1>
          <p className="text-slate-400 font-medium">Point camera at mobile QR code</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-indigo-600 rounded-[3rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative bg-white rounded-[3rem] p-8 shadow-2xl overflow-hidden min-h-[400px] flex flex-col items-center justify-center">
            <BarcodeScanner 
              onScanSuccess={handleScanSuccess} 
              onScanFailure={(err) => console.log(err)} 
            />
          </div>
        </div>

        {error && (
          <div className="p-6 bg-red-50 text-red-600 rounded-3xl border border-red-100 flex items-center gap-3 animate-bounce">
            <AlertCircle />
            <span className="font-black text-sm uppercase tracking-widest">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
            <UserSearch className="text-indigo-600 mb-2" />
            <h4 className="font-black text-slate-900 text-sm italic">Verification Engine</h4>
            <p className="text-xs text-indigo-400 font-medium mt-1 uppercase tracking-tighter">Automatic ID Detection Active</p>
          </div>
          <div className="p-6 bg-slate-900 rounded-3xl text-white">
            <Camera className="text-slate-400 mb-2" />
            <h4 className="font-black text-sm">Webcam Live</h4>
            <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-tighter">Using Default Hardware Sensor</p>
          </div>
        </div>
      </div>
    </div>
  );
}

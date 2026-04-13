"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/utils/api";
import { 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Siren, 
  User, 
  Radio, 
  Maximize2,
  Camera
} from "lucide-react";
import Link from "next/link";

interface Alert {
  id: string;
  patientId: string;
  patientName: string;
  emergencyContact: string;
  time: string;
}

export default function AlertsDashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const prevAlertCount = useRef(0);

  const fetchAlerts = async () => {
    try {
      const res = await api.get("/hospital/alerts");
      const newAlerts = res.data.alerts;
      
      // TRIGGER SOUND IF NEW ALERTS ARRIVE
      if (newAlerts.length > prevAlertCount.current) {
        console.log("DING! NEW EMERGENCY ALERT RECEIVED");
        // Play simple beep frequency if possible or just visual flare
      }
      prevAlertCount.current = newAlerts.length;
      setAlerts(newAlerts);
    } catch (error) {
      console.error("Failed to fetch alerts", error);
    } finally {
      if (loading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 3000); 
    return () => clearInterval(interval);
  }, [loading]);

  const clearAlert = async (id: string) => {
    try {
      await api.post(`/hospital/alerts/${id}/clear`);
      setAlerts(alerts.filter(a => a.id !== id));
      prevAlertCount.current = prevAlertCount.current - 1;
    } catch (error) {
      console.error("Failed to clear alert", error);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio size={14} className="text-red-500 animate-pulse" />
            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Live Emergency Network</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Emergency Response Hub</h1>
          <p className="text-slate-500 font-medium">Monitoring hospital-wide SOS triggers</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/lookup/camera"
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            <Camera size={18} /> Identify Patient
          </Link>
          <div className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-700 rounded-2xl font-black shadow-inner border border-red-100">
            <Siren size={20} className={alerts.length > 0 ? "animate-pulse" : ""} />
            {alerts.length} Active System Alerts
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid h-64 place-items-center bg-white rounded-[3rem] border border-slate-100 shadow-sm animate-pulse">
          <div className="flex flex-col items-center">
             <Radio size={48} className="text-slate-200 mb-4" />
             <div className="h-4 w-32 bg-slate-100 rounded-full" />
          </div>
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white rounded-[3.5rem] p-24 text-center border-2 border-dashed border-slate-100">
          <div className="inline-flex p-6 bg-emerald-50 rounded-full text-emerald-500 mb-6 shadow-inner ring-8 ring-emerald-50/50">
            <CheckCircle2 size={56} />
          </div>
          <h3 className="text-3xl font-black text-slate-800 tracking-tight">System All-Clear</h3>
          <p className="text-slate-400 mt-2 font-medium max-w-xs mx-auto">No patients currently in emergency state. Real-time network is quiet.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {alerts.map((alert) => (
            <div key={alert.id} className="bg-white p-8 rounded-[3rem] shadow-[0_15px_60px_rgba(0,0,0,0.03)] border-2 border-red-50 flex flex-col md:flex-row items-center justify-between group hover:border-red-200 transition-all overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -mr-16 -mt-16 opacity-20 transition-transform group-hover:scale-150"></div>
              
              <div className="flex items-start gap-6 relative z-10">
                <div className="p-5 bg-red-100 text-red-600 rounded-3xl group-hover:bg-red-600 group-hover:text-white transition-all shadow-xl shadow-red-200/50">
                  <AlertCircle size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    {alert.patientName}
                    <span className="text-[10px] px-3 py-1 bg-red-500 text-white rounded-full font-black tracking-[0.2em] shadow-lg shadow-red-500/20">SOS</span>
                  </h3>
                  <div className="mt-3 flex items-center gap-6 text-sm font-bold text-slate-400">
                    <span className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl">
                      <Clock size={16} />
                      {new Date(alert.time).toLocaleTimeString()}
                    </span>
                    <span className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl">
                      <User size={16} />
                      Emergency Call: {alert.emergencyContact}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-6 md:mt-0 relative z-10 w-full md:w-auto">
                <Link
                  href={`/dashboard/patient/${alert.patientId}`}
                  className="flex-1 md:flex-none text-center px-8 py-4 bg-slate-50 hover:bg-slate-100 text-slate-900 font-black rounded-2xl transition-all border border-slate-100 active:scale-95"
                >
                  Enter Profile
                </Link>
                <button
                  onClick={() => clearAlert(alert.id)}
                  className="flex-1 md:flex-none px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-all shadow-2xl shadow-red-600/20 active:scale-95 flex items-center justify-center gap-2"
                >
                   Clear SOS
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

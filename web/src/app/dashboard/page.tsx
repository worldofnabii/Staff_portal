"use client";

import { useEffect, useState } from "react";
import { api } from "@/utils/api";
import { AlertCircle, Clock, CheckCircle2, Siren, User } from "lucide-react";
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

  const fetchAlerts = async () => {
    try {
      const res = await api.get("/hospital/alerts");
      setAlerts(res.data.alerts);
    } catch (error) {
      console.error("Failed to fetch alerts", error);
    } finally {
      if (loading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const clearAlert = async (id: string) => {
    try {
      await api.post(`/hospital/alerts/${id}/clear`);
      setAlerts(alerts.filter(a => a.id !== id));
    } catch (error) {
      console.error("Failed to clear alert", error);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Active Emergencies</h1>
          <p className="text-gray-500 mt-1 font-medium">Real-time SOS monitoring</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-full font-bold shadow-inner">
          <Siren size={20} className="animate-pulse" />
          {alerts.length} Active
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <div className="animate-pulse flex items-center gap-2">
            <div className="h-4 w-4 bg-gray-300 rounded-full"></div>
            <div className="h-4 w-4 bg-gray-300 rounded-full animation-delay-200"></div>
            <div className="h-4 w-4 bg-gray-300 rounded-full animation-delay-400"></div>
          </div>
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm">
          <div className="inline-flex p-4 bg-green-50 rounded-full text-green-500 mb-4">
            <CheckCircle2 size={48} />
          </div>
          <h3 className="text-xl font-bold text-gray-800">All clear</h3>
          <p className="text-gray-500 mt-2 font-medium">No active SOS alerts at the moment.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-red-100 flex items-center justify-between group hover:border-red-300 transition-all">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-100 text-red-600 rounded-2xl group-hover:scale-110 transition-transform">
                  <AlertCircle size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    {alert.patientName}
                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-black tracking-wide">SOS</span>
                  </h3>
                  <div className="mt-2 flex items-center gap-4 text-sm font-medium text-gray-600">
                    <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg">
                      <Clock size={16} className="text-gray-400" />
                      {new Date(alert.time).toLocaleTimeString()}
                    </span>
                    <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg">
                      <User size={16} className="text-gray-400" />
                      Contact: {alert.emergencyContact}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/dashboard/patient/${alert.patientId}`}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors"
                >
                  View Profile
                </Link>
                <button
                  onClick={() => clearAlert(alert.id)}
                  className="px-5 py-2.5 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 font-bold rounded-xl transition-all shadow-sm"
                >
                  Mark Resolved
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

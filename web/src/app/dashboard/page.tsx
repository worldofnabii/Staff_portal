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
  Camera,
  Trash2,
  TrendingUp,
  Activity,
  UserPlus,
  Users,
  Briefcase,
  Stethoscope
} from "lucide-react";
import Link from "next/link";

interface Alert {
  id: string;
  patientId: string;
  patientName: string;
  emergencyContact: string;
  time: string;
}

interface Appointment {
  id: string;
  patientId: string;
  patient?: { name: string; phone: string } | null;
  date: string;
  purpose: string;
  status: string;
}

export default function AlertsDashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [checkinId, setCheckinId] = useState("");
  const [checkinError, setCheckinError] = useState("");
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");
  const [staff, setStaff] = useState<any[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const prevAlertCount = useRef(0);

  useEffect(() => {
    setRole(localStorage.getItem("staffRole") || "");
  }, []);

  const fetchStaff = async () => {
    setStaffLoading(true);
    try {
      const res = await api.get("/hospital/staff");
      setStaff(res.data.staff || []);
    } catch (error) {
      console.error("Failed to fetch staff list", error);
    } finally {
      setStaffLoading(false);
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [alertsRes, appointRes, queueRes] = await Promise.all([
        api.get("/hospital/alerts"),
        api.get("/hospital/appointments"),
        api.get("/hospital/queue")
      ]);
      
      const newAlerts = alertsRes.data.alerts;
      if (newAlerts.length > prevAlertCount.current) {
        console.log("DING! NEW EMERGENCY ALERT RECEIVED");
      }
      prevAlertCount.current = newAlerts.length;
      setAlerts(newAlerts);
      setAppointments(appointRes.data.appointments || []);
      setQueue(queueRes.data.queue || []);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      if (loading) setLoading(false);
    }
  };

  useEffect(() => {
    if (!role) return;

    if (role === "Admin") {
      fetchStaff();
    } else if (role === "Doctor" || role === "Nurse") {
      fetchDashboardData();
      const interval = setInterval(fetchDashboardData, 3000); 
      return () => clearInterval(interval);
    }
  }, [role]);

  const clearAlert = async (id: string) => {
    try {
      await api.post(`/hospital/alerts/${id}/clear`);
      setAlerts(alerts.filter(a => a.id !== id));
      prevAlertCount.current = prevAlertCount.current - 1;
    } catch (error) {
      console.error("Failed to clear alert", error);
    }
  };

  const handleCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = checkinId.trim().replace(/^#/, "");
    if (!cleanId) return;
    setCheckinLoading(true);
    setCheckinError("");
    try {
      await api.post("/hospital/checkin", { patientId: cleanId });
      setCheckinId("");
      fetchDashboardData();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setCheckinError(err.response?.data?.message || "Check-in failed. Please verify the Patient ID.");
      setTimeout(() => setCheckinError(""), 4000);
    } finally {
      setCheckinLoading(false);
    }
  };

  const removeFromQueue = async (patientId: string) => {
    try {
      await api.post(`/hospital/queue/${patientId}/remove`);
      setQueue(prev => prev.filter(p => p.patientId !== patientId));
    } catch (err) {
      console.error("Failed to remove from queue", err);
    }
  };

  if (role === "Admin") {
    return (
      <AdminDashboard 
        staff={staff}
        fetchStaff={fetchStaff}
        staffLoading={staffLoading}
      />
    );
  }

  if (role === "Nurse") {
    return (
      <NurseDashboard 
        queue={queue}
        appointments={appointments}
        checkinId={checkinId}
        setCheckinId={setCheckinId}
        checkinLoading={checkinLoading}
        checkinError={checkinError}
        handleCheckin={handleCheckin}
        removeFromQueue={removeFromQueue}
      />
    );
  }

  if (role === "Doctor") {
    return (
      <DoctorDashboard 
        alerts={alerts}
        queue={queue}
        appointments={appointments}
        clearAlert={clearAlert}
        removeFromQueue={removeFromQueue}
      />
    );
  }

  // Default combined view for Admin or loading fallback
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

      {/* Patient Intake Queue */}
      <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">{"Today's Intake Queue"}</h2>
            <p className="text-slate-500 text-sm font-medium">Managing checked-in patients, vitals collection, and consultations</p>
          </div>
          
          <form onSubmit={handleCheckin} className="flex items-center gap-3">
            <div className="relative group">
              <input
                type="text"
                placeholder="Patient ID (e.g. PATIENT-002)"
                className="px-5 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none font-semibold text-sm w-64 shadow-inner"
                value={checkinId}
                onChange={(e) => setCheckinId(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={checkinLoading || !checkinId.trim()}
              className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm transition-all disabled:bg-slate-300 shadow-md"
            >
              {checkinLoading ? "Checking in..." : "Check In"}
            </button>
          </form>
        </div>

        {checkinError && (
          <div className="p-4 text-sm font-bold text-red-600 bg-red-50/80 backdrop-blur-md rounded-2xl border border-red-100">
            {checkinError}
          </div>
        )}

        {queue.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Queue is currently empty</p>
            <p className="text-slate-400 text-xs mt-1">Check in a patient above or via the QR Scanner to start intake.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {queue.map((item) => (
              <div key={item.id} className="py-6 flex flex-col md:flex-row items-center justify-between gap-4 group hover:bg-slate-50/30 rounded-xl px-4 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${
                    item.status === 'Vitals Pending' ? 'bg-amber-500 animate-pulse' :
                    item.status === 'Doctor Pending' ? 'bg-blue-500' :
                    'bg-emerald-500'
                  }`} />
                  <div>
                    <h4 className="font-black text-slate-800 text-lg flex items-center gap-3">
                      {item.patientName}
                      <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg font-bold">{item.patientId}</span>
                    </h4>
                    <div className="mt-1 flex items-center gap-4 text-xs font-bold text-slate-400">
                      <span>Checked in: {new Date(item.checkinTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>•</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider ${
                        item.status === 'Vitals Pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        item.status === 'Doctor Pending' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                        'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>{item.status}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {item.status === 'Vitals Pending' && (
                    <Link
                      href={`/dashboard/patient/${item.patientId}`}
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-lg shadow-amber-500/10 active:scale-95 transition-all"
                    >
                      Intake (Take Vitals)
                    </Link>
                  )}
                  {item.status === 'Doctor Pending' && (
                    <Link
                      href={`/dashboard/patient/${item.patientId}`}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-600/10 active:scale-95 transition-all"
                    >
                      Consultation (Doctor)
                    </Link>
                  )}
                  {item.status === 'Completed' && (
                    <span className="px-4 py-2.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-100 flex items-center gap-1.5 leading-none">
                      <CheckCircle2 size={14} /> Completed
                    </span>
                  )}
                  <button
                    onClick={() => removeFromQueue(item.patientId)}
                    className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Remove from queue"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Appointment Notifications Panel */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-slate-800 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black tracking-tighter">Scheduled Facility Visits</h2>
              <p className="text-slate-400 font-medium">Tracking next 24-48 hours of intake</p>
            </div>
            <div className="px-4 py-2 bg-slate-800 rounded-xl text-xs font-bold tracking-widest uppercase text-slate-300 border border-slate-700">
               {appointments.length} Upcoming
            </div>
          </div>

          {appointments.length === 0 ? (
            <div className="py-10 text-center bg-slate-800/50 rounded-[2rem] border border-slate-700/50 border-dashed">
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No Appointments Scheduled</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {appointments.slice(0, 6).map((app) => (
                <div key={app.id} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-brand-500/50 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-slate-700 text-brand-400 rounded-xl flex items-center justify-center font-black group-hover:bg-brand-500 group-hover:text-white transition-all">
                      {app.patient?.name ? app.patient.name.charAt(0) : '?'}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Time</p>
                      <p className="font-bold text-sm">{new Date(app.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <h4 className="font-black text-lg mb-1">{app.patient?.name || 'Unknown Patient'}</h4>
                  <p className="text-xs text-slate-400 font-bold mb-4 flex items-center gap-1 leading-none uppercase tracking-tighter">
                    <Clock size={12}/> {new Date(app.date).toDateString()}
                  </p>
                  <div className="pt-4 border-t border-slate-700 flex justify-between items-center mt-auto">
                    <span className="text-[10px] px-2 py-1 bg-brand-500/10 text-brand-400 rounded-lg font-black uppercase tracking-widest border border-brand-500/20">
                      {app.purpose || 'Routine'}
                    </span>
                    <Link href={`/dashboard/patient/${app.patientId}`} className="text-xs font-black text-slate-400 hover:text-white transition-colors">
                      View Profile →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NurseDashboard({
  queue,
  appointments,
  checkinId,
  setCheckinId,
  checkinLoading,
  checkinError,
  handleCheckin,
  removeFromQueue
}: any) {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">Nurse Intake Workspace</span>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mt-3">Intake & Triage Dashboard</h1>
          <p className="text-slate-500 font-medium">Record patient vitals and manage today's check-ins</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/lookup/camera"
            className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all text-sm"
          >
            <Camera size={18} /> QR Scanner Check-In
          </Link>
          <Link
            href="/dashboard/register"
            className="flex items-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all text-sm"
          >
            <UserPlus size={18} /> Register Patient
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Today's Intake Queue</h2>
            <p className="text-slate-400 text-xs font-semibold">Patients waiting for Vitals check</p>
          </div>
          
          <form onSubmit={handleCheckin} className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Patient ID (e.g. PATIENT-002)"
              className="px-5 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none font-semibold text-sm w-64 shadow-inner"
              value={checkinId}
              onChange={(e) => setCheckinId(e.target.value)}
            />
            <button
              type="submit"
              disabled={checkinLoading || !checkinId.trim()}
              className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm transition-all disabled:bg-slate-300 shadow-md"
            >
              {checkinLoading ? "Checking in..." : "Check In"}
            </button>
          </form>
        </div>

        {checkinError && (
          <div className="p-4 text-sm font-bold text-red-600 bg-red-50/80 backdrop-blur-md rounded-2xl border border-red-100">
            {checkinError}
          </div>
        )}

        {queue.length === 0 ? (
          <div className="py-16 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No patients checked in today</p>
            <p className="text-slate-400 text-xs mt-1">Scan a patient barcode or type their ID above to start.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {queue.map((item: any) => (
              <div key={item.id} className="py-6 flex flex-col md:flex-row items-center justify-between gap-4 rounded-xl px-4 hover:bg-slate-50/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${
                    item.status === 'Vitals Pending' ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'
                  }`} />
                  <div>
                    <h4 className="font-black text-slate-800 text-lg flex items-center gap-3">
                      {item.patientName}
                      <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg font-bold">{item.patientId}</span>
                    </h4>
                    <p className="text-xs text-slate-400 font-semibold mt-1">Checked in at {new Date(item.checkinTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {item.status === 'Vitals Pending' ? (
                    <Link
                      href={`/dashboard/patient/${item.patientId}`}
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-lg shadow-amber-500/10 active:scale-95 transition-all"
                    >
                      Collect Vitals & Intake
                    </Link>
                  ) : (
                    <span className="px-4 py-2 bg-slate-100 text-slate-500 font-bold text-xs rounded-xl border border-slate-200">
                      Vitals Logged ({item.status})
                    </span>
                  )}
                  <button
                    onClick={() => removeFromQueue(item.patientId)}
                    className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-xl space-y-6">
        <h3 className="font-black text-2xl tracking-tighter">Scheduled Antenatal Checkups</h3>
        <p className="text-slate-400 text-xs font-semibold">Today's pre-scheduled facility checkups</p>
        {appointments.length === 0 ? (
          <div className="py-10 text-center bg-slate-850 rounded-[2rem] border border-slate-700/50 border-dashed">
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No appointments scheduled</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {appointments.map((app: any) => (
              <div key={app.id} className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <h4 className="font-black text-lg mb-1">{app.patient?.name || 'Unknown Patient'}</h4>
                <p className="text-xs text-slate-400 font-bold mb-4">{new Date(app.date).toDateString()}</p>
                <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                  <span className="text-[9px] px-2 py-0.5 bg-brand-500/10 text-brand-400 rounded-lg font-black border border-brand-500/20">{app.purpose || 'Routine'}</span>
                  <Link href={`/dashboard/patient/${app.patientId}`} className="text-xs font-bold text-brand-400 hover:text-brand-300">Intake →</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DoctorDashboard({
  alerts,
  queue,
  appointments,
  clearAlert,
  removeFromQueue
}: any) {
  const docQueue = queue.filter((item: any) => item.status === 'Doctor Pending');
  const completedQueue = queue.filter((item: any) => item.status === 'Completed');

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">Doctor Consultation Portal</span>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mt-3">Clinical Operations Dashboard</h1>
          <p className="text-slate-500 font-medium">Respond to SOS emergencies and conduct patient consultations</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-700 rounded-2xl font-black border border-red-100">
            <Radio size={16} className={alerts.length > 0 ? "animate-pulse text-red-600" : ""} />
            {alerts.length} Emergency Alerts
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-2">
          <Radio size={20} className="text-red-500 animate-pulse" /> Live Emergency Response
        </h2>
        {alerts.length === 0 ? (
          <div className="bg-white rounded-[3rem] p-12 text-center border border-slate-100 shadow-sm">
            <div className="inline-flex p-4 bg-emerald-50 text-emerald-500 rounded-full mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">All Patients Secure</h3>
            <p className="text-slate-400 text-xs mt-1">No active SOS alerts currently registered.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {alerts.map((alert: any) => (
              <div key={alert.id} className="bg-white p-6 rounded-3xl border-2 border-red-50 hover:border-red-200 transition-all flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-4 bg-red-55 text-red-600 rounded-2xl">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-lg flex items-center gap-2">
                      {alert.patientName}
                      <span className="text-[9px] px-2 py-0.5 bg-red-500 text-white rounded-md font-black">SOS</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 font-bold">Contact: {alert.emergencyContact} &bull; Received: {new Date(alert.time).toLocaleTimeString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/dashboard/patient/${alert.patientId}`} className="px-6 py-3 bg-slate-900 text-white text-xs font-black rounded-xl">Open Profile</Link>
                  <button onClick={() => clearAlert(alert.id)} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl">Clear SOS</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm space-y-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Today's Consultation Queue</h2>
        <p className="text-slate-400 text-xs font-semibold mt-1">Patients checked in whose vitals are ready for review</p>

        {docQueue.length === 0 && completedQueue.length === 0 ? (
          <div className="py-16 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No patients waiting for consultation</p>
          </div>
        ) : (
          <div className="space-y-6">
            {docQueue.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-brand-600 uppercase tracking-widest">Waiting for Doctor</h3>
                <div className="divide-y divide-slate-100 bg-brand-50/20 p-4 rounded-3xl border border-brand-50">
                  {docQueue.map((item: any) => (
                    <div key={item.id} className="py-4 flex flex-col md:flex-row items-center justify-between gap-4 px-2">
                      <div>
                        <h4 className="font-black text-slate-850 text-base">{item.patientName} <span className="text-xs font-bold text-slate-400 bg-white border px-2 py-0.5 rounded-lg ml-2">{item.patientId}</span></h4>
                        <p className="text-xs text-slate-400 mt-1">Vitals recorded. Ready for consultation.</p>
                      </div>
                      <Link
                        href={`/dashboard/patient/${item.patientId}`}
                        className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-black text-xs rounded-xl shadow-md"
                      >
                        Start Consultation
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {completedQueue.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Completed Consultations</h3>
                <div className="divide-y divide-slate-100">
                  {completedQueue.map((item: any) => (
                    <div key={item.id} className="py-4 flex flex-col md:flex-row items-center justify-between gap-4 px-2 hover:bg-slate-50/50 rounded-xl">
                      <div>
                        <h4 className="font-black text-slate-700 text-base">{item.patientName} <span className="text-xs font-bold text-slate-400 ml-2">{item.patientId}</span></h4>
                        <p className="text-xs text-emerald-600 font-bold mt-1">Consultation completed today.</p>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/dashboard/patient/${item.patientId}`} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl">View Details</Link>
                        <button onClick={() => removeFromQueue(item.patientId)} className="p-2.5 text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-xl space-y-6">
        <h3 className="font-black text-2xl tracking-tighter">Scheduled Antenatal Checkups</h3>
        <p className="text-slate-400 text-xs font-semibold">Today's pre-scheduled facility checkups</p>
        {appointments.length === 0 ? (
          <div className="py-10 text-center bg-slate-850 rounded-[2rem] border border-slate-700/50 border-dashed">
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No appointments scheduled</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {appointments.map((app: any) => (
              <div key={app.id} className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <h4 className="font-black text-lg mb-1">{app.patient?.name || 'Unknown Patient'}</h4>
                <p className="text-xs text-slate-400 font-bold mb-4">{new Date(app.date).toDateString()}</p>
                <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                  <span className="text-[9px] px-2 py-0.5 bg-brand-500/10 text-brand-400 rounded-lg font-black border border-brand-500/20">{app.purpose || 'Routine'}</span>
                  <Link href={`/dashboard/patient/${app.patientId}`} className="text-xs font-bold text-brand-400 hover:text-brand-300">Consultation →</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  mustChangePassword?: boolean;
}

function AdminDashboard({
  staff,
  fetchStaff,
  staffLoading
}: {
  staff: StaffMember[];
  fetchStaff: () => void;
  staffLoading: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleSelect, setRoleSelect] = useState("Doctor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [hospitalName, setHospitalName] = useState("");

  useEffect(() => {
    setHospitalName(localStorage.getItem("hospitalName") || "Our Hospital");
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/hospital/staff", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: roleSelect
      });
      setName("");
      setEmail("");
      setRoleSelect("Doctor");
      setSuccess("Clinical staff member registered successfully! Default password is Welcome123");
      fetchStaff();
      setTimeout(() => setSuccess(""), 8000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add staff member. Check your credentials.");
      setTimeout(() => setError(""), 6000);
    } finally {
      setLoading(false);
    }
  };

  const doctorCount = staff.filter(s => s.role === "Doctor").length;
  const nurseCount = staff.filter(s => s.role === "Nurse").length;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-100">
            Administrative Control Panel
          </span>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mt-3">
            Staff Management Workspace
          </h1>
          <p className="text-slate-500 font-medium">
            Manage clinical staff accounts for <strong className="text-slate-800">{hospitalName}</strong>
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-brand-50 text-brand-600 rounded-2xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Staff</p>
            <h3 className="text-2xl font-black text-slate-800">{staff.length}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Stethoscope size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Active Doctors</p>
            <h3 className="text-2xl font-black text-slate-800">{doctorCount}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-605 text-blue-500 rounded-2xl">
            <Briefcase size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Active Nurses</p>
            <h3 className="text-2xl font-black text-slate-800">{nurseCount}</h3>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-8">
        {/* Left Column: Form to Add Staff */}
        <div className="md:col-span-5">
          <div className="bg-white rounded-[3.0rem] p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Add Clinical Staff</h2>
              <p className="text-slate-400 text-xs font-semibold mt-1">Create accounts for doctors or nurses to log in</p>
            </div>

            {success && (
              <div className="p-4 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-2xl border border-emerald-100">
                {success}
              </div>
            )}

            {error && (
              <div className="p-4 text-xs font-bold text-red-600 bg-red-50 rounded-2xl border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Jane Smith"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none font-semibold text-sm shadow-inner"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                  Work Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="doctor@hospital.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none font-semibold text-sm shadow-inner"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                  Clinical Role *
                </label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none font-semibold text-sm shadow-inner appearance-none"
                  value={roleSelect}
                  onChange={(e) => setRoleSelect(e.target.value)}
                >
                  <option value="Doctor">Doctor</option>
                  <option value="Nurse">Nurse</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm transition-all disabled:bg-slate-300 shadow-md flex items-center justify-center gap-2"
                >
                  {loading ? "Adding..." : "Add Staff Member"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Staff Directory */}
        <div className="md:col-span-7">
          <div className="bg-white rounded-[3.0rem] p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Clinical Staff Directory</h2>
              <p className="text-slate-400 text-xs font-semibold mt-1">Authorized personnel registered at this facility</p>
            </div>

            {staffLoading ? (
              <div className="py-16 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100 animate-pulse">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading directory...</p>
              </div>
            ) : staff.length === 0 ? (
              <div className="py-16 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No Staff Members Found</p>
                <p className="text-slate-400 text-xs mt-1">Add clinical staff members in the panel on the left.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[450px] overflow-y-auto pr-2">
                {staff.map((member) => (
                  <div key={member.id} className="py-4 flex items-center justify-between gap-4 group hover:bg-slate-50/40 rounded-xl px-3 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-inner ${
                        member.role === 'Doctor' ? 'bg-emerald-50 text-emerald-600' :
                        member.role === 'Nurse' ? 'bg-blue-50 text-blue-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          {member.name}
                          {member.mustChangePassword && (
                            <span className="text-[8px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-bold uppercase">Pending Login</span>
                          )}
                        </h4>
                        <p className="text-xs text-slate-400 font-semibold">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        member.role === 'Doctor' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        member.role === 'Nurse' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                        'bg-slate-50 text-slate-600 border border-slate-200'
                      }`}>
                        {member.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

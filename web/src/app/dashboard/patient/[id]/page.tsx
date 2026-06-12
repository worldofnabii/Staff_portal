"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/utils/api";
import { Activity, User as UserIcon, Calendar, Phone, Save, Stethoscope, Droplets, MapPin, Search, TrendingUp, ChevronRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function PatientProfile() {
  const { id } = useParams();
  const [patient, setPatient] = useState<any>(null);
  const [vitalsHistory, setVitalsHistory] = useState<any[]>([]);
  const [medicalHistory, setMedicalHistory] = useState<any>(null);
  const [investigations, setInvestigations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState("Overview");
  const [role, setRole] = useState("");
  
  const [message, setMessage] = useState("");

  const fetchData = async () => {
    try {
      const res = await api.get(`/hospital/patient/${id}`);
      setPatient(res.data.patient);
      setVitalsHistory(res.data.vitals);
      setMedicalHistory(res.data.medicalHistory);
      setInvestigations(res.data.investigations);
    } catch (error) {
      console.error("Failed to fetch", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setRole(localStorage.getItem("staffRole") || "");
    fetchData();
  }, [id]);

  if (loading) return <div className="flex h-[80vh] items-center justify-center p-8">Loading...</div>;
  if (!patient) return <div className="p-8 text-center text-gray-500 font-medium">Patient not found</div>;

  const tabs = ["Overview", "Medical History", "Visits", "Labs & Scans"];

  return (
    <div className="p-8 lg:p-10 max-w-7xl mx-auto flex flex-col gap-8 animate-in fade-in duration-500">
      {/* Patient Header */}
      <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-50 rounded-full mix-blend-multiply opacity-50"></div>
        <div className="absolute right-20 -bottom-20 w-48 h-48 bg-purple-50 rounded-full mix-blend-multiply opacity-50"></div>

        <div className="flex items-center gap-6 relative z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-brand-100 to-brand-200 text-brand-600 rounded-2xl flex items-center justify-center text-3xl font-black shadow-inner ring-4 ring-white">
            {patient.name?.charAt(0)}
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-1">{patient.name}</h2>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg tracking-widest">{patient._id}</span>
              <span className="text-sm font-semibold text-gray-500">• {patient.age ? `${patient.age} yrs old` : "Age Unrecorded"}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4 relative z-10 bg-gray-50/80 backdrop-blur-sm p-4 rounded-2xl border border-white">
          <div className="text-right px-4 border-r border-gray-200">
            <p className="flex items-center justify-end gap-1 text-xs text-gray-500 uppercase font-black tracking-widest mb-1"><Calendar size={12}/> EDD</p>
            <p className="font-black text-xl text-gray-900">{patient.edd ? new Date(patient.edd).toLocaleDateString() : "-"}</p>
          </div>
          <div className="text-right pl-4">
            <p className="flex items-center justify-end gap-1 text-xs text-gray-500 uppercase font-black tracking-widest mb-1"><Droplets size={12}/> Blood Grp</p>
            <p className="font-black text-xl text-brand-600">{patient.bloodGroup || "-"}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto bg-gray-100/50 p-2 rounded-2xl backdrop-blur-sm self-start">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 whitespace-nowrap ${
              activeTab === tab 
                ? "bg-white text-brand-600 shadow-sm ring-1 ring-black/5" 
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.02)] border border-gray-50 min-h-[500px] mb-10 relative">
        {message && <div className="mb-6 p-4 bg-brand-50 text-brand-700 rounded-2xl font-bold border border-brand-100">{message}</div>}

        {activeTab === "Overview" && <OverviewTab patient={patient} />}
        {activeTab === "Medical History" && <MedicalHistoryTab patientId={id as string} history={medicalHistory} role={role} onSaved={fetchData} />}
        {activeTab === "Visits" && <VisitsTab patientId={id as string} visits={vitalsHistory} role={role} onSaved={fetchData} />}
        {activeTab === "Labs & Scans" && <LabsTab patientId={id as string} labs={investigations} role={role} onSaved={fetchData} />}
      </div>
    </div>
  );
}

// ---------------- SUBS ----------------

function OverviewTab({patient}: {patient: any}) {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <h3 className="font-bold text-lg mb-4 text-gray-800 border-b pb-2">Basic Demographics</h3>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between"><dt className="text-gray-500">NIN</dt><dd className="font-bold">{patient.nin || '-'}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Occupation</dt><dd className="font-bold">{patient.occupation || '-'}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Marital Status</dt><dd className="font-bold">{patient.maritalStatus || '-'}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Education</dt><dd className="font-bold">{patient.education || '-'}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Religion</dt><dd className="font-bold">{patient.religion || '-'}</dd></div>
        </dl>
      </div>
      <div>
        <h3 className="font-bold text-lg mb-4 text-gray-800 border-b pb-2">Location & Contacts</h3>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between"><dt className="text-gray-500">District</dt><dd className="font-bold">{patient.district || '-'}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Village</dt><dd className="font-bold">{patient.village || '-'}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Emergency Phone</dt><dd className="font-bold text-blue-600">{patient.emergencyContact || '-'}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">NOK Name</dt><dd className="font-bold">{patient.nokName || '-'}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">NOK Phone</dt><dd className="font-bold">{patient.nokPhone || '-'}</dd></div>
        </dl>
      </div>
    </div>
  );
}

function MedicalHistoryTab({patientId, history, role, onSaved}: any) {
  const [form, setForm] = useState(history || {});
  const [loading, setLoading] = useState(false);

  const save = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    await api.post(`/hospital/patient/${patientId}/history`, form);
    setLoading(false);
    onSaved();
  };

  const isDoc = role === 'Doctor';

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">Gravida</label>
          <input type="number" disabled={!isDoc} className="w-full p-3 border rounded-xl" value={form.gravida || ''} onChange={e => setForm({...form, gravida: parseInt(e.target.value)})} />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">Para</label>
          <input type="number" disabled={!isDoc} className="w-full p-3 border rounded-xl" value={form.para || ''} onChange={e => setForm({...form, para: parseInt(e.target.value)})} />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">Abortions</label>
          <input type="number" disabled={!isDoc} className="w-full p-3 border rounded-xl" value={form.abortions || ''} onChange={e => setForm({...form, abortions: parseInt(e.target.value)})} />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
        {['hivStatus', 'cardiacDisease', 'kidneyDisease', 'hypertension', 'asthma', 'diabetes', 'sickleCell'].map(k => (
          <label key={k} className="flex items-center gap-2 text-sm font-bold text-gray-700 capitalize p-2 bg-gray-50 rounded-xl">
            <input type="checkbox" disabled={!isDoc} checked={form[k] || false} onChange={e => setForm({...form, [k]: e.target.checked})} className="w-5 h-5 rounded text-brand-600" />
            {k.replace(/([A-Z])/g, ' $1')}
          </label>
        ))}
      </div>
      {isDoc && <button type="submit" className="px-8 py-3 bg-brand-600 text-white font-bold rounded-xl mt-4">{loading ? 'Saving...' : 'Save Medical History'}</button>}
      {!isDoc && <p className="text-red-500 text-sm font-bold mt-4">Only Doctors can edit Medical History.</p>}
    </form>
  );
}

function VisitsTab({patientId, visits, role, onSaved}: any) {
  const [form, setForm] = useState({ 
    systolic: 120, 
    diastolic: 80, 
    weight: 70, 
    fetalHeartRate: '', 
    complaints: '', 
    doctorNotes: '', 
    generalExam: '' 
  });
  const [showForm, setShowForm] = useState(false);

  // Prepare chart data
  const chartData = [...visits].reverse().map(v => ({
    date: new Date(v.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    bp_sys: parseInt(v.bloodPressure?.split('/')[0]) || 0,
    bp_dia: parseInt(v.bloodPressure?.split('/')[1]) || 0,
    weight: v.weight || 0
  }));

  const save = async (e: any) => {
    e.preventDefault();
    const bloodPressure = `${form.systolic}/${form.diastolic}`;
    await api.post(`/hospital/patient/${patientId}/visit`, { ...form, bloodPressure });
    onSaved();
    setForm({ systolic: 120, diastolic: 80, weight: 70, fetalHeartRate: '', complaints: '', doctorNotes: '', generalExam: '' });
    setShowForm(false);
  };

  return (
    <div className="space-y-10">
      {/* Trends Graph Section */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
           <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-500 mb-1">Vitals Trend</h4>
                <h3 className="text-xl font-black text-slate-900">Blood Pressure (mmHg)</h3>
              </div>
              <TrendingUp className="text-brand-200 group-hover:text-brand-500 transition-colors" />
           </div>
           <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSys" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#db2777" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#db2777" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} hide={chartData.length === 0} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} domain={[40, 200]} hide={chartData.length === 0} />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="bp_sys" stroke="#db2777" strokeWidth={3} fillOpacity={1} fill="url(#colorSys)" name="Systolic" />
                <Area type="monotone" dataKey="bp_dia" stroke="#fb7185" strokeWidth={3} fillOpacity={0} name="Diastolic" />
              </AreaChart>
            </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
           <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-1">Weight Dynamics</h4>
                <h3 className="text-xl font-black text-slate-900">Patient Weight (kg)</h3>
              </div>
              <Activity className="text-blue-200 group-hover:text-blue-500 transition-colors" />
           </div>
           <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} hide={chartData.length === 0} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} domain={['dataMin - 5', 'dataMax + 5']} hide={chartData.length === 0} />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                />
                <Line type="step" dataKey="weight" stroke="#3b82f6" strokeWidth={4} dot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} name="Weight" />
              </LineChart>
            </ResponsiveContainer>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl h-fit">
          <h3 className="font-black text-2xl mb-6 tracking-tighter">Log Clinical Visit</h3>
          <form onSubmit={save} className="space-y-8">
            {/* Visual Sliders for BP */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Systolic (Top)</label>
                  <span className="text-brand-400 font-black">{form.systolic} <small>mmHg</small></span>
                </div>
                <input 
                  type="range" min="70" max="220" 
                  className="w-full accent-brand-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  value={form.systolic} onChange={e => setForm({...form, systolic: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Diastolic (Bottom)</label>
                  <span className="text-pink-400 font-black">{form.diastolic} <small>mmHg</small></span>
                </div>
                <input 
                  type="range" min="40" max="130" 
                  className="w-full accent-pink-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  value={form.diastolic} onChange={e => setForm({...form, diastolic: parseInt(e.target.value)})}
                />
              </div>
              <div className="pt-4 border-t border-slate-800">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Weight</label>
                  <span className="text-blue-400 font-black">{form.weight} <span className="text-xs">kg</span></span>
                </div>
                <input 
                  type="range" min="30" max="180" 
                  className="w-full accent-blue-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  value={form.weight} onChange={e => setForm({...form, weight: parseInt(e.target.value)})}
                />
              </div>
            </div>

            <input placeholder="Add Presenting Complaints..." className="w-full p-4 bg-slate-800 border-none rounded-2xl text-sm font-bold text-white placeholder:text-slate-600 focus:ring-2 ring-brand-500" value={form.complaints} onChange={e => setForm({...form, complaints: e.target.value})} />
            
            {role === 'Doctor' && (
              <div className="space-y-4">
                <textarea placeholder="Clinical Examination Findings..." className="w-full p-4 bg-slate-800 border-none rounded-2xl text-sm font-bold text-white placeholder:text-slate-600 h-24" value={form.generalExam} onChange={e => setForm({...form, generalExam: e.target.value})} />
              </div>
            )}
            
            <button type="submit" className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white font-black rounded-2xl shadow-lg shadow-brand-600/20 transition-all flex items-center justify-center gap-2">
              <Save size={18} /> Seal Visit Record
            </button>
          </form>
        </div>
        
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-black text-2xl text-slate-900 tracking-tighter">Visit Chronology</h3>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{visits.length} Total Logs</span>
          </div>
          
          {visits.length === 0 ? (
            <div className="bg-gray-50 rounded-[2.5rem] p-12 text-center border-2 border-dashed border-gray-100 italic text-gray-400 font-medium">
               No visits recorded yet for this pregnancy cycle.
            </div>
          ) : (
            visits.map((v: any) => (
              <div key={v.id} className="p-8 rounded-[2.5rem] bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col gap-6 group hover:translate-x-2 transition-transform">
                <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center font-black">
                      {v.recordedBy?.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-sm leading-none">{v.recordedBy?.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{v.recordedBy?.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-500 text-sm">{new Date(v.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                   <div className="p-4 bg-red-50/50 rounded-2xl border border-red-50 flex flex-col items-center">
                      <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Pressure</p>
                      <p className="text-xl font-black text-red-600">{v.bloodPressure}</p>
                   </div>
                   <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-50 flex flex-col items-center">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Weight</p>
                      <p className="text-xl font-black text-blue-600">{v.weight}kg</p>
                   </div>
                   <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-50 flex flex-col items-center">
                      <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">G. Age</p>
                      <p className="text-xl font-black text-purple-600">{v.gestationalAge || '-'}</p>
                   </div>
                   <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-50 flex flex-col items-center">
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Pulse</p>
                      <p className="text-xl font-black text-emerald-600">{v.pulse || '-'}</p>
                   </div>
                </div>

                {v.complaints && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-medium text-slate-600 italic">
                    <span className="font-black not-italic text-[10px] text-slate-400 uppercase block mb-1">Complaints</span>
                    "{v.complaints}"
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function LabsTab({patientId, labs, role, onSaved}: any) {
  const [form, setForm] = useState({ testType: '', result: '', attachmentUrl: '' });
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, attachmentUrl: reader.result as string }));
        setUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post(`/hospital/patient/${patientId}/investigations`, form);
    onSaved();
    setForm({ testType: '', result: '', attachmentUrl: '' });
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 bg-gray-50 p-6 rounded-3xl border border-gray-100 h-fit">
        <h3 className="font-bold text-lg mb-4 text-gray-800">Record Lab & Upload Scan</h3>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Test/Scan Name</label>
            <input placeholder="e.g. Ultrasound Scan, Hb" className="w-full p-3 border rounded-xl text-sm" value={form.testType} onChange={e => setForm({...form, testType: e.target.value})} required/>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Result Notes</label>
            <input placeholder="e.g. Normal, 11.5 g/dL" className="w-full p-3 border rounded-xl text-sm" value={form.result} onChange={e => setForm({...form, result: e.target.value})} required/>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Upload Scan Image</label>
            <input type="file" accept="image/*" className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-50 file:text-brand-600 hover:file:bg-brand-100 cursor-pointer" onChange={handleFileChange} />
          </div>
          {form.attachmentUrl && (
            <div className="mt-2 p-2 border rounded-xl bg-white">
              <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase">Preview</p>
              <img src={form.attachmentUrl} alt="Preview" className="max-w-full h-auto rounded-lg border max-h-32 object-contain mx-auto" />
            </div>
          )}
          <button type="submit" disabled={uploading} className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-all disabled:bg-gray-300">
            {uploading ? "Processing Image..." : "Save Lab & Scan"}
          </button>
        </form>
      </div>
      <div className="space-y-6 lg:col-span-2">
        <h3 className="font-bold text-lg text-gray-800">Labs & Scans History</h3>
        {labs.length === 0 && <p className="text-gray-500">No labs or scans recorded.</p>}
        {labs.map((l: any) => (
          <div key={l.id} className="p-6 border rounded-[2rem] bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-all">
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-lg text-gray-800">{l.testType}</p>
                  <p className="text-xs text-gray-500 font-bold">{new Date(l.date || l.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="font-black text-xl text-brand-600 md:text-right">{l.result}</div>
              </div>
              
              {l.attachmentUrl && (
                <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 max-w-md">
                  <img src={l.attachmentUrl} alt="Scan Record" className="max-w-full h-auto rounded-lg border max-h-48 object-contain bg-white" />
                  <div className="mt-3 flex gap-2">
                    <a href={l.attachmentUrl} download={`${l.testType.replace(/\s+/g, '_')}_scan.png`} className="text-xs px-3 py-2 bg-white hover:bg-brand-50 text-brand-600 border border-brand-100 rounded-xl font-bold transition-all inline-block">
                      Download Scan Image
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

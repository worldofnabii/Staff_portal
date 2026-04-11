"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/utils/api";
import { Activity, User as UserIcon, Calendar, Phone, Save, Stethoscope, Droplets, MapPin, Search } from "lucide-react";

export default function PatientProfile() {
  const { id } = useParams();
  const [patient, setPatient] = useState<any>(null);
  const [vitalsHistory, setVitalsHistory] = useState<any[]>([]);
  const [medicalHistory, setMedicalHistory] = useState<any>(null);
  const [investigations, setInvestigations] = useState<any[]>([]);
  const [carePlan, setCarePlan] = useState<any>(null);
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
      setCarePlan(res.data.carePlan);
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

  const tabs = ["Overview", "Medical History", "Visits", "Labs & Scans", "Care Plan"];

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
        {activeTab === "Care Plan" && <CarePlanTab patientId={id as string} plan={carePlan} role={role} onSaved={fetchData} />}
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
  const [form, setForm] = useState({ bloodPressure: '', weight: '', fetalHeartRate: '', complaints: '', doctorNotes: '', generalExam: '' });
  const save = async (e: any) => {
    e.preventDefault();
    await api.post(`/hospital/patient/${patientId}/visit`, form);
    onSaved();
    setForm({ bloodPressure: '', weight: '', fetalHeartRate: '', complaints: '', doctorNotes: '', generalExam: '' });
  };
  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 bg-gray-50 p-6 rounded-3xl border border-gray-100 h-fit">
        <h3 className="font-bold text-lg mb-4 text-gray-800">New Visit Log</h3>
        <form onSubmit={save} className="space-y-4">
          <input placeholder="Blood Pressure (e.g. 120/80)" className="w-full p-3 border rounded-xl" value={form.bloodPressure} onChange={e => setForm({...form, bloodPressure: e.target.value})} required/>
          <input placeholder="Weight (kg)" type="number" className="w-full p-3 border rounded-xl" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} />
          <input placeholder="Presenting Complaints" className="w-full p-3 border rounded-xl" value={form.complaints} onChange={e => setForm({...form, complaints: e.target.value})} />
          {role === 'Doctor' && (
            <>
              <textarea placeholder="General / Pelvic Exam Notes" className="w-full p-3 border rounded-xl h-20" value={form.generalExam} onChange={e => setForm({...form, generalExam: e.target.value})} />
              <textarea placeholder="Doctor Care Notes" className="w-full p-3 border rounded-xl h-20" value={form.doctorNotes} onChange={e => setForm({...form, doctorNotes: e.target.value})} />
            </>
          )}
          <button type="submit" className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl">Save Visit</button>
        </form>
      </div>
      <div className="lg:col-span-2 space-y-4">
        <h3 className="font-bold text-lg mb-4 text-gray-800">Visit History</h3>
        {visits.map((v: any) => (
          <div key={v.id} className="p-5 border rounded-2xl bg-white shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-center text-sm text-gray-500 font-bold border-b pb-2">
              <span>{new Date(v.createdAt).toLocaleDateString()}</span>
              <span>{v.recordedBy?.name} ({v.recordedBy?.role})</span>
            </div>
            <div className="flex gap-6 font-bold text-gray-800">
               <p>BP: <span className="text-brand-600">{v.bloodPressure || '-'}</span></p>
               <p>Weight: <span className="text-brand-600">{v.weight || '-'} kg</span></p>
            </div>
            {v.complaints && <p className="text-sm"><b>Complaints:</b> {v.complaints}</p>}
            {v.generalExam && <div className="p-3 bg-red-50 rounded-lg text-sm text-red-900 border border-red-100"><b>Doctor Exam:</b> {v.generalExam}</div>}
            {v.doctorNotes && <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-900 border border-blue-100"><b>Notes:</b> {v.doctorNotes}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function LabsTab({patientId, labs, role, onSaved}: any) {
  const [form, setForm] = useState({ testType: '', result: '' });
  const save = async (e: any) => {
    e.preventDefault();
    await api.post(`/hospital/patient/${patientId}/investigations`, form);
    onSaved();
    setForm({ testType: '', result: '' });
  };
  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {role === 'Doctor' && (
      <div className="lg:col-span-1 bg-gray-50 p-6 rounded-3xl border border-gray-100 h-fit">
        <h3 className="font-bold text-lg mb-4 text-gray-800">Record Lab</h3>
        <form onSubmit={save} className="space-y-4">
          <input placeholder="Test Type (e.g. Hb, Syphilis)" className="w-full p-3 border rounded-xl" value={form.testType} onChange={e => setForm({...form, testType: e.target.value})} required/>
          <input placeholder="Result" className="w-full p-3 border rounded-xl" value={form.result} onChange={e => setForm({...form, result: e.target.value})} required/>
          <button type="submit" className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl">Save Lab</button>
        </form>
      </div>)}
      <div className={`space-y-4 ${role === 'Doctor' ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
        <h3 className="font-bold text-lg mb-4 text-gray-800">Labs & Scans History</h3>
        {labs.length === 0 && <p className="text-gray-500">No labs recorded.</p>}
        {labs.map((l: any) => (
          <div key={l.id} className="p-4 border rounded-xl bg-white shadow-sm flex justify-between items-center">
            <div>
              <p className="font-bold text-gray-800">{l.testType}</p>
              <p className="text-sm text-gray-500">{new Date(l.date).toLocaleDateString()}</p>
            </div>
            <div className="font-black text-lg text-brand-600">{l.result}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CarePlanTab({patientId, plan, role, onSaved}: any) {
  const [form, setForm] = useState(plan || { feedingOption: '', deliveryPlan: '' });
  const save = async (e: any) => {
    e.preventDefault();
    await api.post(`/hospital/patient/${patientId}/careplan`, form);
    onSaved();
  };
  const isDoc = role === 'Doctor';
  return (
    <form onSubmit={save} className="max-w-2xl space-y-6">
       <div>
          <label className="block text-sm font-bold text-gray-500 mb-1">Feeding Option</label>
          <input disabled={!isDoc} placeholder="e.g. Exclusive Breastfeeding" className="w-full p-3 border rounded-xl" value={form.feedingOption || ''} onChange={e => setForm({...form, feedingOption: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-500 mb-1">Delivery Plan</label>
          <textarea disabled={!isDoc} placeholder="e.g. SVD booked for Ward C" className="w-full p-3 border rounded-xl h-24" value={form.deliveryPlan || ''} onChange={e => setForm({...form, deliveryPlan: e.target.value})} />
        </div>
        {isDoc && <button type="submit" className="px-8 py-3 bg-brand-600 text-white font-bold rounded-xl">Save Care Plan</button>}
    </form>
  );
}

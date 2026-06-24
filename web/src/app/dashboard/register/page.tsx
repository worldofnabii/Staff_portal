"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";

export default function PatientRegistration() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [lookupId, setLookupId] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [lookupSuccess, setLookupSuccess] = useState("");

  const [form, setForm] = useState({
    _id: `PATIENT-${Math.floor(10000 + Math.random() * 90000)}`,
    name: "",
    email: "",
    password: "password123", // Default for simulation
    bloodGroup: "",
    edd: "",
    emergencyContact: "",
    nin: "",
    age: "",
    village: "",
    parish: "",
    district: "",
    occupation: "",
    religion: "",
    education: "",
    maritalStatus: "",
    nokName: "",
    nokPhone: "",
    nokRelationship: "",
    nokAddress: ""
  });

  const nextStep = () => setStep(2);
  const prevStep = () => setStep(1);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = lookupId.trim().replace(/^#/, "");
    if (!cleanId) return;
    setLookupLoading(true);
    setLookupError("");
    setLookupSuccess("");
    try {
      const res = await api.get(`/hospital/patient/${cleanId}`);
      if (res.data?.patient) {
        const patientData = res.data.patient;
        setForm({
          _id: patientData._id || patientData.id || cleanId,
          name: patientData.name || "",
          email: patientData.email || "",
          password: "password123",
          bloodGroup: patientData.bloodGroup || "",
          edd: patientData.edd ? new Date(patientData.edd).toISOString().split('T')[0] : "",
          emergencyContact: patientData.emergencyContact || "",
          nin: patientData.nin || "",
          age: patientData.age?.toString() || "",
          village: patientData.village || "",
          parish: patientData.parish || "",
          district: patientData.district || "",
          occupation: patientData.occupation || "",
          religion: patientData.religion || "",
          education: patientData.education || "",
          maritalStatus: patientData.maritalStatus || "",
          nokName: patientData.nokName || "",
          nokPhone: patientData.nokPhone || "",
          nokRelationship: patientData.nokRelationship || "",
          nokAddress: patientData.nokAddress || ""
        });
        setLookupSuccess("Patient record imported successfully! Review their details below and complete registration.");
        setStep(1);
      } else {
        setLookupError("Patient not found. Make sure the code is correct.");
      }
    } catch {
      setLookupError("Failed to lookup patient. Verify the Patient ID.");
    } finally {
      setLookupLoading(false);
    }
  };

  const registerPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/register/patient", form);
      router.push(`/dashboard/patient/${form._id}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="mb-4">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Patient Registry & Intake</h1>
        <p className="text-gray-500 mt-1 font-medium">{"Link a patient's mobile account or register them manually"}</p>
      </div>

      {/* Option A: Import Patient via ID */}
      <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100/80">
        <h2 className="text-lg font-black text-gray-900 tracking-tight mb-1">Option A: Import Patient via Mobile Code</h2>
        <p className="text-gray-400 text-xs font-semibold mb-4">If the patient has signed up via the mobile app, enter their ID to link their record.</p>
        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Enter Patient ID (e.g. PATIENT-002)"
            className="flex-grow px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none font-semibold text-sm shadow-inner"
            value={lookupId}
            onChange={e => setLookupId(e.target.value)}
          />
          <button
            type="submit"
            disabled={lookupLoading || !lookupId.trim()}
            className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-sm transition-all disabled:bg-slate-350 shadow-md flex items-center justify-center gap-2"
          >
            {lookupLoading ? "Importing..." : "Import Patient"}
          </button>
        </form>
        {lookupError && <div className="mt-3 text-red-700 text-xs font-bold bg-red-50 p-3 rounded-xl border border-red-100">{lookupError}</div>}
        {lookupSuccess && <div className="mt-3 text-emerald-700 text-xs font-bold bg-emerald-50 p-3 rounded-xl border border-emerald-100">{lookupSuccess}</div>}
      </div>

      {/* Option B: Manual Registration form */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100/80">
        <h2 className="text-lg font-black text-gray-900 tracking-tight mb-1">Option B: Input Details Manually</h2>
        <p className="text-gray-450 text-xs font-semibold mb-6">Step {step} of 2 - {step === 1 ? 'Basic Demographics' : 'Extended Profile & Next of Kin'}</p>
        {error && <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-xl font-bold border border-red-100">{error}</div>}

        <form onSubmit={step === 2 ? registerPatient : e => { e.preventDefault(); nextStep(); }} className="space-y-6">
          
          {step === 1 && (
            <div className="grid md:grid-cols-2 gap-6">
              <div><label className="block text-sm font-bold text-gray-500 mb-1">Full Name *</label><input required className="w-full p-3 border rounded-xl" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div><label className="block text-sm font-bold text-gray-500 mb-1">Email *</label><input required type="email" className="w-full p-3 border rounded-xl" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
              <div><label className="block text-sm font-bold text-gray-500 mb-1">Patient ID</label><input disabled className="w-full p-3 border rounded-xl bg-gray-50" value={form._id} /></div>
              <div><label className="block text-sm font-bold text-gray-500 mb-1">Age</label><input type="number" className="w-full p-3 border rounded-xl" value={form.age} onChange={e => setForm({...form, age: e.target.value})} /></div>
              <div><label className="block text-sm font-bold text-gray-500 mb-1">Blood Group</label><input className="w-full p-3 border rounded-xl" value={form.bloodGroup} onChange={e => setForm({...form, bloodGroup: e.target.value})} /></div>
              <div><label className="block text-sm font-bold text-gray-500 mb-1">Estimated Delivery Date</label><input type="date" className="w-full p-3 border rounded-xl" value={form.edd} onChange={e => setForm({...form, edd: e.target.value})} /></div>
              <div><label className="block text-sm font-bold text-gray-500 mb-1">National ID (NIN)</label><input className="w-full p-3 border rounded-xl" value={form.nin} onChange={e => setForm({...form, nin: e.target.value})} /></div>
              <div><label className="block text-sm font-bold text-gray-500 mb-1">Marital Status</label><input className="w-full p-3 border rounded-xl" value={form.maritalStatus} onChange={e => setForm({...form, maritalStatus: e.target.value})} /></div>
            </div>
          )}

          {step === 2 && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2 border-b pb-2"><h3 className="font-bold text-lg text-gray-800">Location & Demographics</h3></div>
              <div><label className="block text-sm font-bold text-gray-500 mb-1">District</label><input className="w-full p-3 border rounded-xl" value={form.district} onChange={e => setForm({...form, district: e.target.value})} /></div>
              <div><label className="block text-sm font-bold text-gray-500 mb-1">Village/Parish</label><input className="w-full p-3 border rounded-xl" value={form.village} onChange={e => setForm({...form, village: e.target.value})} /></div>
              <div><label className="block text-sm font-bold text-gray-500 mb-1">Occupation</label><input className="w-full p-3 border rounded-xl" value={form.occupation} onChange={e => setForm({...form, occupation: e.target.value})} /></div>
              <div><label className="block text-sm font-bold text-gray-500 mb-1">Religion</label><input className="w-full p-3 border rounded-xl" value={form.religion} onChange={e => setForm({...form, religion: e.target.value})} /></div>
              <div><label className="block text-sm font-bold text-gray-500 mb-1">Education Level</label><input className="w-full p-3 border rounded-xl" value={form.education} onChange={e => setForm({...form, education: e.target.value})} /></div>
              
              <div className="md:col-span-2 border-b pb-2 pt-4"><h3 className="font-bold text-lg text-gray-800">Next of Kin (NOK)</h3></div>
              <div><label className="block text-sm font-bold text-gray-500 mb-1">NOK Name</label><input className="w-full p-3 border rounded-xl" value={form.nokName} onChange={e => setForm({...form, nokName: e.target.value})} /></div>
              <div><label className="block text-sm font-bold text-gray-500 mb-1">NOK Phone / Emergency Contact</label><input className="w-full p-3 border rounded-xl" value={form.emergencyContact} onChange={e => setForm({...form, emergencyContact: e.target.value})} /></div>
              <div><label className="block text-sm font-bold text-gray-500 mb-1">Relationship</label><input className="w-full p-3 border rounded-xl" value={form.nokRelationship} onChange={e => setForm({...form, nokRelationship: e.target.value})} /></div>
              <div><label className="block text-sm font-bold text-gray-500 mb-1">NOK Address</label><input className="w-full p-3 border rounded-xl" value={form.nokAddress} onChange={e => setForm({...form, nokAddress: e.target.value})} /></div>
            </div>
          )}

          <div className="flex gap-4 pt-6">
            {step === 2 && <button type="button" onClick={prevStep} className="px-6 py-3 border border-gray-200 text-gray-700 font-bold rounded-xl w-32">Back</button>}
            <button type="submit" disabled={loading} className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl flex-1 flex justify-center">
              {loading ? "Registering..." : (step === 1 ? "Next Step ->" : "Complete Registration")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

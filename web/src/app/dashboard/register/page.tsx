"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";

export default function PatientRegistration() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const registerPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/register/patient", form);
      router.push(`/dashboard/patient/${form._id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Register New Patient</h1>
        <p className="text-gray-500 mt-1 font-medium">Step {step} of 2 - {step === 1 ? 'Basic Demographics' : 'Extended Profile & Next of Kin'}</p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
        {error && <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-xl font-bold">{error}</div>}

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

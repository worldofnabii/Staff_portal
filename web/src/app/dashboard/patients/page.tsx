"use client";

import { useEffect, useState } from "react";
import { api } from "@/utils/api";
import { Search, UserPlus, ChevronRight, Calendar, Droplets, MapPin } from "lucide-react";
import Link from "next/link";

interface Patient {
  _id: string;
  name: string;
  email: string;
  age?: number | string;
  bloodGroup?: string;
  edd?: string;
  district?: string;
  village?: string;
}

export default function RegisteredPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchPatients = async () => {
    try {
      const res = await api.get("/hospital/patients");
      setPatients(res.data.patients || []);
    } catch (error) {
      console.error("Failed to fetch patients", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter((patient) => {
    const query = searchQuery.toLowerCase();
    return (
      patient.name.toLowerCase().includes(query) ||
      patient._id.toLowerCase().includes(query) ||
      (patient.email && patient.email.toLowerCase().includes(query))
    );
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Clinical Registry</h1>
          <p className="text-slate-500 font-medium mt-1">Browse and manage registered expectant mothers</p>
        </div>

        <Link
          href="/dashboard/register"
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white rounded-2xl font-bold shadow-lg shadow-brand-500/20 transition-all self-start md:self-auto"
        >
          <UserPlus size={18} /> Register New Patient
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <input
          type="text"
          placeholder="Search patients by name, email, or Patient ID..."
          className="w-full px-6 py-4 pl-14 rounded-2xl border-2 border-slate-100 bg-white focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none text-slate-700 font-semibold shadow-[0_4px_30px_rgba(0,0,0,0.01)]"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
      </div>

      {/* Patient List */}
      {loading ? (
        <div className="grid h-64 place-items-center bg-white rounded-[3rem] border border-slate-100 shadow-sm animate-pulse">
          <p className="text-slate-400 font-bold">Loading registered patients...</p>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="bg-white rounded-[3rem] p-16 text-center border-2 border-dashed border-slate-100">
          <p className="text-slate-400 font-bold text-lg">No patients found</p>
          <p className="text-slate-400 mt-2 font-medium max-w-xs mx-auto">
            {searchQuery ? "Try modifying your search term." : "No patients have been registered yet."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_15px_60px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="divide-y divide-slate-50">
            {filteredPatients.map((patient) => (
              <div
                key={patient._id}
                className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-all group"
              >
                <div className="flex items-center gap-6">
                  {/* Initials Avatar */}
                  <div className="w-14 h-14 bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 rounded-2xl flex items-center justify-center text-xl font-black shadow-inner ring-4 ring-white">
                    {patient.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      {patient.name}
                      {patient.age && (
                        <span className="text-xs font-semibold text-slate-400">({patient.age} yrs)</span>
                      )}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-500 font-black rounded-lg tracking-wider">
                        {patient._id}
                      </span>
                      <span className="text-xs font-medium text-slate-400">{patient.email}</span>
                    </div>
                  </div>
                </div>

                {/* Vitals Summary Badges */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
                  {patient.edd && (
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 rounded-xl text-slate-600 border border-slate-100">
                      <Calendar size={14} className="text-slate-400" />
                      EDD: {new Date(patient.edd).toLocaleDateString()}
                    </div>
                  )}
                  {patient.bloodGroup && (
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-pink-50 rounded-xl text-brand-600 border border-pink-100">
                      <Droplets size={14} className="text-brand-400" />
                      {patient.bloodGroup}
                    </div>
                  )}
                  {(patient.district || patient.village) && (
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 rounded-xl text-slate-600 border border-slate-100">
                      <MapPin size={14} className="text-slate-400" />
                      {patient.village || patient.district}
                    </div>
                  )}
                </div>

                {/* Navigation Button */}
                <div className="flex justify-end">
                  <Link
                    href={`/dashboard/patient/${patient._id}`}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-100 group-hover:bg-brand-600 group-hover:text-white group-hover:border-transparent transition-all duration-300"
                  >
                    View Profile <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

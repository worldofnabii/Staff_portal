"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";
import { HeartPulse, Loader2, ArrowRight, Building2, User, Key, Mail, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function RegisterHospitalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    hospitalName: "",
    hospitalAddress: "",
    licenseNumber: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/register-hospital", form);
      
      // Store the auth details
      localStorage.setItem("staffToken", res.data.token);
      localStorage.setItem("staffRole", res.data.user.role);
      localStorage.setItem("staffName", res.data.user.name);
      localStorage.setItem("hospitalName", res.data.user.hospitalName);

      // Redirect to the main dashboard
      router.push("/dashboard");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-y-auto bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Animated Background Orbs */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-brand-300 rounded-full mix-blend-multiply filter blur-3xl opacity-75 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-75 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-75 animate-blob animation-delay-4000"></div>

      <div className="z-10 w-full max-w-2xl p-8 glass-panel rounded-[2.5rem] shadow-2xl">
        <div className="flex flex-col items-center mb-8 mt-2">
          <div className="p-4 bg-gradient-to-tr from-brand-600 to-brand-400 rounded-3xl text-white shadow-xl shadow-brand-500/30 mb-4 transform -rotate-6 hover:rotate-0 transition duration-300">
            <HeartPulse size={40} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter mb-1">
            Register Facility
          </h1>
          <p className="text-gray-500 font-medium uppercase tracking-wider text-[10px]">
            MammaCare Multi-Tenant Hospital Onboarding
          </p>
        </div>

        {error && (
          <div className="p-4 mb-6 text-sm font-bold text-red-600 bg-red-50/80 backdrop-blur-md rounded-2xl border border-red-100 flex items-center gap-2">
            <ShieldAlert size={18} className="shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          {/* Hospital Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">
              1. Hospital Details
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                  Hospital Name *
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 pl-10 rounded-xl border-2 border-white/50 bg-white/40 focus:bg-white focus:ring-0 focus:border-brand-500 transition-all outline-none text-gray-700 font-semibold shadow-inner text-sm"
                    placeholder="e.g. Hope Maternity Hospital"
                    value={form.hospitalName}
                    onChange={(e) => setForm({ ...form, hospitalName: e.target.value })}
                  />
                  <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                  Facility License Number *
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 pl-10 rounded-xl border-2 border-white/50 bg-white/40 focus:bg-white focus:ring-0 focus:border-brand-500 transition-all outline-none text-gray-700 font-semibold shadow-inner text-sm"
                    placeholder="e.g. MOU-HQ-999"
                    value={form.licenseNumber}
                    onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                  />
                  <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                Hospital Address *
              </label>
              <div className="relative group">
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 pl-10 rounded-xl border-2 border-white/50 bg-white/40 focus:bg-white focus:ring-0 focus:border-brand-500 transition-all outline-none text-gray-700 font-semibold shadow-inner text-sm"
                  placeholder="e.g. 10 Health Avenue, Kampala, Uganda"
                  value={form.hospitalAddress}
                  onChange={(e) => setForm({ ...form, hospitalAddress: e.target.value })}
                />
                <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
              </div>
            </div>
          </div>

          {/* Admin Account Section */}
          <div className="space-y-4 pt-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">
              2. Administrator User
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                  Admin Name *
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 pl-10 rounded-xl border-2 border-white/50 bg-white/40 focus:bg-white focus:ring-0 focus:border-brand-500 transition-all outline-none text-gray-700 font-semibold shadow-inner text-sm"
                    placeholder="Full Name"
                    value={form.adminName}
                    onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                  />
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                  Work Email *
                </label>
                <div className="relative group">
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 pl-10 rounded-xl border-2 border-white/50 bg-white/40 focus:bg-white focus:ring-0 focus:border-brand-500 transition-all outline-none text-gray-700 font-semibold shadow-inner text-sm"
                    placeholder="admin@hospital.com"
                    value={form.adminEmail}
                    onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                  />
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                Password *
              </label>
              <div className="relative group">
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 pl-10 rounded-xl border-2 border-white/50 bg-white/40 focus:bg-white focus:ring-0 focus:border-brand-500 transition-all outline-none text-gray-700 font-semibold shadow-inner text-sm"
                  placeholder="••••••••"
                  value={form.adminPassword}
                  onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                />
                <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group w-full mt-6 py-4 px-6 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 active:scale-[0.98] text-white font-bold rounded-2xl shadow-xl shadow-brand-500/25 transition-all flex items-center justify-center gap-2 overflow-hidden relative text-sm"
          >
            <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-white rounded-full group-hover:w-56 group-hover:h-56 opacity-10"></span>
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                Register & Onboard{" "}
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs font-semibold text-gray-400 hover:text-brand-500 transition-colors"
          >
            &larr; Back to clinical staff login
          </Link>
        </div>
      </div>
    </div>
  );
}

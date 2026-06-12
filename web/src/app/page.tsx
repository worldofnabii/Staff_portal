"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";
import { HeartPulse, Loader2, ArrowRight, Stethoscope } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"Doctor" | "Nurse">("Doctor");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login/staff", { email, password });
      localStorage.setItem("staffToken", res.data.token);
      localStorage.setItem("staffRole", res.data.user.role);
      localStorage.setItem("staffName", res.data.user.name);
      router.push("/dashboard");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-gray-50">
      {/* Animated Orbs */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-brand-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="z-10 w-full max-w-md p-8 glass-panel rounded-[2.5rem]">
        <div className="flex flex-col items-center mb-6 mt-4">
          <div className="p-4 bg-gradient-to-tr from-brand-600 to-brand-400 rounded-3xl text-white shadow-xl shadow-brand-500/30 mb-6 transform -rotate-6 hover:rotate-0 transition duration-300">
            <HeartPulse size={48} strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-1 relative">
            Mamma<span className="text-brand-600">Care</span>
          </h1>
          <p className="text-gray-500 font-medium tracking-wide uppercase text-xs">Medical Provider Portal</p>
        </div>

        {error && (
          <div className="p-4 mb-6 text-sm font-bold text-red-600 bg-red-50/80 backdrop-blur-md rounded-2xl border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
              Clinical Staff Work Email
            </label>
            <div className="relative group">
              <input
                type="email"
                className="w-full px-5 py-4 pl-12 rounded-2xl border-2 border-white/50 bg-white/40 focus:bg-white focus:ring-0 focus:border-brand-500 transition-all outline-none text-gray-700 font-semibold shadow-inner"
                placeholder="e.g. doctor@hospital.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Stethoscope size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Password</label>
            <input
              type="password"
              className="w-full px-5 py-4 rounded-2xl border-2 border-white/50 bg-white/40 focus:bg-white focus:ring-0 focus:border-brand-500 transition-all outline-none text-gray-700 font-semibold shadow-inner"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="group w-full mt-8 py-4 px-6 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 active:scale-[0.98] text-white font-bold rounded-2xl shadow-xl shadow-brand-500/25 transition-all flex items-center justify-center gap-2 overflow-hidden relative"
          >
            <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-white rounded-full group-hover:w-56 group-hover:h-56 opacity-10"></span>
            {loading ? <Loader2 className="animate-spin" /> : (
              <>Sign In <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
            )}
          </button>
        </form>

        <div className="mt-10 text-center text-xs font-semibold text-gray-400">
          Encrypted &middot; Protected Health Information
        </div>
      </div>
    </div>
  );
}

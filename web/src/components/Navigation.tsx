"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Search, LogOut, HeartPulse, Stethoscope, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";

export default function Navigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRole(localStorage.getItem("staffRole") || "");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(localStorage.getItem("staffName") || "");
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  const navLinks = [
    { name: "Emergency Alerts", href: "/dashboard", icon: Bell },
    { name: "Patient Lookup", href: "/dashboard/lookup", icon: Search },
    { name: "Register Patient", href: "/dashboard/register", icon: UserPlus },
  ];

  return (
    <div className="flex h-screen bg-[#f8fafc] selection:bg-brand-500 selection:text-white">
      {/* Sidebar */}
      <aside className="w-72 bg-white/70 backdrop-blur-2xl border-r border-white/60 flex flex-col shadow-[10px_0_40px_rgba(0,0,0,0.03)] relative z-20">
        <div className="p-8 flex items-center gap-4">
          <div className="p-2.5 bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl text-white shadow-lg shadow-brand-500/20">
            <HeartPulse size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Mamma<span className="text-brand-600">Care</span></h2>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-0.5">Hospital Portal</span>
          </div>
        </div>

        <nav className="flex-1 px-5 py-6 space-y-3">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`group flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 font-semibold ${
                  isActive
                    ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-xl shadow-brand-500/20 translate-x-1"
                    : "text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-md hover:translate-x-1"
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-white" : "text-gray-400 group-hover:text-brand-500 transition-colors"} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-5 m-5 bg-white/60 backdrop-blur-md rounded-3xl border border-white shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-700 font-black text-lg shadow-inner ring-4 ring-white">
              {name.charAt(0) || <Stethoscope size={20} />}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 line-clamp-1">{name || "Staff Member"}</p>
              <p className="text-xs font-bold text-brand-600 uppercase tracking-wider">{role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-bold text-gray-600 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-2xl transition-all"
          >
            <LogOut size={16} strokeWidth={2.5} />
            Secure Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

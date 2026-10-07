"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AppNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
  onSignOut: () => Promise<void>;
}

export default function AppNav({ user, onSignOut }: AppNavProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: "Certificates",
      href: "/certificates",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z" />
        </svg>
      ),
    },
    {
      label: "Templates",
      href: "/templates",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
    },
    {
      label: "Card Requests",
      href: "/card-requests",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
        </svg>
      ),
    },
    {
      label: "Users & Access",
      href: "/users",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      label: "Audit Logs",
      href: "/audit-logs",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      label: "Settings",
      href: "/settings/notifications",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  const roleColors: Record<string, { bg: string; text: string; label: string }> = {
    SUPER_ADMIN: { bg: "#EDE9FE", text: "#6D28D9", label: "Super Admin" },
    ORG_ADMIN: { bg: "#E0F2FE", text: "#0369A1", label: "Org Admin" },
    CERT_ISSUER: { bg: "#FEF3C7", text: "#B45309", label: "Cert Issuer" },
    HR: { bg: "#ECFDF5", text: "#047857", label: "HR Specialist" },
  };

  const userRole = user.role ? roleColors[user.role] ?? { bg: "#F1F5F9", text: "#475569", label: user.role } : null;

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden bg-white border-b border-[#E5E7EB] text-[#0F172A] px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-2xs">
        <Link href="/dashboard" className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FF5B37] flex items-center justify-center font-black text-white shadow-xs">
            M
          </div>
          <span className="font-bold text-base tracking-tight text-[#0F172A]">CertiPort</span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-[#64748B] hover:text-[#0F172A] rounded-lg focus:outline-none"
        >
          {mobileOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Backdrop for Mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-2xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Vertical Sidebar (Oculis / Clean Light SaaS style) */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-[#F8F9FA] text-[#1E293B] flex flex-col justify-between border-r border-[#E5E7EB] transition-transform duration-200 ease-in-out shrink-0 select-none ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Top Branding Section */}
        <div>
          <div className="p-5 border-b border-[#E5E7EB] flex items-center space-x-3 bg-white">
            <div className="w-10 h-10 rounded-xl bg-[#FF5B37] flex items-center justify-center font-black text-xl text-white shadow-xs">
              M
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-[#0F172A] flex items-center space-x-1.5">
                <span>CertiPort</span>
                <span className="text-[10px] font-mono font-bold bg-[#FFF0EB] text-[#FF5B37] px-1.5 py-0.5 rounded border border-[#FFD8CF]">
                  v2.1
                </span>
              </div>
              <div className="text-[11px] text-[#94A3B8] font-medium">Identity & Cert Platform</div>
            </div>
          </div>

          {/* Quick Search Bar (Image 3 style) */}
          <div className="px-3 pt-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                readOnly
                className="w-full bg-white text-[#0F172A] placeholder-[#94A3B8] text-xs rounded-xl px-3 py-2 pr-8 border border-[#E5E7EB] shadow-2xs outline-none cursor-pointer"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#94A3B8] bg-[#F1F5F9] px-1 py-0.5 rounded border border-[#E2E8F0]">
                ⌘K
              </span>
            </div>
          </div>

          {/* Section Header */}
          <div className="px-4 pt-4 pb-1">
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
              Workspace
            </span>
          </div>

          {/* Navigation Links List */}
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-white text-[#0F172A] shadow-xs border border-[#E5E7EB]"
                      : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
                  }`}
                >
                  <span className={isActive ? "text-[#FF5B37]" : "text-[#94A3B8]"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Card & Sign Out */}
        <div className="p-3 border-t border-[#E5E7EB] bg-white space-y-2">
          <div className="flex items-center space-x-2.5 p-2 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB]">
            <div className="w-8 h-8 rounded-full bg-[#FF5B37] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
              {user.name ? user.name[0].toUpperCase() : "U"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-[#0F172A] truncate">{user.name || "User"}</div>
              <div className="text-[10px] text-[#64748B] truncate">{user.email}</div>
              {userRole && (
                <div
                  className="mt-0.5 inline-block px-1.5 py-0.2 rounded text-[9px] font-bold"
                  style={{ backgroundColor: userRole.bg, color: userRole.text }}
                >
                  {userRole.label}
                </div>
              )}
            </div>
          </div>

          <form action={onSignOut}>
            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] bg-[#F8F9FA] hover:bg-[#F1F5F9] rounded-xl transition-colors border border-[#E5E7EB]"
            >
              <svg className="w-3.5 h-3.5 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}

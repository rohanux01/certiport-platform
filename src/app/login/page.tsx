"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type Persona = {
  id: string;
  title: string;
  icon: string;
  email: string;
  roleLabel: string;
};

const PERSONAS: Persona[] = [
  {
    id: "org_admin",
    title: "Org Admin",
    icon: "👑",
    email: "j.fernandes@gttdata.ai",
    roleLabel: "Org Admin (j.fernandes@gttdata.ai)",
  },
  {
    id: "hr_ops",
    title: "HR / Ops Lead",
    icon: "⚙️",
    email: "r.okafor@gttdata.ai",
    roleLabel: "HR Specialist (r.okafor@gttdata.ai)",
  },
  {
    id: "cert_issuer",
    title: "Cert Issuer",
    icon: "🏢",
    email: "devraj.shinde@gttdata.ai",
    roleLabel: "Certificate Issuer (devraj.shinde@gttdata.ai)",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("j.fernandes@gttdata.ai");
  const [password, setPassword] = useState("DemoPass123!");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<string>("org_admin");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handlePersonaSelect(persona: Persona) {
    setSelectedPersona(persona.id);
    setEmail(persona.email);
    setPassword("DemoPass123!");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      setLoading(false);
      if (result?.error) {
        setError("Invalid email or password. Please try again.");
        return;
      }
      router.push("/dashboard");
    } catch (err: any) {
      setLoading(false);
      setError("An unexpected authentication error occurred.");
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4 sm:p-6 font-sans select-none">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-[#E0E6EB] space-y-6">
        {/* SEED Infotech Logo & Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#494BDF] to-[#3B3DC2] text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-[#494BDF]/25 mb-3">
            S
          </div>
          <h1 className="text-2xl font-extrabold text-[#423D34] tracking-tight">
            SEED <span className="text-[#494BDF]">Infotech</span>
          </h1>
          <p className="text-xs text-[#57616B] italic font-medium mt-1">
            Beyond the Obvious — Tech Career Launchpad
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-[#FEE2E2] text-[#C81E1E] text-xs font-semibold rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#423D34] mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setSelectedPersona("");
              }}
              placeholder="superadmin@seedinfotech.com"
              className="w-full px-4 py-2.5 bg-white border border-[#E0E6EB] rounded-xl text-sm font-medium text-[#423D34] focus:ring-2 focus:ring-[#494BDF] focus:outline-none transition-all placeholder:text-[#94A3B8]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#423D34] mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-white border border-[#E0E6EB] rounded-xl text-sm font-medium text-[#423D34] focus:ring-2 focus:ring-[#494BDF] focus:outline-none transition-all placeholder:text-[#94A3B8] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#423D34] transition-colors p-1"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.048 10.048 0 012.122-.063c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#494BDF] hover:bg-[#3B3DC2] text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
          >
            {loading ? (
              <span>Signing In...</span>
            ) : (
              <>
                <span>Sign In to Enterprise Workspace</span>
                <span>→</span>
              </>
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => alert("Access request form submitted to System Administrator.")}
              className="text-xs font-semibold text-[#494BDF] hover:underline"
            >
              New Staff or Faculty Member? Submit Access Request →
            </button>
          </div>
        </form>

        {/* QUICK PERSONA SWITCHER (TEST BASELINE) */}
        <div className="pt-2 border-t border-[#E0E6EB] space-y-3">
          <div className="text-[11px] font-bold text-[#57616B] uppercase tracking-wider text-center">
            QUICK PERSONA SWITCHER (TEST BASELINE)
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {PERSONAS.map((persona) => {
              const isSelected = selectedPersona === persona.id || email === persona.email;
              return (
                <button
                  key={persona.id}
                  type="button"
                  onClick={() => handlePersonaSelect(persona)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    isSelected
                      ? "border-[#494BDF] bg-[#EEF2FF] text-[#494BDF] shadow-2xs ring-2 ring-[#494BDF]/20"
                      : "border-[#E0E6EB] bg-white text-[#423D34] hover:bg-[#F2F5F7] hover:border-[#CBD5E1]"
                  }`}
                  title={persona.roleLabel}
                >
                  <span className="text-sm">{persona.icon}</span>
                  <span>{persona.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Student Learning Portal Container */}
        <div className="bg-[#F0F5FF] border border-[#D6E4FF] rounded-2xl p-4 text-center space-y-3">
          <p className="text-xs font-bold text-[#1E3A8A]">
            Are you a student looking to access your learning portal?
          </p>

          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => alert("Redirecting to Student Portal...")}
              className="px-3.5 py-1.5 bg-[#494BDF] hover:bg-[#3B3DC2] text-white text-xs font-bold rounded-lg shadow-2xs transition-colors"
            >
              Student Sign In →
            </button>
            <button
              type="button"
              onClick={() => alert("Redirecting to Online Registration...")}
              className="px-3.5 py-1.5 bg-white hover:bg-gray-50 text-[#423D34] border border-[#E0E6EB] text-xs font-bold rounded-lg transition-colors shadow-2xs"
            >
              Self-Register Online
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

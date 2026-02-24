import Link from "next/link";
import { Icon } from "@/components/ui/icon";

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0B0D17] px-6 py-5">
      {/* Back Button */}
      <Link href="/" className="mb-8">
        <Icon name="arrowLeft" size={22} color="#64748B" />
      </Link>

      {/* Title */}
      <div className="text-[28px] font-extrabold text-white tracking-tight mb-1.5">
        Welcome back
      </div>
      <div className="text-[14px] text-gray-400 mb-9">
        Sign in to continue your journey
      </div>

      {/* Form Fields */}
      <div className="flex flex-col gap-3 mb-6">
        {["Email address", "Password"].map((label, i) => (
          <div
            key={label}
            className="bg-[#131520] border border-white/10 rounded-2xl p-3.5"
          >
            <div className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">
              {label}
            </div>
            <div className="text-[14px] text-white">
              {i === 0 ? "alex@example.com" : "••••••••"}
            </div>
          </div>
        ))}
      </div>

      {/* Forgot Password */}
      <div className="text-right mb-7">
        <span className="text-[13px] text-blue-500">Forgot password?</span>
      </div>

      {/* Sign In Button */}
      <Link
        href="/dashboard"
        className="py-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white text-base font-bold text-center shadow-[0_8px_24px_rgba(59,130,246,0.35)] mb-6"
      >
        Sign In
      </Link>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-[12px] text-gray-600">or continue with</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* OAuth Buttons */}
      <div className="flex gap-3 mb-auto">
        {["Google", "Apple"].map((provider) => (
          <button
            key={provider}
            className="flex-1 py-3.5 rounded-2xl border border-white/15 bg-[#131520] text-white text-[14px] font-semibold flex items-center justify-center gap-2"
          >
            <Icon name={provider.toLowerCase() as any} size={18} />
            {provider}
          </button>
        ))}
      </div>

      {/* Sign Up Link */}
      <div className="text-center pt-6">
        <span className="text-[13px] text-gray-400">Don't have an account? </span>
        <span className="text-[13px] text-blue-500 font-semibold">Sign up</span>
      </div>
    </div>
  );
}

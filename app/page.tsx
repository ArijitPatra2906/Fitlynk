import Link from "next/link";
import { Icon } from "@/components/ui/icon";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-10 bg-gradient-to-br from-[#0B0D17] via-[#0d1b3e] to-[#0B0D17]">
      <div className="flex flex-col items-center gap-0">
        {/* Logo */}
        <div className="mb-6 relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center shadow-[0_0_60px_rgba(59,130,246,0.5)]">
            <Icon name="zap" size={36} color="white" strokeWidth={2.5} />
          </div>
          <div className="absolute inset-[-8px] rounded-[32px] border border-blue-500/20 animate-pulse" />
        </div>

        {/* Brand */}
        <h1 className="text-5xl font-extrabold text-white tracking-tight mb-2">
          Fitlynk
        </h1>
        <p className="text-gray-400 text-sm tracking-[0.1em] uppercase mb-16">
          Your fitness, unified.
        </p>

        {/* CTA Buttons */}
        <Link
          href="/dashboard"
          className="w-full max-w-xs py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-base font-bold text-center shadow-[0_8px_32px_rgba(59,130,246,0.4)] hover:shadow-[0_8px_40px_rgba(59,130,246,0.6)] transition-all"
        >
          Get Started
        </Link>
        <Link
          href="/login"
          className="mt-3 bg-transparent text-gray-400 text-sm py-2"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}

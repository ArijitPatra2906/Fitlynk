"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { ProgressRing } from "@/components/ui/progress-ring";
import { MacroPill } from "@/components/ui/macro-pill";
import { BottomNav } from "@/components/layout/bottom-nav";
import Link from "next/link";

export default function DashboardPage() {
  const [fabOpen, setFabOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-[#0B0D17] overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 px-6 pt-safe pb-3 flex items-center justify-between bg-[#0B0D17] border-b border-white/5">
        <div>
          <div className="text-[13px] text-gray-400 mb-0.5">Good morning 👋</div>
          <div className="text-[22px] font-extrabold text-white tracking-tight">
            Alex
          </div>
        </div>
        <div className="flex gap-2.5">
          <button className="w-10 h-10 rounded-xl bg-[#131520] border border-white/5 flex items-center justify-center">
            <Icon name="bell" size={18} color="#64748B" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-base font-bold text-white">
            A
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 pt-5 pb-4">
        {/* Calorie Card */}
        <div className="bg-gradient-to-br from-[#1a1f35] to-[#0d1b3e] border border-blue-500/20 rounded-3xl p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">
                Today's Calories
              </div>
              <div className="text-[30px] font-extrabold text-white tracking-tight leading-none">
                1,847
              </div>
              <div className="text-[13px] text-gray-400">of 2,400 kcal</div>
            </div>
            <ProgressRing percent={77} size={88} stroke={7} color="#3B82F6" label="77%" sublabel="kcal" />
          </div>
          <div className="flex gap-4">
            <MacroPill label="Protein" current={142} target={180} color="#10B981" />
            <MacroPill label="Carbs" current={198} target={280} color="#F59E0B" />
            <MacroPill label="Fat" current={58} target={80} color="#EF4444" />
          </div>
        </div>

        {/* Activity Row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-[#131520] border border-white/5 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-[30px] h-[30px] rounded-xl bg-red-500/15 flex items-center justify-center">
                <Icon name="fire" size={16} color="#EF4444" />
              </div>
              <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">
                Streak
              </span>
            </div>
            <div className="text-[26px] font-extrabold text-white">14</div>
            <div className="text-[12px] text-gray-400">days 🔥</div>
          </div>

          <div className="bg-[#131520] border border-white/5 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-[30px] h-[30px] rounded-xl bg-green-500/15 flex items-center justify-center">
                <Icon name="water" size={16} color="#10B981" />
              </div>
              <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">
                Water
              </span>
            </div>
            <div className="text-[26px] font-extrabold text-white">
              1.8<span className="text-[13px] text-gray-400 font-normal">L</span>
            </div>
            <div className="w-full h-[3px] bg-[#1e2030] rounded-full mt-2">
              <div className="w-[60%] h-full bg-green-500 rounded-full" />
            </div>
          </div>

          <div className="bg-[#131520] border border-white/5 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-[30px] h-[30px] rounded-xl bg-indigo-500/15 flex items-center justify-center">
                <Icon name="dumbbell" size={16} color="#818CF8" />
              </div>
              <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">
                Today
              </span>
            </div>
            <div className="text-[13px] font-bold text-green-500">✓ Done</div>
            <div className="text-[11px] text-gray-400 mt-0.5">Push A</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-4">
          <div className="text-[14px] font-bold text-white mb-3">Recent Activity</div>
          {[
            {
              icon: "utensils",
              label: "Lunch",
              sub: "Grilled chicken, rice",
              cal: 520,
              color: "#F59E0B",
              time: "1h ago",
            },
            {
              icon: "dumbbell",
              label: "Push A",
              sub: "Bench · OHP · Triceps",
              cal: 320,
              color: "#818CF8",
              time: "6h ago",
            },
            {
              icon: "utensils",
              label: "Breakfast",
              sub: "Oats, banana, whey",
              cal: 430,
              color: "#10B981",
              time: "8h ago",
            },
          ].map((item) => (
            <div
              key={item.label + item.time}
              className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0"
            >
              <div
                className="w-[38px] h-[38px] rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: item.color + "20" }}
              >
                <Icon name={item.icon} size={18} color={item.color} />
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-white">{item.label}</div>
                <div className="text-[11px] text-gray-400">{item.sub}</div>
              </div>
              <div className="text-right">
                <div className="text-[13px] font-semibold text-white">{item.cal} kcal</div>
                <div className="text-[11px] text-gray-400">{item.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAB */}
      {fabOpen && (
        <div className="absolute bottom-28 right-6 flex flex-col gap-2.5 items-end z-20">
          {[
            { label: "Log Meal", icon: "utensils", color: "#F59E0B", href: "/nutrition" },
            { label: "Log Workout", icon: "dumbbell", color: "#818CF8", href: "/exercise" },
            { label: "Log Weight", icon: "trending", color: "#10B981", href: "/progress" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setFabOpen(false)}
              className="flex items-center gap-2.5 py-2.5 px-4 rounded-2xl bg-[#1a1f35] border shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
              style={{ borderColor: item.color + "33" }}
            >
              <span className="text-[13px] font-semibold text-white">{item.label}</span>
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: item.color + "22" }}
              >
                <Icon name={item.icon} size={16} color={item.color} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setFabOpen(!fabOpen)}
        className="absolute bottom-20 right-6 w-[52px] h-[52px] rounded-[18px] bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-[0_8px_24px_rgba(59,130,246,0.5)] z-10 transition-transform"
        style={{ transform: fabOpen ? "rotate(45deg)" : "rotate(0)" }}
      >
        <Icon name="plus" size={24} color="white" strokeWidth={2.5} />
      </button>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

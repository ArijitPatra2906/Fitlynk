"use client";

import { Icon } from "@/components/ui/icon";
import { BarChart } from "@/components/ui/bar-chart";
import { BottomNav } from "@/components/layout/bottom-nav";
import Link from "next/link";

const templates = [
  {
    name: "Push A",
    exercises: "Bench · OHP · Tricep Dips",
    sets: "12 sets",
    icon: "dumbbell",
    color: "#818CF8",
    lastDone: "2 days ago",
  },
  {
    name: "Pull B",
    exercises: "Deadlift · Rows · Curls",
    sets: "11 sets",
    icon: "repeat",
    color: "#10B981",
    lastDone: "4 days ago",
  },
  {
    name: "Legs C",
    exercises: "Squat · RDL · Lunges",
    sets: "14 sets",
    icon: "zap",
    color: "#F59E0B",
    lastDone: "5 days ago",
  },
];

export default function ExercisePage() {
  return (
    <div className="flex flex-col h-screen bg-[#0B0D17] overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 px-6 pt-safe pb-3 flex items-center justify-between bg-[#0B0D17] border-b border-white/5">
        <div className="text-[22px] font-extrabold text-white tracking-tight">
          Exercise
        </div>
        <button className="py-2 px-4 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white text-[13px] font-bold">
          + New
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 pt-5 pb-4">
        {/* Quick Start Card */}
        <Link
          href="/workout"
          className="block bg-gradient-to-br from-[#1a1f35] to-[#0d1b3e] border border-indigo-500/25 rounded-[22px] p-5 mb-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
              <Icon name="zap" size={22} color="#818CF8" />
            </div>
            <div className="flex items-center gap-1.5 text-indigo-400 text-[13px] font-semibold">
              Start <Icon name="chevronRight" size={16} color="#818CF8" />
            </div>
          </div>
          <div className="text-lg font-bold text-white mb-1">Quick Workout</div>
          <div className="text-[13px] text-gray-400">Log exercises as you go</div>
        </Link>

        {/* Templates */}
        <div className="text-[14px] font-bold text-white mb-3">My Templates</div>
        {templates.map((template) => (
          <Link
            key={template.name}
            href="/workout"
            className="flex items-center gap-3.5 p-4 bg-[#131520] border border-white/5 rounded-2xl mb-2.5"
          >
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: template.color + "20" }}
            >
              <Icon name={template.icon} size={20} color={template.color} />
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-bold text-white mb-0.5">
                {template.name}
              </div>
              <div className="text-[12px] text-gray-400">{template.exercises}</div>
            </div>
            <div className="text-right">
              <div className="text-[12px] font-semibold" style={{ color: template.color }}>
                {template.sets}
              </div>
              <div className="text-[11px] text-gray-600">{template.lastDone}</div>
            </div>
          </Link>
        ))}

        {/* Weekly Volume Chart */}
        <div className="bg-[#131520] border border-white/5 rounded-[22px] p-[18px] mt-1.5">
          <div className="text-[13px] font-bold text-white mb-1">Volume This Week</div>
          <div className="text-[11px] text-gray-400 mb-3.5">
            Total weight lifted (kg)
          </div>
          <BarChart
            data={[4200, 0, 5800, 3900, 6200, 0, 4100]}
            color="#818CF8"
            labels={["M", "T", "W", "T", "F", "S", "S"]}
          />
        </div>
      </div>

      {/* Bottom Navigation - Fixed */}
      <BottomNav />
    </div>
  );
}

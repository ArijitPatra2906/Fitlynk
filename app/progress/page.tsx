"use client";

import { Icon } from "@/components/ui/icon";

const weights = [83.2, 82.9, 82.5, 82.1, 81.8, 81.5, 81.2];

export default function ProgressPage() {
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const H = 100;
  const W = 280;
  const PAD = 20;

  const points = weights.map((w, i) => {
    const x = PAD + (i / (weights.length - 1)) * (W - PAD * 2);
    const y = PAD + ((maxW - w) / (maxW - minW)) * (H - PAD * 2);
    return { x, y };
  });

  return (
    <div className="px-6 pt-4 pb-4">
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {["Weight", "Macros", "Workouts", "Photos"].map((tab, i) => (
          <div
            key={tab}
            className={`py-1.5 px-3.5 rounded-xl text-[12px] font-semibold ${
              i === 0
                ? "bg-blue-600 text-white"
                : "bg-[#131520] border border-white/5 text-gray-400"
            }`}
          >
            {tab}
          </div>
        ))}
      </div>
        {/* Weight Chart */}
        <div className="bg-[#131520] border border-white/5 rounded-[22px] p-[18px] mb-3.5">
          <div className="flex justify-between items-start mb-3.5">
            <div>
              <div className="text-[12px] text-gray-400 mb-0.5">Body Weight</div>
              <div className="text-[26px] font-extrabold text-white tracking-tight">
                81.2 <span className="text-[14px] text-gray-400 font-normal">kg</span>
              </div>
              <div className="text-[12px] text-green-500 flex items-center gap-1 mt-0.5">
                <Icon name="trending" size={12} color="#10B981" /> −2.0 kg this month
              </div>
            </div>
            <div className="text-[12px] text-gray-400 bg-[#0B0D17] rounded-lg py-1 px-2.5">
              7 days
            </div>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[100px] overflow-visible">
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon
              points={points.map((p) => `${p.x},${p.y}`).join(" ") + ` ${W - PAD},${H} ${PAD},${H}`}
              fill="url(#grad)"
            />
            <polyline
              points={points.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={i === points.length - 1 ? 5 : 3}
                fill={i === points.length - 1 ? "#3B82F6" : "#1e2030"}
                stroke="#3B82F6"
                strokeWidth="2"
              />
            ))}
          </svg>
          <div className="flex justify-between mt-1.5">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="text-[10px] text-gray-600">{d}</div>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2.5 mb-3.5">
          {[
            { label: "Start", val: "85.0 kg", sub: "Jan 1", color: "#64748B" },
            { label: "Current", val: "81.2 kg", sub: "Today", color: "#3B82F6" },
            { label: "Goal", val: "78.0 kg", sub: "Target", color: "#10B981" },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-[#131520] border border-white/5 rounded-2xl p-3.5 text-center"
            >
              <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                {item.label}
              </div>
              <div className="text-[15px] font-extrabold" style={{ color: item.color }}>
                {item.val}
              </div>
              <div className="text-[10px] text-gray-600">{item.sub}</div>
            </div>
          ))}
        </div>

        {/* PRs */}
        <div className="bg-[#131520] border border-white/5 rounded-[22px] p-[18px]">
          <div className="flex items-center gap-2 mb-3.5">
            <Icon name="award" size={16} color="#F59E0B" />
            <span className="text-[14px] font-bold text-white">Personal Records</span>
          </div>
          {[
            { exercise: "Bench Press", pr: "100 kg × 3", date: "Dec 2025" },
            { exercise: "Deadlift", pr: "140 kg × 1", date: "Jan 2026" },
            { exercise: "Squat", pr: "120 kg × 2", date: "Jan 2026" },
          ].map((item) => (
            <div
              key={item.exercise}
              className="flex justify-between py-2.5 border-b border-white/5 last:border-0"
            >
              <span className="text-[13px] text-gray-300">{item.exercise}</span>
              <div className="text-right">
                <div className="text-[13px] font-bold text-amber-500">{item.pr}</div>
                <div className="text-[11px] text-gray-600">{item.date}</div>
              </div>
            </div>
          ))}
        </div>
    </div>
  );
}

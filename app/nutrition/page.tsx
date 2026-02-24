"use client";

import { Icon } from "@/components/ui/icon";
import { ProgressRing } from "@/components/ui/progress-ring";
import { MacroPill } from "@/components/ui/macro-pill";
import { BottomNav } from "@/components/layout/bottom-nav";
import Link from "next/link";

const meals = [
  {
    label: "Breakfast",
    cal: 430,
    items: ["Oats 80g", "Banana", "Whey Protein 30g"],
    color: "#F59E0B",
  },
  {
    label: "Lunch",
    cal: 520,
    items: ["Chicken Breast 200g", "Brown Rice 150g"],
    color: "#10B981",
  },
  {
    label: "Snacks",
    cal: 180,
    items: ["Greek Yoghurt", "Almonds 30g"],
    color: "#818CF8",
  },
  { label: "Dinner", cal: null, items: [], color: "#3B82F6" },
];

export default function NutritionPage() {
  return (
    <div className="flex flex-col h-screen bg-[#0B0D17] overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 px-6 pt-safe pb-3 flex items-center justify-between bg-[#0B0D17] border-b border-white/5">
        <div className="text-[22px] font-extrabold text-white">Nutrition</div>
        <div className="flex gap-1.5 bg-[#131520] rounded-xl p-1 border border-white/5">
          {["Today", "Week"].map((label, i) => (
            <div
              key={label}
              className={`py-1.5 px-3.5 rounded-lg text-[12px] font-semibold ${
                i === 0 ? "bg-blue-600 text-white" : "text-gray-400"
              }`}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-4">
        {/* Macro Summary */}
        <div className="bg-[#131520] border border-white/5 rounded-[22px] p-[18px] mb-4 flex items-center gap-4">
          <ProgressRing percent={77} size={72} stroke={6} color="#3B82F6" label="1847" sublabel="kcal" />
          <div className="flex-1 flex gap-3">
            <MacroPill label="Protein" current={142} target={180} color="#10B981" />
            <MacroPill label="Carbs" current={198} target={280} color="#F59E0B" />
            <MacroPill label="Fat" current={58} target={80} color="#EF4444" />
          </div>
        </div>

        {/* Meals */}
        {meals.map((meal) => (
          <div
            key={meal.label}
            className="bg-[#131520] border border-white/5 rounded-2xl mb-2.5 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-2.5 h-2.5 rounded"
                  style={{ backgroundColor: meal.color }}
                />
                <span className="text-[14px] font-bold text-white">{meal.label}</span>
                {meal.cal && (
                  <span className="text-[12px] text-gray-400">{meal.cal} kcal</span>
                )}
              </div>
              <Link
                href="/food-search"
                className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center"
              >
                <Icon name="plus" size={14} color="#3B82F6" strokeWidth={2.5} />
              </Link>
            </div>
            {meal.items.map((item) => (
              <div
                key={item}
                className="px-4 py-2.5 border-t border-white/5 flex items-center justify-between"
              >
                <span className="text-[13px] text-gray-300">{item}</span>
              </div>
            ))}
            {meal.items.length === 0 && (
              <div className="px-4 py-3.5 border-t border-white/5 text-center text-[12px] text-gray-600">
                No items yet · tap + to add
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Navigation - Fixed */}
      <BottomNav />
    </div>
  );
}

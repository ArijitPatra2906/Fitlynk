"use client";

import { Icon } from "@/components/ui/icon";

const results = [
  { name: "Chicken Breast", brand: "USDA", cal: 165, p: 31, c: 0, f: 3.6 },
  { name: "Brown Rice (cooked)", brand: "Open Food Facts", cal: 123, p: 2.6, c: 26, f: 0.9 },
  { name: "Greek Yoghurt 0%", brand: "Chobani", cal: 59, p: 10, c: 3.6, f: 0.7 },
  { name: "Banana", brand: "USDA", cal: 89, p: 1.1, c: 23, f: 0.3 },
  { name: "Whey Protein", brand: "Optimum Nutrition", cal: 120, p: 24, c: 3, f: 1.5 },
];

export default function FoodSearchPage() {
  return (
    <div>
      {/* Search Bar (custom, below AppBar) */}
      <div className="px-6 pt-3 pb-3 bg-[#0B0D17] border-b border-white/5">
        <div className="flex items-center gap-2.5 bg-[#131520] border border-blue-500/30 rounded-2xl py-3 px-3.5">
          <Icon name="search" size={16} color="#3B82F6" />
          <span className="text-[14px] text-gray-400">Search food or scan barcode…</span>
        </div>
      </div>

      {/* Content */}
      <div>
        {/* Tags */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex gap-2 overflow-x-auto pb-1">
          {["⭐ Favourites", "🕒 Recent", "🥣 Breakfast", "🍗 Proteins"].map((tag) => (
            <div
              key={tag}
              className={`flex-shrink-0 py-1.5 px-3.5 rounded-full text-[12px] font-semibold whitespace-nowrap ${
                tag.startsWith("⭐")
                  ? "bg-blue-500/20 border border-blue-500/40 text-blue-500"
                  : "bg-[#131520] border border-white/10 text-gray-400"
              }`}
            >
              {tag}
            </div>
          ))}
          </div>
        </div>

        {/* Results */}
        <div className="px-6 pb-4">
        <div className="text-[12px] text-gray-400 font-semibold mb-2.5 pt-1">
          SEARCH RESULTS — per 100g
        </div>
        {results.map((item) => (
          <div
            key={item.name}
            className="bg-[#131520] border border-white/5 rounded-2xl p-3.5 mb-2 flex items-center gap-3"
          >
            <div className="flex-1">
              <div className="text-[14px] font-semibold text-white mb-0.5">
                {item.name}
              </div>
              <div className="text-[11px] text-gray-600 mb-1.5">{item.brand}</div>
              <div className="flex gap-2">
                {[
                  ["cal", item.cal, "#F59E0B"],
                  ["P", item.p + "g", "#10B981"],
                  ["C", item.c + "g", "#3B82F6"],
                  ["F", item.f + "g", "#EF4444"],
                ].map(([label, value, color]) => (
                  <div key={label as string} className="text-[10px] font-bold">
                    <span style={{ color: color as string }}>{label} </span>
                    <span className="text-gray-300">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <button className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <Icon name="plus" size={16} color="#3B82F6" strokeWidth={2.5} />
            </button>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}

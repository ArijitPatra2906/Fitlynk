"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import Link from "next/link";

export default function WorkoutPage() {
  const [timer, setTimer] = useState(1847);

  useEffect(() => {
    const interval = setInterval(() => setTimer((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const exercises = [
    {
      name: "Bench Press",
      sets: [
        { weight: 60, reps: 12, done: true },
        { weight: 80, reps: 8, done: true },
        { weight: 80, reps: 7, done: false },
      ],
    },
    {
      name: "Overhead Press",
      sets: [{ weight: 40, reps: 10, done: false }],
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0D17]">
      {/* Header */}
      <div className="bg-[#131520] border-b border-white/5 px-6 py-3">
        <div className="flex items-center justify-between mb-2.5">
          <Link href="/exercise">
            <Icon name="x" size={22} color="#64748B" />
          </Link>
          <div className="text-center">
            <div className="text-[12px] text-gray-400 uppercase tracking-wider">
              Active Workout
            </div>
            <div className="text-xl font-extrabold text-blue-500 tabular-nums tracking-tight">
              {formatTime(timer)}
            </div>
          </div>
          <button className="py-1.5 px-3.5 rounded-xl bg-green-500/15 border border-green-500/30 text-green-500 text-[13px] font-bold">
            Finish
          </button>
        </div>
        <div className="flex gap-2.5">
          {[
            { label: "Sets", val: "5" },
            { label: "Volume", val: "680 kg" },
            { label: "PRs", val: "1 🏆" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex-1 text-center bg-[#0B0D17] rounded-xl py-2"
            >
              <div className="text-[14px] font-bold text-white">{item.val}</div>
              <div className="text-[10px] text-gray-400">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Exercises */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {exercises.map((exercise) => (
          <div
            key={exercise.name}
            className="bg-[#131520] border border-white/5 rounded-2xl p-4 mb-3"
          >
            <div className="text-[15px] font-bold text-white mb-3">
              {exercise.name}
            </div>
            {/* Set Header */}
            <div className="grid grid-cols-[36px_1fr_1fr_36px] gap-2 mb-2">
              {["Set", "Weight (kg)", "Reps", "✓"].map((header) => (
                <div
                  key={header}
                  className="text-[10px] text-gray-600 font-semibold text-center uppercase tracking-wider"
                >
                  {header}
                </div>
              ))}
            </div>
            {/* Sets */}
            {exercise.sets.map((set, index) => (
              <div
                key={index}
                className="grid grid-cols-[36px_1fr_1fr_36px] gap-2 mb-1.5 items-center"
                style={{ opacity: set.done ? 0.7 : 1 }}
              >
                <div className="text-[13px] text-gray-400 text-center">
                  {index + 1}
                </div>
                <div
                  className={`rounded-xl py-2 text-center text-[14px] font-bold text-white ${
                    set.done
                      ? "bg-green-500/10 border border-green-500/25"
                      : "bg-[#1a1f35] border border-white/10"
                  }`}
                >
                  {set.weight}
                </div>
                <div
                  className={`rounded-xl py-2 text-center text-[14px] font-bold text-white ${
                    set.done
                      ? "bg-green-500/10 border border-green-500/25"
                      : "bg-[#1a1f35] border border-white/10"
                  }`}
                >
                  {set.reps}
                </div>
                <div
                  className={`w-[34px] h-[34px] rounded-xl flex items-center justify-center ${
                    set.done
                      ? "bg-green-500 border border-green-500"
                      : "bg-[#1a1f35] border border-white/10"
                  }`}
                >
                  {set.done && <Icon name="check" size={16} color="white" strokeWidth={2.5} />}
                </div>
              </div>
            ))}
            <button className="w-full py-2.5 rounded-xl bg-indigo-500/10 border border-dashed border-indigo-500/30 text-indigo-400 text-[13px] font-semibold mt-1">
              + Add Set
            </button>
          </div>
        ))}
        <button className="w-full py-3.5 rounded-2xl bg-blue-500/10 border border-dashed border-blue-500/30 text-blue-500 text-[14px] font-semibold">
          + Add Exercise
        </button>
      </div>
    </div>
  );
}

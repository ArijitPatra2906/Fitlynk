"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import { stepTracker } from "@/lib/services/step-tracker";

interface StepModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSteps: number;
  onSave: (steps: number) => void;
}

export function StepModal({ isOpen, onClose, currentSteps, onSave }: StepModalProps) {
  const [steps, setSteps] = useState(currentSteps.toString());
  const [isAutoSync, setIsAutoSync] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");

  useEffect(() => {
    // Check if automatic tracking is supported
    setIsAutoSync(stepTracker.isSupported());
  }, []);

  if (!isOpen) return null;

  const handleSave = () => {
    const stepValue = parseInt(steps) || 0;
    onSave(stepValue);
    onClose();
  };

  const handleQuickAdd = (amount: number) => {
    const current = parseInt(steps) || 0;
    setSteps((current + amount).toString());
  };

  const handleSyncFromDevice = async () => {
    if (!isAutoSync) return;

    setSyncStatus("syncing");
    try {
      const deviceSteps = await stepTracker.getTodaySteps();
      setSteps(deviceSteps.toString());
      setSyncStatus("success");
      setTimeout(() => setSyncStatus("idle"), 2000);
    } catch (error) {
      console.error("Error syncing steps:", error);
      setSyncStatus("error");
      setTimeout(() => setSyncStatus("idle"), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#131520] rounded-t-3xl border-t border-x border-white/10 shadow-2xl animate-slide-up pb-safe">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 pt-2 pb-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-bold text-white">Daily Steps</h2>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center"
            >
              <Icon name="x" size={18} color="#64748B" />
            </button>
          </div>
          <p className="text-[13px] text-gray-400 mt-1">
            Track your daily step count
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Step Input */}
          <div className="mb-5">
            <label className="text-[12px] text-gray-400 font-semibold uppercase tracking-wide mb-2 block">
              Steps Today
            </label>
            <div className="relative">
              <input
                type="number"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                className="w-full bg-[#1a1f35] border border-white/10 rounded-2xl px-4 py-4 text-[24px] font-bold text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                placeholder="0"
                inputMode="numeric"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-gray-400 font-semibold">
                steps
              </div>
            </div>
          </div>

          {/* Quick Add Buttons */}
          <div className="mb-5">
            <label className="text-[12px] text-gray-400 font-semibold uppercase tracking-wide mb-2 block">
              Quick Add
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1000, 2500, 5000, 10000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleQuickAdd(amount)}
                  className="bg-[#1a1f35] border border-white/10 rounded-xl py-3 text-[13px] font-semibold text-purple-400 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all"
                >
                  +{amount >= 1000 ? `${amount / 1000}k` : amount}
                </button>
              ))}
            </div>
          </div>

          {/* Auto-Sync Button (Native Only) */}
          {isAutoSync && (
            <button
              onClick={handleSyncFromDevice}
              disabled={syncStatus === "syncing"}
              className="w-full bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4 mb-5 hover:bg-purple-500/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon name="activity" size={18} color="#A855F7" />
                  </div>
                  <div className="text-left">
                    <div className="text-[13px] font-semibold text-white mb-0.5">
                      {syncStatus === "syncing" ? "Syncing..." : syncStatus === "success" ? "Synced!" : "Sync from Device"}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      Get steps from your phone sensor
                    </div>
                  </div>
                </div>
                {syncStatus === "success" && (
                  <Icon name="check" size={20} color="#10B981" />
                )}
              </div>
            </button>
          )}

          {/* Info */}
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 mb-5">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Icon name="info" size={18} color="#A855F7" />
              </div>
              <div>
                <div className="text-[13px] font-semibold text-white mb-1">
                  {isAutoSync ? "Automatic Tracking" : "Manual Entry"}
                </div>
                <div className="text-[12px] text-gray-400 leading-relaxed">
                  {isAutoSync
                    ? "Your steps are automatically tracked using your device's built-in sensor. Tap 'Sync from Device' to update."
                    : "Automatic step tracking will be available when you install the mobile app. For now, enter your steps manually."}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 text-[15px] font-semibold text-gray-300 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl py-4 text-[15px] font-semibold text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
            >
              Save Steps
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

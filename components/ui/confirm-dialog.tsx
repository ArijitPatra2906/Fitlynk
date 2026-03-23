"use client";

import { Icon } from "@/components/ui/icon";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  type = "danger",
  loading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const getTypeColors = () => {
    switch (type) {
      case "danger":
        return {
          icon: "trash-2",
          iconColor: "#EF4444",
          iconBg: "rgba(239, 68, 68, 0.1)",
          buttonBg: "bg-red-500",
          buttonHover: "hover:bg-red-600",
        };
      case "warning":
        return {
          icon: "alertTriangle",
          iconColor: "#F59E0B",
          iconBg: "rgba(245, 158, 11, 0.1)",
          buttonBg: "bg-amber-500",
          buttonHover: "hover:bg-amber-600",
        };
      case "info":
        return {
          icon: "info",
          iconColor: "#3B82F6",
          iconBg: "rgba(59, 130, 246, 0.1)",
          buttonBg: "bg-blue-500",
          buttonHover: "hover:bg-blue-600",
        };
    }
  };

  const colors = getTypeColors();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm bg-[#0B0D17] border border-white/10 rounded-[24px] p-6">
        <div className="flex flex-col items-center text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: colors.iconBg }}
          >
            <Icon name={colors.icon} size={24} color={colors.iconColor} />
          </div>

          <h2 className="text-lg font-bold text-white mb-2">{title}</h2>
          <p className="text-sm text-gray-400 mb-6">{message}</p>

          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-[#131520] border border-white/10 text-gray-400 text-sm font-semibold hover:bg-[#1a1f35] transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
              }}
              disabled={loading}
              className={`flex-1 py-2.5 rounded-xl ${colors.buttonBg} ${colors.buttonHover} text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {loading && (
                <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
              )}
              {loading ? 'Deleting...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

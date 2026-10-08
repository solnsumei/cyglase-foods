"use client";

import { AlertTriangle, Info, CheckCircle2, X } from "lucide-react";

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  showCancel?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning",
  showCancel = true,
  onConfirm,
  onCancel,
}: Props) {
  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      icon: <AlertTriangle className="w-6 h-6 text-error" />,
      bg: "bg-error/10",
      btnClass: "btn-error text-white",
    },
    warning: {
      icon: <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
      bg: "bg-amber-500/15 border border-amber-300 dark:border-amber-700",
      btnClass: "btn-warning text-white font-black shadow-sm",
    },
    info: {
      icon: <Info className="w-6 h-6 text-primary" />,
      bg: "bg-primary/10",
      btnClass: "btn-primary text-white",
    },
  }[type];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-base-100 max-w-sm w-full rounded-3xl shadow-2xl p-6 border border-base-200 animate-in zoom-in-95 duration-150">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl ${typeConfig.bg} flex items-center justify-center shrink-0`}>
            {typeConfig.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-base text-base-content tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-base-content/70 mt-1.5 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 mt-6 pt-2">
          {showCancel && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-ghost flex-1 rounded-xl text-xs font-bold"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className={`btn ${typeConfig.btnClass} flex-1 rounded-xl text-xs font-black shadow-md`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

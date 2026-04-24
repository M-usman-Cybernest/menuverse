"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
  leaving?: boolean;
};

type ToastContextValue = {
  toast: (message: string, variant?: ToastVariant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }
  return context;
}

const TOAST_DURATION = 3500;

const variantStyles: Record<ToastVariant, string> = {
  success:
    "border-[#0f766e]/20 bg-[#ecfdf5] text-[#065f46]",
  error:
    "border-[#dc2626]/20 bg-[#fef2f2] text-[#991b1b]",
  info:
    "border-[#0369a1]/20 bg-[#eff6ff] text-[#1e40af]",
};

const variantIcons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0f766e]" />,
  error: <AlertCircle className="h-4 w-4 shrink-0 text-[#dc2626]" />,
  info: <Info className="h-4 w-4 shrink-0 text-[#0369a1]" />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)),
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 280);
  }, []);

  const addToast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => removeToast(id), TOAST_DURATION);
    },
    [removeToast],
  );

  const value: ToastContextValue = {
    toast: addToast,
    success: useCallback(
      (message: string) => addToast(message, "success"),
      [addToast],
    ),
    error: useCallback(
      (message: string) => addToast(message, "error"),
      [addToast],
    ),
    info: useCallback(
      (message: string) => addToast(message, "info"),
      [addToast],
    ),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast container */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed top-0 right-0 z-[9999] flex flex-col items-end gap-2 p-4 sm:p-6"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur transition-all duration-280",
              variantStyles[item.variant],
              item.leaving
                ? "translate-x-full opacity-0"
                : "toast-enter",
            )}
          >
            {variantIcons[item.variant]}
            <p className="flex-1 text-sm font-medium leading-snug">
              {item.message}
            </p>
            <button
              aria-label="Dismiss"
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full opacity-60 transition hover:opacity-100"
              onClick={() => removeToast(item.id)}
              type="button"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

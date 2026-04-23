"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";

import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  maxWidth?: string;
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  maxWidth = "max-w-lg",
}: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className={cn(
              "relative z-10 w-full rounded-xl border border-[#e7dfd2] bg-white shadow-2xl",
              maxWidth,
              className,
            )}
          >
            {title || description ? (
              <div className="flex items-start justify-between border-b border-[#e7dfd2] px-6 py-4">
                <div className="pr-8">
                  {title ? (
                    <h2 className="text-lg font-semibold text-[#111827]">
                      {title}
                    </h2>
                  ) : null}
                  {description ? (
                    <p className="mt-1 text-sm text-[#6b7280]">
                      {description}
                    </p>
                  ) : null}
                </div>
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-[#6b7280] transition hover:bg-[#f2ede2] hover:text-[#111827]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onClose}
                className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-[#6b7280] transition hover:bg-[#f2ede2] hover:text-[#111827]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <div className="max-h-[75vh] overflow-y-auto px-6 py-5">
              {children}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

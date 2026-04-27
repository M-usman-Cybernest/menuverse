"use client";

import { Move3D } from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

import { ModelViewerElement } from "@/components/ar/model-viewer-element";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resolveDriveUrl } from "@/lib/google-drive";
import type { MenuItem } from "@/lib/types";

type ArViewerDrawerProps = {
  item: MenuItem | null;
  open: boolean;
  qrValue: string;
  restaurantName: string;
  onClose: () => void;
};

export function ArViewerDrawer({
  item,
  open,
  qrValue,
  onClose,
}: ArViewerDrawerProps) {
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    if (open && qrValue) {
      void QRCode.toDataURL(qrValue, {
        width: 400,
        margin: 1,
        color: {
          dark: "#0c0c0cff",
          light: "#ffffff",
        },
      }).then(setQrDataUrl);
    }
  }, [open, qrValue]);

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

  if (!item || !open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer / Modal */}
      <div className="relative z-10 flex w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-[#e7dfd2] bg-white shadow-2xl sm:rounded-2xl" style={{ maxHeight: "92vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e7dfd2] px-4 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold text-[#111827]">
              {item.name}
            </h2>
            <p className="text-sm text-[#6b7280]">3D Experience &amp; AR Preview</p>
          </div>
          <Button
            onClick={onClose}
            size="sm"
            variant="outline"
            className="ml-3 shrink-0 rounded-xl"
          >
            Close
          </Button>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col overflow-y-auto md:flex-row" style={{ minHeight: 0 }}>
          {/* 3D Viewer - full width on mobile, right side on desktop */}
          <div className="order-1 w-full md:order-2 md:w-1/2 lg:w-3/5">
            <div
              className="relative w-full bg-[#f7f3eb]"
              style={{ height: "clamp(280px, 50vh, 500px)" }}
            >
              <ModelViewerElement item={item} key={item.id} />
            </div>
          </div>

          {/* Info Panel */}
          <div className="order-2 flex w-full flex-col gap-4 p-4 sm:p-6 md:order-1 md:w-1/2 md:overflow-y-auto lg:w-2/5">
            {/* Description */}
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#0f766e]">
                Tableside Preview
              </p>
              <p className="text-sm leading-relaxed text-[#4b5563]">
                {item.description || "Explore this dish in 3D before you order."}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {item.dietaryTags.map((tag) => (
                  <Badge key={tag} className="rounded-xl bg-[#f2ede2] text-[#4b5563] hover:bg-[#e8dfcf]">{tag}</Badge>
                ))}
              </div>
            </div>

            {/* QR Code */}
            <div className="rounded-xl border border-[#ece4d8] bg-[#fffcf8] p-4">
              <div className="flex items-center gap-4">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-[#ece4d8] bg-white p-1.5 shadow-sm sm:h-28 sm:w-28">
                  {qrDataUrl ? (
                    <Image
                      src={qrDataUrl}
                      alt="AR QR Code"
                      width={112}
                      height={112}
                      className="h-full w-full object-contain"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-50 text-[10px] text-gray-400">
                      Generating...
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-semibold text-[#111827]">
                    AR Discovery
                  </p>
                  <p className="text-xs leading-relaxed text-[#6b7280]">
                    Scan to view this item in your own space using AR on your phone.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

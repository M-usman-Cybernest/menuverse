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
        <div className="flex flex-1 flex-col overflow-hidden md:flex-row" style={{ minHeight: 0 }}>
          {/* Info Panel */}
          <div className="order-2 flex w-full flex-col gap-4 p-4 sm:p-5 md:order-1 md:w-1/2 md:h-[500px] md:overflow-y-auto lg:w-2/5">
            {/* Description */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0f766e]">
                Tableside Preview
              </p>
              <h3 className="text-lg font-bold text-[#111827]">{item.name}</h3>
              <p className="text-xs leading-relaxed text-[#4b5563]">
                {item.description || "Explore this dish in 3D before you order."}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {item.dietaryTags.map((tag) => (
                  <Badge key={tag} className="rounded-lg bg-[#f2ede2] px-2 py-0.5 text-[10px] text-[#4b5563] hover:bg-[#e8dfcf]">{tag}</Badge>
                ))}
              </div>
            </div>

            {/* QR Code */}
            <div className="rounded-xl border border-[#ece4d8] bg-[#fffcf8] p-4">
              <div className="flex flex-col gap-3">
                <div className="space-y-1">
                  <p className="text-[11px] leading-relaxed text-[#6b7280]">
                    Scan this QR code to view this item in your own space using Augmented Reality on your phone.
                  </p>
                </div>
                <div className="relative mx-auto h-40 w-40 shrink-0 overflow-hidden rounded-xl border border-[#ece4d8] bg-white p-2 shadow-sm sm:h-55 sm:w-55">
                  {qrDataUrl ? (
                    <Image
                      src={qrDataUrl}
                      alt="AR QR Code"
                      width={200}
                      height={200}
                      className="h-full w-full object-contain"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-50 text-[10px] text-gray-400">
                      Generating...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 3D Viewer - full width on mobile, right side on desktop */}
          <div className="order-1 w-full bg-[#f7f3eb] md:order-2 md:w-1/2 lg:w-3/5">
            <div className="h-[280px] w-full md:h-[450px]">
              <ModelViewerElement item={item} key={item.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

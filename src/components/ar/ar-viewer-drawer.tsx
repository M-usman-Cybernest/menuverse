"use client";

import { Move3D } from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

import { ModelViewerElement } from "@/components/ar/model-viewer-element";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
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

  if (!item) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item.name}
      description="3D Experience & AR Preview"
      maxWidth="max-w-4xl"
    >
      <div className="flex flex-col gap-8 md:flex-row">
        <div className="flex-1 space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#0f766e]">
              Tableside Preview
            </p>
            <p className="text-base leading-relaxed text-[#4b5563]">
              {item.description || "Explore this dish in 3D before you order."}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {item.dietaryTags.map((tag) => (
                <Badge key={tag} className="rounded-xl bg-[#f2ede2] text-[#4b5563] hover:bg-[#e8dfcf]">{tag}</Badge>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#ece4d8] bg-[#fffcf8] p-5">
            <div className="flex items-center justify-between gap-6">
              <div className="flex-1 space-y-3">
                <p className="text-md font-semibold text-[#111827]">
                  AR Discovery
                </p>
                <p className="text-sm leading-relaxed text-[#6b7280]">
                  Scan the QR code to view this item in your own space, 
                  or interact with the 3D model on the right.
                </p>

              </div>
              <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-xl border border-[#ece4d8] bg-white p-2 shadow-sm sm:h-36 sm:w-36">
                {qrDataUrl ? (
                  <Image
                    src={qrDataUrl}
                    alt="AR QR Code"
                    width={144}
                    height={144}
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

          <div className="flex flex-wrap gap-3 pt-2">
            {item.arModelIosUrl && (
              <Button asChild variant="outline" className="rounded-xl">
                <a href={item.arModelIosUrl} rel="noreferrer" target="_blank">
                  <Move3D className="mr-2 h-4 w-4" />
                  iOS View
                </a>
              </Button>
            )}
            <Button onClick={onClose} className="rounded-xl bg-[#111827] text-white hover:bg-black">
              Close Preview
            </Button>
          </div>
        </div>

        <div className="w-full md:w-[35%]">
          <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-[#ece4d8] bg-white shadow-inner">
            <ModelViewerElement item={item} key={item.id} />
          </div>
        </div>
      </div>
    </Modal>
  );
}

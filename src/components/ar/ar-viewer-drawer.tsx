"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Move3D, X } from "lucide-react";

import { ModelViewerElement } from "@/components/ar/model-viewer-element";
import { QrCodeTile } from "@/components/qr/qr-code-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { MenuItem } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

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
  restaurantName,
  onClose,
}: ArViewerDrawerProps) {
  return (
    <AnimatePresence>
      {open && item ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-[#111827]/55 p-4 backdrop-blur-sm"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-[#fcfaf7] shadow-[0_32px_80px_-28px_rgba(17,24,39,0.5)]"
            exit={{ opacity: 0, y: 20 }}
            initial={{ opacity: 0, y: 24 }}
            onClick={(event) => event.stopPropagation()}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="flex items-start justify-between border-b border-[#e5dccf] px-5 py-4">
              <div className="space-y-2">
                <Badge variant="accent">AR Session</Badge>
                <div>
                  <h2 className="text-xl font-semibold text-[#111827]">{item.name}</h2>
                  <p className="text-sm text-[#6b7280]">
                    {restaurantName} · {formatPrice(item.price)}
                  </p>
                </div>
              </div>
              <Button onClick={onClose} size="icon" variant="ghost">
                <X className="h-4 w-4" />
                <span className="sr-only">Close AR view</span>
              </Button>
            </div>
            <div className="grid flex-1 gap-4 overflow-y-auto p-4 lg:grid-cols-[1.5fr_0.9fr]">
              <div className="min-h-[340px] overflow-hidden rounded-lg border border-[#e5dccf] bg-white">
                <ModelViewerElement item={item} key={item.id} />
              </div>
              <div className="flex flex-col gap-4">
                <Card>
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-center gap-2 text-[#0f766e]">
                      <Move3D className="h-4 w-4" />
                      <p className="text-sm font-semibold">Tableside Preview</p>
                    </div>
                    <p className="text-sm leading-6 text-[#4b5563]">
                      {item.description || "Explore this dish in 3D before you order."}
                    </p>
                    {item.arModelIosUrl ? (
                      <Button asChild size="sm" variant="outline">
                        <a href={item.arModelIosUrl} rel="noreferrer" target="_blank">
                          Open iOS Model
                        </a>
                      </Button>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      {item.dietaryTags.map((tag) => (
                        <Badge key={tag}>{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <QrCodeTile
                  description="Direct-to-dish QR for table tents, counters, and takeaway sleeves."
                  downloadName={`${item.id}-qr`}
                  title="Item QR"
                  value={qrValue}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

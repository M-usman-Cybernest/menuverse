"use client";

import { Move3D } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import type { MenuItem } from "@/lib/types";

type ModelViewerElementProps = {
  item: MenuItem;
};

export function ModelViewerElement({ item }: ModelViewerElementProps) {
  useEffect(() => {
    void import("@google/model-viewer");
  }, []);

  if (!item.arModelUrl && item.arModelIosUrl) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#f7f3eb] p-6 text-center">
        <div className="space-y-2">
          <p className="text-lg font-semibold text-[#111827]">3D model ready</p>
          <p className="max-w-md text-sm leading-6 text-[#6b7280]">
            This item already has an iOS Quick Look model. Open it on a supported
            iPhone or iPad for the native 3D preview.
          </p>
        </div>
        <Button asChild size="lg">
          <a href={item.arModelIosUrl} rel="noreferrer" target="_blank">
            <Move3D className="h-4 w-4" />
            Open 3D Model
          </a>
        </Button>
      </div>
    );
  }

  return (
    <model-viewer
      alt={item.name}
      ar
      ar-modes="webxr scene-viewer quick-look"
      camera-controls
      environment-image="neutral"
      exposure="1"
      ios-src={item.arModelIosUrl}
      poster={item.imageUrl}
      shadow-intensity="1"
      src={item.arModelUrl}
      touch-action="pan-y"
      className="h-full w-full rounded-lg bg-[#f7f3eb]"
    >
      <Button
        className="absolute inset-x-4 bottom-4"
        size="lg"
        slot="ar-button"
        type="button"
      >
        <Move3D className="h-4 w-4" />
        Launch Native AR
      </Button>
    </model-viewer>
  );
}

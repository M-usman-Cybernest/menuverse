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

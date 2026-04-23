"use client";

import {
  Expand,
  Minimize,
  Move3D,
  ScanEye,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { MenuItem } from "@/lib/types";

type ModelViewerElementProps = {
  item: MenuItem;
};

type CameraOrbit = {
  phi: string;
  radius: string;
  theta: string;
};

type ModelViewerDomElement = HTMLElement & {
  activateAR: () => Promise<void>;
  canActivateAR: boolean;
  cameraOrbit: string;
  dismissPoster: () => void;
  getCameraOrbit: () => CameraOrbit;
};

const DEFAULT_CAMERA_ORBIT = "0deg 92deg 82%";
export function ModelViewerElement({ item }: ModelViewerElementProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const modelViewerRef = useRef<ModelViewerDomElement | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    void import("@google/model-viewer");
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!modelViewerRef.current) {
        return;
      }

      modelViewerRef.current.dismissPoster();
      modelViewerRef.current.cameraOrbit = DEFAULT_CAMERA_ORBIT;
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [item.id]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === wrapperRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
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

  function handleResetView() {
    if (!modelViewerRef.current) {
      return;
    }

    modelViewerRef.current.cameraOrbit = DEFAULT_CAMERA_ORBIT;
  }

  async function handleActivateAr() {
    if (!modelViewerRef.current?.canActivateAR) {
      return;
    }

    await modelViewerRef.current.activateAR();
  }

  async function toggleFullscreen() {
    if (!wrapperRef.current) {
      return;
    }

    if (document.fullscreenElement === wrapperRef.current) {
      await document.exitFullscreen();
      return;
    }

    await wrapperRef.current.requestFullscreen();
  }

  return (
    <div className="relative h-full w-full bg-[#f7f3eb]" ref={wrapperRef}>
      <model-viewer
        alt={item.name}
        ar
        ar-modes="webxr scene-viewer quick-look"
        ar-scale="fixed"
        auto-rotate={autoRotate}
        camera-controls
        camera-orbit={DEFAULT_CAMERA_ORBIT}
        environment-image="neutral"
        exposure="1.15"
        field-of-view="28deg"
        interpolation-decay="120"
        interaction-prompt-style="wiggle"
        ios-src={item.arModelIosUrl}
        max-camera-orbit="auto auto 140%"
        max-field-of-view="36deg"
        min-camera-orbit="auto auto 58%"
        min-field-of-view="22deg"
        orbit-sensitivity="0.8"
        poster={item.imageUrl}
        shadow-intensity="1"
        src={item.arModelUrl}
        touch-action="none"
        zoom-sensitivity="0.8"
        className="h-full w-full rounded-lg bg-[#f7f3eb]"
        ref={(node) => {
          modelViewerRef.current = node as ModelViewerDomElement | null;
        }}
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

      <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap justify-between gap-2">
        <div className="pointer-events-auto rounded-full border border-white/60 bg-white/92 p-1 shadow-lg backdrop-blur">
          <div className="flex items-center gap-1">
            <IconActionButton
              ariaLabel="Reset view"
              icon={<RotateCcw className="h-4 w-4" />}
              onClick={handleResetView}
            />
            <IconActionButton
              ariaLabel="Open AR view"
              icon={<ScanEye className="h-4 w-4" />}
              onClick={() => void handleActivateAr()}
            />
          </div>
        </div>

        <div className="pointer-events-auto rounded-full border border-white/60 bg-white/92 p-1 shadow-lg backdrop-blur">
          <div className="flex items-center gap-1">
            <IconActionButton
              ariaLabel={autoRotate ? "Pause rotation" : "Start rotation"}
              icon={
                autoRotate ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )
              }
              onClick={() => setAutoRotate((current) => !current)}
            />
            <IconActionButton
              ariaLabel={isFullscreen ? "Exit fullscreen" : "Open fullscreen"}
              icon={
                isFullscreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Expand className="h-4 w-4" />
                )
              }
              onClick={() => void toggleFullscreen()}
            />
          </div>
        </div>
      </div>

    </div>
  );
}

function IconActionButton({
  ariaLabel,
  icon,
  onClick,
}: {
  ariaLabel: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={ariaLabel}
      className="flex h-10 w-10 items-center justify-center rounded-full text-[#111827] transition hover:bg-[#f1ece2]"
      onClick={onClick}
      type="button"
    >
      {icon}
    </button>
  );
}

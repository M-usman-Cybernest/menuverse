"use client";

import { Camera, GalleryHorizontal, ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/** Maximum number of images allowed per item */
const MAX_IMAGES = 5;

/** Max file size – 50 MB */
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

/** Accepted image MIME types */
const ACCEPTED_IMAGE_TYPES = "image/*";

type UploadSource = "camera" | "gallery";

interface MobileImageUploaderProps {
  /** Number of images already uploaded for this item */
  currentCount: number;
  /** Whether an upload is in progress */
  uploading: boolean;
  /** Called with each File the user selected/captured, one at a time */
  onFile: (file: File) => void | Promise<void>;
  /** Optional error message to surface beneath the trigger */
  error?: string;
}

/**
 * SmartMobileUploader
 *
 * On mobile devices renders a bottom-sheet that lets the user choose:
 *   – Camera (opens the native camera app, max 5 shots)
 *   – Gallery (opens the photo library)
 *
 * On desktop it falls back to the standard file-picker.
 */
export function MobileImageUploader({
  currentCount,
  uploading,
  onFile,
  error,
}: MobileImageUploaderProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);

  const remaining = MAX_IMAGES - currentCount;
  const disabled = uploading || remaining <= 0;

  /* ─── detect mobile once on mount ─────────────────── */
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  /* ─── helpers ──────────────────────────────────────── */
  async function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const files = Array.from(fileList).slice(0, remaining);
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        // surface error through onFile caller – skip oversized file
        continue;
      }
      await onFile(file);
    }
  }

  function openSheet() {
    if (disabled) return;
    if (isMobile) {
      setSheetOpen(true);
    } else {
      desktopInputRef.current?.click();
    }
  }

  function choose(source: UploadSource) {
    setSheetOpen(false);
    if (source === "camera") {
      cameraInputRef.current?.click();
    } else {
      galleryInputRef.current?.click();
    }
  }

  return (
    <>
      {/* ── Trigger button ── */}
      <button
        aria-label="Add product image"
        className="flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-[#d9cdbb] bg-white text-[#6b7280] transition hover:border-[#0f766e] hover:bg-[#f7f3eb] disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled}
        onClick={openSheet}
        type="button"
      >
        {uploading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0f766e] border-t-transparent" />
        ) : (
          <>
            <ImagePlus className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-tight text-center">
              {isMobile ? "Add Photo" : "Add Image"}
            </span>
          </>
        )}
      </button>

      {/* ── Error ── */}
      {error && (
        <p className="mt-1 text-xs font-medium text-[#c2410c]">{error}</p>
      )}

      {/* ── Hidden file inputs ── */}

      {/* Camera – capture="environment" opens rear camera on Android/iOS */}
      <input
        accept={ACCEPTED_IMAGE_TYPES}
        capture="environment"
        className="hidden"
        multiple
        onChange={(e) => { void handleFiles(e.target.files); e.target.value = ""; }}
        ref={cameraInputRef}
        type="file"
      />

      {/* Gallery */}
      <input
        accept={ACCEPTED_IMAGE_TYPES}
        className="hidden"
        multiple
        onChange={(e) => { void handleFiles(e.target.files); e.target.value = ""; }}
        ref={galleryInputRef}
        type="file"
      />

      {/* Desktop fallback (no capture) */}
      <input
        accept={ACCEPTED_IMAGE_TYPES}
        className="hidden"
        multiple
        onChange={(e) => { void handleFiles(e.target.files); e.target.value = ""; }}
        ref={desktopInputRef}
        type="file"
      />

      {/* ── Mobile Bottom Sheet ── */}
      {sheetOpen && (
        <>
          {/* Backdrop */}
          <div
            aria-hidden
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setSheetOpen(false)}
          />

          {/* Sheet panel */}
          <div
            role="dialog"
            aria-modal
            aria-label="Choose upload source"
          className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-white shadow-2xl sheet-enter"
          >
            {/* Handle bar */}
            <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-[#e5e7eb]" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-2 pt-4">
              <div>
                <p className="text-base font-semibold text-[#111827]">
                  Add Product Photo
                </p>
                <p className="text-xs text-[#6b7280]">
                  {remaining} of {MAX_IMAGES} slots remaining
                </p>
              </div>
              <button
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f3f4f6] text-[#6b7280] transition hover:bg-[#e5e7eb]"
                onClick={() => setSheetOpen(false)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3 px-5 pb-8 pt-3">
              {/* Camera */}
              <button
                className="flex flex-col items-center gap-3 rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-6 transition active:scale-95 hover:border-[#0f766e] hover:bg-[#f0fdf9]"
                onClick={() => choose("camera")}
                type="button"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0f766e]/10">
                  <Camera className="h-7 w-7 text-[#0f766e]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-[#111827]">Camera</p>
                  <p className="mt-0.5 text-[11px] leading-tight text-[#6b7280]">
                    Take a fresh photo instantly
                  </p>
                </div>
              </button>

              {/* Gallery */}
              <button
                className="flex flex-col items-center gap-3 rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-6 transition active:scale-95 hover:border-[#0f766e] hover:bg-[#f0fdf9]"
                onClick={() => choose("gallery")}
                type="button"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0f766e]/10">
                  <GalleryHorizontal className="h-7 w-7 text-[#0f766e]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-[#111827]">Gallery</p>
                  <p className="mt-0.5 text-[11px] leading-tight text-[#6b7280]">
                    Pick edited shots from library
                  </p>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

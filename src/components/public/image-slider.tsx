"use client";

import { ChevronLeft, ChevronRight, Move3D } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { resolveDriveUrl } from "@/lib/google-drive";

interface ImageSliderProps {
  images: string[];
  alt: string;
  hasAr?: boolean;
  className?: string;
}

export function ImageSlider({ images, alt, hasAr, className = "" }: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const allImages = images.length > 0 ? images : [""]; // Fallback to empty string for single image case if needed

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const goToSlide = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setCurrentIndex(index);
  };

  return (
    <div className={`relative group h-full w-full overflow-hidden rounded-xl bg-[#f8f9fa] ${className}`}>
      {/* Images */}
      <div 
        className="relative h-full w-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)`, display: 'flex' }}
      >
        {allImages.map((url, index) => (
          <div key={index} className="relative h-full w-full flex-shrink-0">
            <Image
              alt={`${alt} - Image ${index + 1}`}
              className="object-cover"
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              src={resolveDriveUrl(url, "image")}
              priority={index === 0}
            />
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {allImages.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-1 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-[#0f766e] shadow-sm opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-1 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-[#0f766e] shadow-sm opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Pagination Dots */}
      {allImages.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
          {allImages.map((_, index) => (
            <button
              key={index}
              onClick={(e) => goToSlide(e, index)}
              className={`h-1.5 w-1.5 rounded-full transition-all ${
                currentIndex === index ? "bg-[#0f766e] w-3" : "bg-white/60"
              }`}
            />
          ))}
        </div>
      )}

      {/* AR Badge */}
      {hasAr && (
        <div className="absolute right-2 top-2 z-10">
          <div className="rounded-xl bg-[#0f766e] p-1 text-white shadow-lg">
            <Move3D className="h-3 w-3" />
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React from "react";
import { AnnouncementBar as AnnouncementBarType } from "@/lib/types";

interface AnnouncementBarProps {
  data: AnnouncementBarType;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ data }) => {
  if (!data.show || !data.text) return null;

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-accent/90 via-accent to-accent/90 py-2.5 shadow-md">
      {/* Animated background highlights */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -inset-[100%] opacity-20 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,white_180deg,transparent_360deg)] animate-[spin_8s_linear_infinite]" />
      </div>
      
      <div className="container relative mx-auto px-4 flex justify-center items-center">
        <p className="text-sm md:text-base font-semibold text-white tracking-wide text-center">
          <span className="inline-block animate-pulse-subtle">
            {data.text}
          </span>
        </p>
      </div>

      <style jsx>{`
        @keyframes pulse-subtle {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.02); opacity: 0.95; }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

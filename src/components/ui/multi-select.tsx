"use client";

import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";

export interface Option {
  label: string;
  value: string;
  description?: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
  className,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onChange(next);
  };

  const selectedLabels = options
    .filter((opt) => selected.includes(opt.value))
    .map((opt) => opt.label);

  const handleSelectAll = () => {
    if (selected.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map((o) => o.value));
    }
  };

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex min-h-11 w-full items-center justify-between rounded-md border border-[#d9cdbb] bg-white px-3 py-2 text-sm shadow-sm transition focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/15",
          isOpen && "border-[#0f766e] ring-2 ring-[#0f766e]/15"
        )}
      >
        <div className="flex flex-wrap gap-1.5">
          {selected.length === 0 && (
            <span className="text-[#9ca3af]">{placeholder}</span>
          )}
          {selected.length === options.length && options.length > 0 ? (
            <Badge variant="accent" className="bg-[#0f766e] text-white">All Locations</Badge>
          ) : (
            selectedLabels.map((label) => (
              <Badge key={label} className="bg-[#f2ede2] text-[#1f2937]">
                {label}
              </Badge>
            ))
          )}
        </div>
        <ChevronDown className={cn("ml-2 h-4 w-4 text-[#6b7280] transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-[#d9cdbb] bg-white shadow-xl animate-in fade-in zoom-in duration-200">
          <div className="flex items-center justify-between border-b border-[#f2ede2] bg-[#faf7f2] px-3 py-2">
            <span className="text-xs font-semibold text-[#6b7280]">
              {selected.length} Selected
            </span>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs font-bold text-[#0f766e] hover:underline"
            >
              {selected.length === options.length ? "Deselect All" : "Select All"}
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {options.map((option) => {
              const isSelected = selected.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleOption(option.value)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-[#f7fbfa]",
                    isSelected && "bg-[#f0f9f8]"
                  )}
                >
                  <div className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-[#d9cdbb] transition-colors",
                    isSelected ? "border-[#0f766e] bg-[#0f766e] text-white" : "bg-white"
                  )}>
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>
                  <div className="flex flex-col">
                    <span className={cn("font-medium", isSelected ? "text-[#0f766e]" : "text-[#1f2937]")}>
                      {option.label}
                    </span>
                    {option.description && (
                      <span className="text-[10px] text-[#6b7280]">{option.description}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

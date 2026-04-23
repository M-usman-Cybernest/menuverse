"use client";

import { MapPin, Search } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type MapPickerProps = {
  value: string;
  locationLabel: string;
  onLocationChange: (mapsUrl: string) => void;
  onLabelChange: (label: string) => void;
  height?: number;
};

export function MapPicker({
  value,
  locationLabel,
  onLocationChange,
  onLabelChange,
  height = 220,
}: MapPickerProps) {
  const isDefaultLabel =
    !locationLabel ||
    locationLabel === "Add your location" ||
    locationLabel === "Address";
  const [searchQuery, setSearchQuery] = useState(
    isDefaultLabel ? "" : locationLabel,
  );
  const [activeQuery, setActiveQuery] = useState(
    isDefaultLabel ? "" : locationLabel,
  );

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      return;
    }

    const query = searchQuery.trim();
    const encodedQuery = encodeURIComponent(query);
    const mapsUrl = `https://www.google.com/maps/search/${encodedQuery}`;

    onLocationChange(mapsUrl);
    onLabelChange(query);
    setActiveQuery(query);
  }, [searchQuery, onLocationChange, onLabelChange]);

  const embedUrl = activeQuery
    ? `https://maps.google.com/maps?q=${encodeURIComponent(activeQuery)}&output=embed&z=15`
    : "";

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" />
          <Input
            className="pl-10"
            placeholder="Search for a location..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSearch();
              }
            }}
          />
        </div>
        <Button onClick={handleSearch} type="button" variant="secondary">
          <Search className="h-4 w-4" />
          Search
        </Button>
      </div>
      {activeQuery && embedUrl ? (
        <div className="overflow-hidden rounded-lg border border-[#e7dfd2] shadow-sm">
          <iframe
            allowFullScreen
            height={height}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={embedUrl}
            style={{ border: 0 }}
            title="Location Preview"
            width="100%"
          />
        </div>
      ) : (
        <div
          className="flex items-center justify-center rounded-lg border border-dashed border-[#d9cdbb] bg-[#fffcf8]"
          style={{ height }}
        >
          <div className="text-center">
            <MapPin className="mx-auto h-8 w-8 text-[#d9cdbb]" />
            <p className="mt-2 text-sm text-[#6b7280]">
              Search for a location to see the map preview
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export function NativePickerField({
  type,
  value,
  placeholder,
  onChange,
}: {
  type: "date" | "time" | "datetime-local";
  value?: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          const input = inputRef.current;
          if (!input) return;
          if (typeof input.showPicker === "function") {
            input.showPicker();
            return;
          }
          input.click();
        }}
        className="h-11 w-full rounded-2xl border border-dark-300 bg-dark-200 px-3 text-left text-sm text-light-900"
      >
        {value || placeholder}
      </button>
      <input
        ref={inputRef}
        type={type}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}

type LocationResult = {
  display_name: string;
  lat: string;
  lon: string;
};

async function searchLocations(query: string) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&q=${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    throw new Error("Failed to search location");
  }

  return (await response.json()) as LocationResult[];
}

async function reverseLocation(latitude: number, longitude: number) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
  );

  if (!response.ok) {
    throw new Error("Failed to load current location");
  }

  const data = await response.json();
  return {
    address: data?.display_name || `${latitude}, ${longitude}`,
    latitude,
    longitude,
  };
}

export function LocationPickerDialog({
  open,
  title,
  initialAddress,
  onClose,
  onApply,
}: {
  open: boolean;
  title: string;
  initialAddress?: string;
  onClose: () => void;
  onApply: (value: { address: string; latitude: number; longitude: number }) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQuery(initialAddress || "");
    setResults([]);
  }, [initialAddress, open]);

  const emptyText = useMemo(() => {
    if (loading) return "Searching locations...";
    if (query.trim()) return "No matching locations found.";
    return "Search location or use your current location.";
  }, [loading, query]);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto rounded-[28px] border-dark-300 bg-dark-200 text-light-900">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-light-900">{title}</DialogTitle>
          <DialogDescription className="text-light-500">
            Select your location on web the same way as mobile: use current location or search an address.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <Button
            type="button"
            className="justify-start rounded-2xl bg-dark-250 text-light-900 hover:bg-dark-300"
            disabled={detecting}
            onClick={() => {
              if (typeof navigator === "undefined" || !navigator.geolocation) {
                toast.error("Geolocation is not available in this browser.");
                return;
              }

              setDetecting(true);
              navigator.geolocation.getCurrentPosition(
                async (position) => {
                  try {
                    const latitude = Number(position.coords.latitude.toFixed(6));
                    const longitude = Number(position.coords.longitude.toFixed(6));
                    const resolved = await reverseLocation(latitude, longitude);
                    onApply(resolved);
                    onClose();
                  } catch {
                    toast.error("Could not resolve your current location.");
                  } finally {
                    setDetecting(false);
                  }
                },
                () => {
                  setDetecting(false);
                  toast.error("Could not access your current location.");
                },
                { enableHighAccuracy: true, timeout: 10000 }
              );
            }}
          >
            {detecting ? "Detecting current location..." : "Click here to select your current location"}
          </Button>

          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-light-500" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search location"
              className="h-12 rounded-full border-dark-300 bg-dark-250 pl-11 text-light-900 placeholder:text-light-500"
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              className="rounded-full bg-primary-500 text-light-900"
              disabled={!query.trim() || loading}
              onClick={async () => {
                try {
                  setLoading(true);
                  const nextResults = await searchLocations(query.trim());
                  setResults(nextResults);
                } catch {
                  toast.error("Failed to search location.");
                  setResults([]);
                } finally {
                  setLoading(false);
                }
              }}
            >
              Search
            </Button>
            <Button
              type="button"
              className="rounded-full bg-dark-250 text-light-900 hover:bg-dark-300"
              onClick={onClose}
            >
              Close
            </Button>
          </div>

          <div className="grid gap-2">
            {results.length > 0 ? (
              results.map((result) => (
                <button
                  key={`${result.lat}-${result.lon}-${result.display_name}`}
                  type="button"
                  onClick={() => {
                    onApply({
                      address: result.display_name,
                      latitude: Number(result.lat),
                      longitude: Number(result.lon),
                    });
                    onClose();
                  }}
                  className="rounded-[20px] border border-dark-300 bg-dark-250 p-4 text-left transition hover:border-primary-500/40"
                >
                  <p className="text-sm text-light-900">{result.display_name}</p>
                </button>
              ))
            ) : (
              <div className="rounded-[20px] border border-dashed border-dark-300 bg-dark-250 px-4 py-12 text-center text-sm text-light-500">
                {emptyText}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

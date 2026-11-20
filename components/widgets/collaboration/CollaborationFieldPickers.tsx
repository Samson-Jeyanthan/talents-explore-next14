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
  return (
    <div className="relative">
      <input
        aria-label={placeholder}
        type={type}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full min-w-0 rounded-2xl border border-dark-300 bg-dark-200 px-3 text-sm text-light-900 outline-none focus:ring-2 focus:ring-primary-500"
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
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&q=${encodeURIComponent(query)}`,
    { signal: AbortSignal.timeout(15000) },
  );

  if (!response.ok) {
    throw new Error("Failed to search location");
  }

  return (await response.json()) as LocationResult[];
}

async function reverseLocation(latitude: number, longitude: number) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
    { signal: AbortSignal.timeout(15000) },
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
  onApply: (value: {
    address: string;
    latitude: number;
    longitude: number;
  }) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [searched, setSearched] = useState(false);
  const request = useRef(0);
  const busy = useRef(false);
  const close = () => {
    request.current += 1;
    busy.current = false;
    onClose();
  };

  useEffect(() => {
    request.current += 1;
    busy.current = false;
    setLoading(false);
    setDetecting(false);
    setSearched(false);
    setQuery(initialAddress || "");
    setResults([]);
    return () => {
      request.current += 1;
      busy.current = false;
    };
  }, [initialAddress, open]);

  const emptyText = useMemo(() => {
    if (loading) return "Searching locations...";
    if (searched) return "No matching locations found. Try another address.";
    return "Search location or use your current location.";
  }, [loading, searched]);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && close()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto rounded-[28px] border-dark-300 bg-dark-200 text-light-900">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-light-900">
            {title}
          </DialogTitle>
          <DialogDescription className="text-light-500">
            Search for an address or use your current location.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <Button
            type="button"
            className="justify-start rounded-2xl bg-dark-250 text-light-900 hover:bg-dark-300"
            disabled={detecting || loading}
            onClick={() => {
              if (busy.current) return;
              if (typeof navigator === "undefined" || !navigator.geolocation) {
                toast.error("Geolocation is not available in this browser.");
                return;
              }

              const version = ++request.current;
              busy.current = true;
              setDetecting(true);
              navigator.geolocation.getCurrentPosition(
                async (position) => {
                  try {
                    const latitude = Number(
                      position.coords.latitude.toFixed(6),
                    );
                    const longitude = Number(
                      position.coords.longitude.toFixed(6),
                    );
                    const resolved = await reverseLocation(latitude, longitude);
                    if (version !== request.current) return;
                    onApply(resolved);
                    close();
                  } catch {
                    if (version === request.current)
                      toast.error(
                        "Could not resolve your current location. Please try again.",
                      );
                  } finally {
                    if (version === request.current) {
                      busy.current = false;
                      setDetecting(false);
                    }
                  }
                },
                () => {
                  if (version !== request.current) return;
                  busy.current = false;
                  setDetecting(false);
                  toast.error("Could not access your current location.");
                },
                { enableHighAccuracy: true, timeout: 10000 },
              );
            }}
          >
            {detecting
              ? "Detecting current location..."
              : "Click here to select your current location"}
          </Button>

          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-light-500" />
            <Input
              value={query}
              disabled={loading || detecting}
              onChange={(event) => {
                setQuery(event.target.value);
                setResults([]);
                setSearched(false);
              }}
              placeholder="Search location"
              className="h-12 rounded-full border-dark-300 bg-dark-250 pl-11 text-light-900 placeholder:text-light-500"
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              className="rounded-full bg-primary-500 text-light-900"
              disabled={!query.trim() || loading || detecting}
              onClick={async () => {
                if (busy.current) return;
                const version = ++request.current;
                busy.current = true;
                try {
                  setLoading(true);
                  const nextResults = await searchLocations(query.trim());
                  if (version !== request.current) return;
                  setSearched(true);
                  setResults(
                    Array.isArray(nextResults)
                      ? nextResults.filter(
                          (item) =>
                            typeof item.display_name === "string" &&
                            Number.isFinite(Number(item.lat)) &&
                            Number.isFinite(Number(item.lon)),
                        )
                      : [],
                  );
                } catch {
                  if (version === request.current) {
                    toast.error("Failed to search location. Please try again.");
                    setResults([]);
                  }
                } finally {
                  if (version === request.current) {
                    busy.current = false;
                    setLoading(false);
                  }
                }
              }}
            >
              Search
            </Button>
            <Button
              type="button"
              className="rounded-full bg-dark-250 text-light-900 hover:bg-dark-300"
              onClick={close}
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
                  disabled={loading || detecting}
                  onClick={() => {
                    onApply({
                      address: result.display_name,
                      latitude: Number(result.lat),
                      longitude: Number(result.lon),
                    });
                    close();
                  }}
                  className="rounded-[20px] border border-dark-300 bg-dark-250 p-4 text-left transition hover:border-primary-500/40"
                >
                  <p className="text-sm text-light-900">
                    {result.display_name}
                  </p>
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

"use client";

import { useEffect, useId, useState } from "react";
import { getExploreFilterOptionsAction } from "@/actions/search.action";
import type { FilterOption, LookupKind } from "@/lib/utils/explore";

export default function LookupSelect({
  label,
  value,
  onChange,
  kind,
  parent = "",
  shared = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  kind: LookupKind;
  parent?: string;
  shared?: boolean;
  disabled?: boolean;
}) {
  const id = useId();
  const [options, setOptions] = useState<FilterOption[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  const needsParent =
    kind === "subcategories" || kind === "skills" || kind === "states";
  useEffect(() => {
    let cancelled = false;
    setOptions([]);
    setError("");
    if (needsParent && !parent) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getExploreFilterOptionsAction(kind, parent, shared)
      .then((result) => {
        if (cancelled) return;
        if (result.success) setOptions(result.data);
        else setError(result.message);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load options. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kind, parent, shared, retry, needsParent]);
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-light-700">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled || loading || !!error || (needsParent && !parent)}
        className="shad-form-input w-full"
        aria-busy={loading}
      >
        <option value="">
          {kind === "states" && !parent
            ? "Choose a country first"
            : loading
              ? kind === "states" ? "Loading towns..." : "Loading options..."
              : `Any ${label.toLowerCase()}`}
        </option>
        {value && !options.some((option) => option.value === value) && (
          <option value={value}>Current selection</option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {kind === "states" && parent && !loading && !error && !options.length && (
        <p role="status" className="text-xs text-light-600">
          No towns are available for this country.
        </p>
      )}
      {error && (
        <div role="alert" className="text-xs text-light-600">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setRetry((number) => number + 1)}
            className="mt-1 underline"
          >
            Retry {label.toLowerCase()}
          </button>
        </div>
      )}
    </div>
  );
}

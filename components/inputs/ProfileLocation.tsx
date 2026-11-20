"use client";

import { useState } from "react";
import { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { LocationPickerDialog } from "@/components/widgets/collaboration/CollaborationFieldPickers";

export default function ProfileLocation<T extends FieldValues>({ form }: { form: UseFormReturn<T> }) {
  const [open, setOpen] = useState(false);
  const location = form.watch("location" as Path<T>);
  const error = form.formState.errors.location || form.formState.errors.latitude || form.formState.errors.longitude;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="profile-location" className="text-sm text-light-900">Location</label>
      <button id="profile-location" type="button" onClick={() => setOpen(true)}
        aria-haspopup="dialog" aria-expanded={open} aria-describedby={error ? "profile-location-error" : undefined}
        className="min-h-11 rounded-xl border border-dark-300 bg-dark-200 p-3 text-left text-sm text-light-900">
        {location || "Search for your location"}
      </button>
      {error && <p id="profile-location-error" role="alert" className="text-sm text-red-500">Please select a valid location.</p>}
      <LocationPickerDialog open={open} title="Your location" initialAddress={location || ""}
        onClose={() => setOpen(false)} onApply={({ address, latitude, longitude }) => {
          // These fields belong to both profile forms; update together before validation.
          const fields = { location: address, latitude, longitude };
          for (const [key, value] of Object.entries(fields)) {
            form.setValue(key as Path<T>, value as any, { shouldDirty: true });
          }
          form.trigger(["location", "latitude", "longitude"] as Path<T>[]);
          setOpen(false);
        }} />
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { getEthnicAction } from "@/actions/utils.action";
import { FormField, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

export default function ProfileEthnicityInput({ form, userData }: any) {
  const [options, setOptions] = useState<{ _id: string; name: string }[]>([]);
  const [status, setStatus] = useState("loading");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setStatus("loading");
    getEthnicAction()
      .then((result) => {
        if (!active) return;
        if (
          result?.status !== "7400" ||
          !Array.isArray(result.response) ||
          result.response.some(
            (row: any) =>
              typeof row?._id !== "string" || typeof row?.ethnic !== "string",
          )
        ) {
          setStatus("error");
          return;
        }
        const rows = result.response
          .map((row: any) => ({ _id: row._id, name: row.ethnic }))
          .sort((a: any, b: any) => a.name.localeCompare(b.name));
        setOptions(rows);
        setStatus("ready");
        // Older profiles may contain a label without its corresponding ID.
        if (
          !form.getValues("ethnic") &&
          !form.getFieldState("ethnic").isDirty
        ) {
          const match = rows.find(
            (row: any) => row.name === userData?.morePersonalInfo?.ethnic,
          );
          if (match) form.setValue("ethnic", match._id);
        }
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [form, userData?.morePersonalInfo?.ethnic, attempt]);
  return (
    <FormField
      control={form.control}
      name="ethnic"
      render={({ field }) => (
        <div className="flex w-full flex-col gap-2">
          <label className="shad-auth_form_label" htmlFor="profile-ethnicity">
            Ethnicity (optional)
          </label>
          <select
            id="profile-ethnicity"
            name={field.name}
            ref={field.ref}
            onBlur={field.onBlur}
            className="shad-auth_form_input w-full"
            value={field.value || ""}
            disabled={status !== "ready"}
            onChange={field.onChange}
          >
            <option value="">Prefer not to say</option>
            {field.value && !options.some((row) => row._id === field.value) ? (
              <option value={field.value}>
                {userData?.morePersonalInfo?.ethnic || "Current ethnicity"}
              </option>
            ) : null}
            {options.map((row) => (
              <option key={row._id} value={row._id}>
                {row.name}
              </option>
            ))}
          </select>
          {status === "loading" ? (
            <p role="status" className="text-xs text-light-500">
              Loading ethnicities...
            </p>
          ) : null}
          {status === "error" ? (
            <div
              role="alert"
              className="text-sm text-red-700 dark:text-red-300"
            >
              Unable to load ethnicities. Your saved selection will be retained.
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAttempt((value) => value + 1)}
              >
                Try again
              </Button>
            </div>
          ) : null}
          <FormMessage className="shad-auth_form_message" />
        </div>
      )}
    />
  );
}

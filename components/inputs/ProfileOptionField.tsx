"use client";

import Dropdown from "./Dropdown";
import { Button } from "@/components/ui/button";
import { useProfileOptions } from "@/lib/hooks/useProfileOptions";
import {
  retainProfileOption,
  type ProfileOptionKind,
  type ProfileOptionsState,
} from "@/lib/utils/profile-options";

export function ProfileOptionsStatus({
  status,
  kind,
  retry,
}: {
  status: ProfileOptionsState["status"];
  kind: ProfileOptionKind;
  retry: () => void;
}) {
  const label = kind === "language" ? "languages" : "professions";
  if (status === "ready") return null;
  if (status === "loading")
    return (
      <p role="status" className="text-sm text-light-500">
        Loading {label}...
      </p>
    );
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-2 text-sm text-light-700"
    >
      <span>
        {status === "empty"
          ? `No ${label} are available right now.`
          : `Unable to load ${label}.`}{" "}
        Your entries have been kept.
      </span>
      <Button type="button" variant="outline" onClick={retry}>
        Retry {label}
      </Button>
    </div>
  );
}

export default function ProfileOptionField({
  form,
  kind,
  initialResult,
  selectedLabel,
  savedId,
}: {
  form: any;
  kind: ProfileOptionKind;
  initialResult: unknown;
  selectedLabel?: string;
  savedId?: string;
}) {
  const lookup = useProfileOptions(kind, initialResult);
  const language = kind === "language";
  const name = language ? "knownLanguage" : "profession";
  const selected = form.watch(name);
  const options = retainProfileOption(
    lookup.options,
    selected,
    (selected === savedId && selectedLabel) ||
      (language ? "Current native language" : "Current profession"),
  );
  return (
    <div
      className="flex w-full flex-col gap-2"
      aria-busy={lookup.status === "loading"}
    >
      <Dropdown
        form={form}
        value={selected}
        inputName={name}
        formLabel={language ? "Native Language" : "Profession"}
        placeholder={
          language ? "Select your native language" : "Select your profession"
        }
        formDescription={
          language
            ? "Let us know the language you speak so we can connect you with people who share your interests and culture."
            : "This information helps us understand your professional background and can be used to provide you with relevant content and services."
        }
        options={options}
        disabled={lookup.status !== "ready"}
      />
      <ProfileOptionsStatus
        kind={kind}
        status={lookup.status}
        retry={lookup.retry}
      />
    </div>
  );
}

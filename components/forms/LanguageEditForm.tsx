import React from "react";
import { Button } from "../ui/button";
import { Dropdown } from "../inputs";
import { LEVEL_VALUES } from "@/constants";
import { ProfileOptionsStatus } from "../inputs/ProfileOptionField";
import {
  retainProfileOption,
  type ProfileOptionsState,
} from "@/lib/utils/profile-options";
import type { ILanguage } from "@/types/profile.types";

type Props = {
  isEdit: boolean;
  form: any;
  onSubmit: (values: any) => void;
  lookup: ProfileOptionsState & { retry: () => void };
  savedLanguage?: ILanguage;
  pending: boolean;
  error: string;
};

export default function LanguageEditForm({
  isEdit,
  form,
  lookup,
  savedLanguage,
  pending,
  error,
  onSubmit,
}: Props) {
  const selected = form.watch("languageId");
  const original = isEdit && selected === savedLanguage?.languageId;
  const options = retainProfileOption(
    lookup.options,
    selected,
    (original && savedLanguage?.languageName) || "Current language",
  );
  return (
    <form
      className="flex flex-col gap-4"
      aria-busy={pending}
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <fieldset disabled={pending} className="flex min-w-0 flex-col gap-4">
        <Dropdown
          form={form}
          value={selected}
          inputName="languageId"
          formLabel="Known Language"
          placeholder="Select your known language"
          options={options}
          disabled={lookup.status !== "ready"}
          isModal={true}
        />
        <ProfileOptionsStatus
          kind="language"
          status={lookup.status}
          retry={lookup.retry}
        />
        <Dropdown
          form={form}
          value={form.watch("languageLevel")}
          inputName="languageLevel"
          formLabel="Language Level"
          placeholder="Select language level"
          options={LEVEL_VALUES}
          isModal={true}
        />
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
      <Button
        type="submit"
        disabled={
          pending ||
          form.formState.isSubmitting ||
          (lookup.status !== "ready" && !original)
        }
        className="shad-button_primary mt-6"
      >
        {pending || form.formState.isSubmitting
          ? isEdit
            ? "Updating..."
            : "Adding..."
          : isEdit
            ? "Update"
            : "Add"}
      </Button>
    </form>
  );
}

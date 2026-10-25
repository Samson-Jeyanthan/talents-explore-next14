"use client";

import useDateSelector from "@/lib/hooks/useDateSelector";
import { CertificateInput, Dropdown, FormInput } from "../inputs";
import { Button } from "../ui/button";
import { FormField } from "../ui/form";

const AwardEditForm = ({ isEdit, form, onSubmit }: any) => {
  const { years } = useDateSelector({});

  const YEARS = years.map((item) => ({
    _id: item.id,
    name: item.label,
  }));

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-5"
    >
      <FormField
        control={form.control}
        name="certificate"
        render={({ field }) => (
          <CertificateInput
            fieldChange={field.onChange}
            values={form.getValues("certificate")}
          />
        )}
      />
      <FormInput
        form={form}
        inputName="course"
        placeholder="Name"
        inputType="text"
        formLabel="Award / Certificate Name"
      />
      <FormInput
        form={form}
        inputName="givenBy"
        placeholder="Given By"
        inputType="text"
        formLabel="Given By"
      />
      <Dropdown
        form={form}
        value={form.getValues("from")}
        inputName="from"
        placeholder="Year"
        formLabel="From"
        options={YEARS}
        isModal={true}
      />
      <Button
        disabled={form.formState.isSubmitting}
        className="shad-button_primary mt-4"
      >
        {form.formState.isSubmitting
          ? isEdit === "languageEdit"
            ? "Updating..."
            : "Adding..."
          : isEdit === "languageEdit"
            ? "Update"
            : "Add"}
      </Button>
    </form>
  );
};

export default AwardEditForm;

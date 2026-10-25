import React from "react";
import { Button } from "../ui/button";
import { Dropdown } from "../inputs";
import { LEVEL_VALUES } from "@/constants";

const LanguageEditForm = ({ isEdit, form, options, onSubmit }: any) => {
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <Dropdown
        form={form}
        value={form.getValues("languageId")}
        inputName="languageName"
        formLabel="Known Language"
        placeholder="Select your known language"
        options={options.length > 0 ? options : []}
        isModal={true}
      />
      <Dropdown
        form={form}
        value={form.getValues("languageLevel")}
        inputName="languageLevel"
        formLabel="Language Level"
        placeholder="Select language level"
        options={LEVEL_VALUES}
        isModal={true}
      />
      <Button
        disabled={form.formState.isSubmitting}
        className="shad-button_primary mt-6"
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

export default LanguageEditForm;

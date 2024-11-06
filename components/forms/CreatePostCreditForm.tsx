"use client";

import { LEVEL_VALUES } from "@/constants";
import { Dropdown, FormInput } from "../inputs";
import { Form } from "../ui/form";
import { UploadFormTooltip } from "../tooltips";

const CreatePostCreditForm = ({ form }: any) => {
  return (
    <Form {...form}>
      <form
        className="flex w-full flex-col gap-6"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="flex flex-col gap-2 border-y border-dark-400 py-4">
          <p className="text-sm text-light-800">
            We value your contribution. Use the checkboxes to specify your role
            &apos;Credit Work&apos; if you took part, or &apos;Full
            Ownership&apos; if it&apos;s your sole creation.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <UploadFormTooltip
            title="Credit Info"
            description="List individuals or contributors who participated in this work or post. include their titles and tag their names if applicable. Propper credit recognition is fosters a sense of community and collaboration"
          />
          <FormInput
            form={form}
            inputName="title"
            inputType="text"
            placeholder="Add Title"
          />
          <FormInput
            form={form}
            inputName="title"
            inputType="text"
            placeholder="Add Title"
          />
        </div>

        <div className="flex flex-col gap-4">
          <UploadFormTooltip
            title="Production Info"
            description="List individuals or contributors who participated in this work or post. include their titles and tag their names if applicable. Propper credit recognition is fosters a sense of community and collaboration"
          />
          <FormInput
            form={form}
            inputName="title"
            inputType="text"
            placeholder="Add Title"
          />
          <FormInput
            form={form}
            inputName="title"
            inputType="text"
            placeholder="Add Title"
          />
        </div>

        <div className="flex flex-col gap-2">
          <UploadFormTooltip
            title="Tools Info"
            description="List individuals or contributors who participated in this work or post. include their titles and tag their names if applicable. Propper credit recognition is fosters a sense of community and collaboration"
            className="mb-0"
          />
          <FormInput
            form={form}
            inputName="title"
            inputType="text"
            placeholder="Add Title"
          />
          <Dropdown
            form={form}
            value={form.getValues("mainCategory")}
            inputName="mainCategory"
            placeholder="Level"
            options={LEVEL_VALUES}
          />
        </div>
      </form>
    </Form>
  );
};

export default CreatePostCreditForm;

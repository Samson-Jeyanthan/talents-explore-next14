"use client";

import { CREDIT_WORK_OPTIONS, LEVEL_VALUES } from "@/constants";
import {
  CheckboxInput,
  Dropdown,
  FormInput,
  UserTagAndSearch,
} from "../inputs";
import { UploadFormTooltip } from "../tooltips";

const CreatePostCreditForm = ({ form }: any) => {
  return (
    <form
      className="flex w-full flex-col gap-6"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="flex flex-col gap-2 border-y border-dark-400 py-4 text-light-800">
        <p className="mb-1 text-sm">
          We value your contribution. Use the checkboxes to specify your role
          &apos;Credit Work&apos; if you took part, or &apos;Full
          Ownership&apos; if it&apos;s your sole creation.
        </p>
        <CheckboxInput
          form={form}
          inputName="credit"
          data={CREDIT_WORK_OPTIONS}
        />
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
          placeholder="Credit title ex - Singer"
        />
        <UserTagAndSearch isTag={true} isCreditTag={true} />
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
          placeholder="Production Name"
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
          placeholder="Name of the tool used"
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
  );
};

export default CreatePostCreditForm;

"use client";

import { FormControl, FormField, FormItem } from "../ui/form";
import {
  Dropdown,
  FormInput,
  StarRating,
  TextArea,
  UserTagAndSearch,
} from "../inputs";
import { ToolTip } from "../others";
import { LEVEL_VALUES } from "@/constants";

const CreatePostAboutForm = ({
  form,
  langData,
  mainCategoryOptions,
  countryOptions,
  fetchStates,
  stateOptions,
  fetchSubcategories,
  subCategoryOptions,
  fetchSkills,
  skillOptions,
}: any) => {
  return (
    <form className="flex w-full flex-col gap-6">
      <div className="flex w-full flex-col gap-2">
        <FormInput
          form={form}
          inputName="title"
          inputType="text"
          placeholder="Add Title"
        />

        <TextArea
          form={form}
          inputName="description"
          placeholder="Add description to your post"
          maxLength={800}
          className="h-80"
        />

        <div className="flex-between gap-2">
          <p className="text-sm text-light-500">
            Your rating to your work / post
          </p>
          <FormField
            control={form.control}
            name="ownRating"
            render={({ field }) => (
              <FormItem className="!m-0 flex items-center justify-start gap-2 !p-0">
                <FormControl>
                  <StarRating
                    prevRatingValue={form.getValues("ownRating")}
                    ratingFor="UPLOAD"
                    authorId=""
                    revalidatePath=""
                    onChange={(val) => field.onChange(val)}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className="flex w-full flex-col gap-2">
        <ToolTip
          title="Skills Info"
          description="Tell us what skills are showcased in this post. This helps people discover your work based on your expertise."
        />

        <Dropdown
          form={form}
          inputName="mainCategory"
          placeholder="Select Main Category"
          options={mainCategoryOptions}
          value={form.getValues("mainCategory")}
          onValueChange={(_id: string) => fetchSubcategories(_id)}
        />

        <Dropdown
          form={form}
          inputName="subCategory"
          placeholder="Select Sub Category"
          options={subCategoryOptions}
          value={form.getValues("subCategory")}
          onValueChange={(_id: string) => fetchSkills(_id)}
          dependentFieldPlaceholder="Please select main category"
          dependentFieldValue={form.getValues("mainCategory") !== ""}
        />

        {skillOptions.length > 0 ? (
          <div className="flex w-full gap-4">
            <Dropdown
              form={form}
              inputName="skill"
              placeholder="Select Skill Name"
              options={skillOptions}
              value={form.getValues("skill")}
              dependentFieldPlaceholder={"Please select sub category"}
              dependentFieldValue={form.getValues("subCategory") !== ""}
            />
            <Dropdown
              form={form}
              value={form.getValues("skillLevel")}
              inputName="skillLevel"
              placeholder="Level"
              options={LEVEL_VALUES}
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <ToolTip
          title="Language Info"
          description="Tell us which languages are used in this post. This helps people understand and discover your content by language."
        />
        <Dropdown
          form={form}
          value={form.getValues("primaryLanguage")}
          inputName="primaryLanguage"
          placeholder="Select Primary Language"
          options={langData}
        />
        <Dropdown
          form={form}
          value={form.getValues("secondaryLanguage")}
          inputName="secondaryLanguage"
          placeholder="Select Secondary Language"
          options={langData}
        />
      </div>

      <div className="flex flex-col gap-2">
        <ToolTip
          title="Location Info"
          description="List individuals or contributors who participated in this work or post. include their titles and tag their names if applicable. Propper credit recognition is fosters a sense of community and collaboration"
        />
        <Dropdown
          form={form}
          value={form.getValues("country")}
          inputName="country"
          placeholder="Country"
          options={countryOptions}
          onValueChange={(country: string) => fetchStates(country)}
        />
        <Dropdown
          form={form}
          value={form.getValues("state")}
          inputName="state"
          placeholder="State"
          options={stateOptions}
          dependentFieldPlaceholder="Please select country"
          dependentFieldValue={form.getValues("country") !== ""}
        />
      </div>

      <div className="flex flex-col gap-2">
        <p className="flex w-36 items-center gap-2 text-left text-sm text-light-800">
          Tags
        </p>
        <FormField
          control={form.control}
          name="peopleTag"
          render={({ field }) => (
            <UserTagAndSearch
              isTag={true}
              fieldChange={field.onChange}
              values={form.getValues("peopleTag")}
            />
          )}
        />
        <FormInput
          form={form}
          inputName="keywords"
          inputType="text"
          placeholder="Add hashtags ex- #art #design #coding"
        />
      </div>
    </form>
  );
};

export default CreatePostAboutForm;

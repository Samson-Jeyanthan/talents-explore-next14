"use client";

import { FormControl, FormField, FormItem } from "../ui/form";
import {
  Dropdown,
  FormInput,
  StarRating,
  TextArea,
  UserTagAndSearch,
} from "../inputs";
import { UploadFormTooltip } from "../tooltips";
import { LEVEL_VALUES } from "@/constants";
import {
  getSkillsAction,
  getSubCategoriesAction,
} from "@/actions/utils.action";
import { useState } from "react";

const CreatePostAboutForm = ({
  form,
  langData,
  mainCategoryOptions,
  countryOptions,
}: any) => {
  const [subCategoryOptions, setSubCategoryOptions] = useState([]);
  const [skillOptions, setSkillOptions] = useState([]);

  async function fetchSubcategories(mainCategory: string) {
    await form.resetField("subCategory", "skills");
    setSubCategoryOptions([]);
    setSkillOptions([]);
    try {
      const res = await getSubCategoriesAction(mainCategory);
      setSubCategoryOptions(
        res.response.map((item: any) => ({
          _id: item._id,
          name: item.name,
        }))
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async function fetchSkills(subCategory: string) {
    await form.resetField("skills");
    setSkillOptions([]);
    try {
      const res = await getSkillsAction(subCategory);
      console.log(res);
      setSkillOptions(
        res.response.map((item: any) => ({
          _id: item._id,
          name: item.name,
        }))
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

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
            name="rating"
            render={({ field }) => (
              <FormItem className="!m-0 flex items-center justify-start gap-2 !p-0">
                <FormControl>
                  <StarRating
                    prevRatingValue={form.getValues("rating")}
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
        <UploadFormTooltip
          title="Skills Info"
          description="List individuals or contributors who participated in this work or post. include their titles and tag their names if applicable. Propper credit recognition is fosters a sense of community and collaboration"
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

        <div className="flex w-full gap-4">
          <Dropdown
            form={form}
            inputName="skills"
            placeholder="Select Skill Name"
            options={skillOptions}
            value={form.getValues("skills")}
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
      </div>

      <div className="flex flex-col gap-2">
        <UploadFormTooltip
          title="Language Info"
          description="List individuals or contributors who participated in this work or post. include their titles and tag their names if applicable. Propper credit recognition is fosters a sense of community and collaboration"
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
        <UploadFormTooltip
          title="Location Info"
          description="List individuals or contributors who participated in this work or post. include their titles and tag their names if applicable. Propper credit recognition is fosters a sense of community and collaboration"
        />
        <Dropdown
          form={form}
          value={form.getValues("country")}
          inputName="country"
          placeholder="Country"
          options={countryOptions}
        />
        <Dropdown
          form={form}
          value={form.getValues("state")}
          inputName="state"
          placeholder="State"
          options={langData}
        />
      </div>

      <div className="flex flex-col gap-2">
        <p className="flex w-36 items-center gap-2 text-left text-sm text-light-800">
          Tags
        </p>
        <UserTagAndSearch isTag={true} />
        <Dropdown
          form={form}
          value={form.getValues("mainCategory")}
          inputName="mainCategory"
          placeholder="Select your profession"
          options={langData}
        />
      </div>
    </form>
  );
};

export default CreatePostAboutForm;

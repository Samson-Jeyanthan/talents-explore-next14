"use client";

import { Form, FormControl, FormField, FormItem } from "../ui/form";
import { Dropdown, FormInput, StarRating, TextArea } from "../inputs";
import { UploadFormTooltip } from "../tooltips";

const CreatePostAboutForm = ({ form, langData, mainCategoryOptions }: any) => {
  return (
    <Form {...form}>
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
            placeholder="What's on your mind...?"
            maxLength={120}
          />

          <div className="flex-between gap-2">
            <p className="text-sm text-light-500">Rating to your post</p>
            <FormField
              control={form.control}
              name="publicRating"
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
            value={form.getValues("mainCategory")}
            inputName="mainCategory"
            placeholder="Select your profession"
            options={langData}
          />
          <Dropdown
            form={form}
            value={form.getValues("mainCategory")}
            inputName="mainCategory"
            placeholder="Select your profession"
            options={langData}
          />
          <div className="flex w-full gap-4">
            <Dropdown
              form={form}
              value={form.getValues("mainCategory")}
              inputName="mainCategory"
              placeholder="Select your profession"
              options={mainCategoryOptions}
            />
            <Dropdown
              form={form}
              value={form.getValues("mainCategory")}
              inputName="mainCategory"
              placeholder="Select your profession"
              options={langData}
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
            value={form.getValues("mainCategory")}
            inputName="mainCategory"
            placeholder="Select your profession"
            options={langData}
          />
          <Dropdown
            form={form}
            value={form.getValues("mainCategory")}
            inputName="mainCategory"
            placeholder="Select your profession"
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
            value={form.getValues("mainCategory")}
            inputName="mainCategory"
            placeholder="Select your profession"
            options={langData}
          />
          <Dropdown
            form={form}
            value={form.getValues("mainCategory")}
            inputName="mainCategory"
            placeholder="Select your profession"
            options={langData}
          />
        </div>

        <div className="flex flex-col gap-2">
          <UploadFormTooltip
            title="Tags Info"
            description="List individuals or contributors who participated in this work or post. include their titles and tag their names if applicable. Propper credit recognition is fosters a sense of community and collaboration"
          />
          <Dropdown
            form={form}
            value={form.getValues("mainCategory")}
            inputName="mainCategory"
            placeholder="Select your profession"
            options={langData}
          />
          <Dropdown
            form={form}
            value={form.getValues("mainCategory")}
            inputName="mainCategory"
            placeholder="Select your profession"
            options={langData}
          />
        </div>
      </form>
    </Form>
  );
};

export default CreatePostAboutForm;

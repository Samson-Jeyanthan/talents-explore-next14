"use client";

import { postFilterValidation } from "@/lib/validations/filter.validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { Button } from "../ui/button";
import { Dropdown, FormInput, StarRating } from "../inputs";
import { Checkbox } from "../ui/checkbox";
import { TIME_DURATION_FILTERS } from "@/constants";
import qs from "query-string";

type Props = {
  langData: any;
  professionData: any;
  onClose: () => void;
};

function PostFilterForm({ langData, professionData, onClose }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const LangOptions = langData.response.map((item: any) => ({
    _id: item._id,
    name: item.language,
  }));

  // const professionOptions = professionData.response.map((item: any) => ({
  //   _id: item._id,
  //   name: item.professional,
  // }));

  const form = useForm<z.infer<typeof postFilterValidation>>({
    resolver: zodResolver(postFilterValidation),
    defaultValues: {
      mainCategory: "",
      subCategory: "",
      skill: "",
      level: "",
      publicRating: 0,
      postDescription: "",
      primaryLanguage: "",
      secondaryLanguage: "",
      timeDuration: "",
      country: "",
      state: "",
      creditTitle: "",
    },
  });

  async function onSubmit(values: z.infer<typeof postFilterValidation>) {
    // Define the keys that need to be part of the URL query string
    const queryParams: { [key: string]: string | undefined } = {
      mainCategory: values.mainCategory,
      subCategory: values.subCategory,
      skill: values.skill,
      level: values.level,
      publicRating: values.publicRating
        ? String(values.publicRating)
        : undefined,
      primaryLanguage: values.primaryLanguage,
      secondaryLanguage: values.secondaryLanguage,
      timeDuration: values.timeDuration,
      country: values.country,
      state: values.state,
      creditTitle: values.creditTitle,
    };

    // results?search_query=vietnamese+war
    // Filter out empty or undefined values
    const nonEmptyQueryParams = Object.fromEntries(
      Object.entries(queryParams).filter(
        ([, value]) => value !== undefined && value !== ""
      )
    );

    const newURL = qs.stringifyUrl(
      {
        url: window.location.pathname, // Keep the current URL path
        query: {
          ...qs.parse(searchParams.toString()), // Keep existing search params
          ...nonEmptyQueryParams, // Add or update new query params
        },
      },
      { skipNull: true, skipEmptyString: true } // Skip empty/null values
    );

    router.push(newURL, { scroll: false });

    onClose && onClose();
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mt-4 flex w-full flex-col gap-8"
      >
        <div className="explore-filter-h3-wrap">
          <h3 className="explore-filter-h3">Categories</h3>
          <Dropdown
            form={form}
            value={form.getValues("primaryLanguage")}
            inputName="primaryLanguage"
            placeholder="Select primary language"
            options={LangOptions}
          />
          <Dropdown
            form={form}
            value={form.getValues("secondaryLanguage")}
            inputName="secondaryLanguage"
            placeholder="Select primary language"
            options={LangOptions}
          />
        </div>

        <div className="explore-filter-h3-wrap">
          <h3 className="explore-filter-h3">Ratings</h3>
          <FormField
            control={form.control}
            name="publicRating"
            render={({ field }) => (
              <FormItem className="!m-0 flex items-center justify-start gap-2 !p-0">
                <FormControl>
                  <StarRating
                    prevRatingValue={form.getValues("publicRating")}
                    ratingFor="FILTER"
                    authorId=""
                    revalidatePath=""
                    onChange={(val) => field.onChange(val)}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="explore-filter-h3-wrap">
          <h3 className="explore-filter-h3">Sort By</h3>
          <FormField
            control={form.control}
            name="timeDuration"
            render={() => (
              <FormItem className="flex flex-col gap-1.5">
                {TIME_DURATION_FILTERS?.map((item, index) => (
                  <FormField
                    key={index}
                    control={form.control}
                    name="timeDuration"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={index}
                          className="!m-0 flex items-center justify-start gap-2 !p-0"
                        >
                          <FormControl>
                            <Checkbox
                              className="size-7 rounded-full border-none !bg-dark-300 !text-xs text-light-900"
                              checked={field.value === item.id}
                              onCheckedChange={(checked) => {
                                field.onChange(checked ? item.id : "");
                              }}
                            />
                          </FormControl>
                          <FormLabel className="pb-1 !text-sm !font-normal text-light-500">
                            {item.name}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </FormItem>
            )}
          />
        </div>

        <div className="explore-filter-h3-wrap">
          <h3 className="explore-filter-h3">Languages</h3>
          <Dropdown
            form={form}
            value={form.getValues("primaryLanguage")}
            inputName="primaryLanguage"
            placeholder="Select primary language"
            options={LangOptions}
          />
          <Dropdown
            form={form}
            value={form.getValues("secondaryLanguage")}
            inputName="secondaryLanguage"
            placeholder="Select primary language"
            options={LangOptions}
          />
        </div>

        <div className="explore-filter-h3-wrap">
          <h3 className="explore-filter-h3">Location</h3>
          <Dropdown
            form={form}
            value={form.getValues("primaryLanguage")}
            inputName="primaryLanguage"
            placeholder="Select primary language"
            options={LangOptions}
          />
          <Dropdown
            form={form}
            value={form.getValues("secondaryLanguage")}
            inputName="secondaryLanguage"
            placeholder="Select primary language"
            options={LangOptions}
          />
        </div>

        <div className="explore-filter-h3-wrap">
          <h3 className="explore-filter-h3">Credits</h3>
          <FormInput
            form={form}
            inputName="creditTitle"
            inputType="text"
            placeholder="Credit Title"
          />
        </div>

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="shad-button_primary mt-4 w-full"
        >
          {form.formState.isSubmitting
            ? "Filtering Results..."
            : "Apply Filter"}
        </Button>
      </form>
    </Form>
  );
}

export default PostFilterForm;

"use client";

import { talentFilterValidation } from "@/lib/validations/filter.validation";
import { zodResolver } from "@hookform/resolvers/zod";
// import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem } from "../ui/form";
import { Button } from "../ui/button";
import { CheckboxInput, Dropdown, FormInput, StarRating } from "../inputs";
import { GENDER_VALUES } from "@/constants";
import { exploreAllTalentsAction } from "@/actions/search.action";
import { useUserContext } from "@/context/AuthProvider";
import { usePathname } from "next/navigation";

type Props = {
  langData: any;
  professionData: any;
  onClose: () => void;
};

function TalentFilterForm({ langData, professionData, onClose }: Props) {
  const { user } = useUserContext();
  const pathname = usePathname();
  // const router = useRouter();
  const LangOptions = langData.response.map((item: any) => ({
    _id: item._id,
    name: item.language,
  }));

  // const professionOptions = professionData.response.map((item: any) => ({
  //   _id: item._id,
  //   name: item.professional,
  // }));

  const form = useForm<z.infer<typeof talentFilterValidation>>({
    resolver: zodResolver(talentFilterValidation),
    defaultValues: {
      profileRating: 0,
      gender: "",
      userLanguage: "",
      userEthnicity: "",
    },
  });

  // results?search_query=vietnamese+war

  async function onSubmit(values: z.infer<typeof talentFilterValidation>) {
    await exploreAllTalentsAction({
      userId: user.currentUserId,
      viewUserId: user.currentUserId,
      pageNo: 1,
      pageSize: 10,
      searchText: "",
      userRating: values.profileRating,
      userGender: values.gender,
      userLanguage: values.userLanguage,
      ethnic: values.userEthnicity,
      pathForRevalidate: pathname,
    });
    onClose && onClose();
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mt-4 flex w-full flex-col gap-8"
      >
        <div className="explore-filter-h3-wrap">
          <h3 className="explore-filter-h3">Credits</h3>
          <FormInput
            form={form}
            inputName="creditTitle"
            inputType="text"
            placeholder="Credit Title"
          />
        </div>

        <div className="explore-filter-h3-wrap">
          <h3 className="explore-filter-h3">Gender</h3>
          <CheckboxInput form={form} inputName="gender" data={GENDER_VALUES} />
        </div>

        <div className="explore-filter-h3-wrap">
          <h3 className="explore-filter-h3">Ratings</h3>
          <FormField
            control={form.control}
            name="profileRating"
            render={({ field }) => (
              <FormItem className="!m-0 flex items-center justify-start gap-2 !p-0">
                <FormControl>
                  <StarRating
                    prevRatingValue={form.getValues("profileRating")}
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
          <h3 className="explore-filter-h3">Ethnic</h3>
          <Dropdown
            form={form}
            value={form.getValues("userEthnicity")}
            inputName="userEthnicity"
            placeholder="Select ethnic"
            options={LangOptions}
          />
        </div>

        <div className="explore-filter-h3-wrap">
          <h3 className="explore-filter-h3">Language</h3>
          <Dropdown
            form={form}
            value={form.getValues("userLanguage")}
            inputName="primaryLanguage"
            placeholder="Select primary language"
            options={LangOptions}
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

export default TalentFilterForm;

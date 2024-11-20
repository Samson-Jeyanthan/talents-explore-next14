"use client";

import { useEffect, useState } from "react";
import { PostAboutValidation } from "@/lib/validations/post.validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CreatePostAboutForm, CreatePostCreditForm } from "@/components/forms";
import { TransparentLoader } from "@/components/modals";
import { Button } from "@/components/ui/button";
import Footer from "../Footer";
import { Form } from "@/components/ui/form";

interface Props {
  langData: any;
  mainCategoryData: any;
  subCategoryData?: any;
  skillData?: any;
  countryData: any;
}

const ParentCreatePostForm = ({
  langData,
  mainCategoryData,
  countryData,
}: Props) => {
  const LangOptions = langData.response.map((item: any) => ({
    _id: item._id,
    name: item.language,
  }));

  const mainCategoryOptions = mainCategoryData.response.map((item: any) => ({
    _id: item._id,
    name: item.name,
  }));

  const countryOptions = countryData.response.map((item: any) => ({
    _id: item._id,
    name: item.country,
  }));

  const [page, setPage] = useState(0);

  const form = useForm<z.infer<typeof PostAboutValidation>>({
    resolver: zodResolver(PostAboutValidation),
    defaultValues: {
      title: "",
      description: "",
      rating: 0,
      mainCategory: "",
      subCategory: "",
      skills: "",
      skillLevel: "",
      primaryLanguage: "",
      secondaryLanguage: "",
      country: "",
      state: "",
      tagPeople: [""],
      hashtag: "",
    },
  });

  useEffect(() => {
    console.log(form.getValues("mainCategory"));
  }, [mainCategoryOptions, form]);

  async function onSubmit(values: z.infer<typeof PostAboutValidation>) {
    console.log(values);
  }

  const handleNext = () => {
    setPage((currentPage) => currentPage + 1);
  };

  const handlePrevious = () => {
    setPage((currentPage) => currentPage - 1);
  };

  const postForm = [
    {
      form: (
        <CreatePostAboutForm
          form={form}
          langData={LangOptions}
          mainCategoryOptions={mainCategoryOptions}
          countryOptions={countryOptions}
        />
      ),
    },
    {
      form: <CreatePostCreditForm form={form} />,
    },
  ];

  return (
    <>
      {form.formState.isSubmitting && (
        <TransparentLoader text="Uploading Post" />
      )}
      <section className="flex w-full items-start justify-center gap-16">
        <div className="sticky top-[5.5rem] h-[32rem] w-[28rem] border">
          Media
        </div>
        <div className="flex w-full max-w-2xl flex-col gap-6">
          <header className="flex-between text-light-850">
            <h1 className="text-3xl font-semibold">Create Post</h1>
            <div className="flex items-center gap-2 rounded-md bg-dark-300 px-3 py-1.5">
              Step
              <span className="text-sm text-light-500">
                0{page + 1}/0{postForm.length}
              </span>
            </div>
          </header>
          <Form {...form}>{postForm[page].form}</Form>
          <footer className="mt-5 flex w-full flex-col gap-5">
            {postForm.length - 1 === page ? (
              <Button
                onClick={form.handleSubmit(onSubmit)}
                className="shad-button_primary"
              >
                Upload
              </Button>
            ) : (
              <Button onClick={handleNext} className="shad-button_primary">
                Next
              </Button>
            )}

            {page > 0 && (
              <Button
                onClick={handlePrevious}
                className="shad-button_secondary"
              >
                Back
              </Button>
            )}
          </footer>
        </div>
      </section>

      <div className="pt-12">
        <Footer />
      </div>
    </>
  );
};

export default ParentCreatePostForm;

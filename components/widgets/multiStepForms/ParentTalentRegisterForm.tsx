"use client";

import { TransparentLoader } from "@/components/modals";
import { TalentRegisterValidation } from "@/lib/validations/auth.validation";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { Form, useForm } from "react-hook-form";
import { z } from "zod";
import Footer from "../Footer";
import { TalentRegisterStatusBar } from "../navigation";
import { TALENT_REG_FORM_DETAILS } from "@/constants";
import {
  AwardsForm,
  CompleteForm,
  LangEducationForm,
  MoreDetailsForm,
  SkillsForm,
} from "@/components/forms";
import { Button } from "@/components/ui/button";

interface Props {
  langData: any;
  mainCategoryData: any;
}

const ParentTalentRegisterForm = ({ langData, mainCategoryData }: Props) => {
  const LangOptions = (langData?.response || []).map((item: any) => ({
    _id: item._id,
    name: item.language,
  }));

  const mainCategoryOptions = (mainCategoryData?.response || []).map(
    (item: any) => ({
      _id: item._id,
      name: item.name,
    })
  );
  const [page, setPage] = useState(4);

  const form = useForm({
    resolver: zodResolver(TalentRegisterValidation),
    defaultValues: {
      bio: "",
      ethnic: "",
      featuredPhotos: [],
      socialLinks: [],
      skillSets: [],
      languageKnown: [],
      education: [],
      awardsOrCertificate: [],
    },
  });

  const RegisterForm = [
    { form: <MoreDetailsForm form={form} /> },
    {
      form: (
        <SkillsForm form={form} mainCategoryOptions={mainCategoryOptions} />
      ),
    },
    { form: <LangEducationForm form={form} LangOptions={LangOptions} /> },
    { form: <AwardsForm form={form} /> },
    { form: <CompleteForm form={form} /> },
  ];

  const handleNext = () => {
    setPage((currentPage) => currentPage + 1);
  };

  const handlePrevious = () => {
    setPage((currentPage) => currentPage - 1);
  };

  async function onSubmit(values: z.infer<typeof TalentRegisterValidation>) {}

  return (
    <>
      {form.formState.isSubmitting && (
        <TransparentLoader text="Uploading Post" />
      )}
      <Form {...form}>
        <section className="flex w-full max-w-screen-lg flex-col">
          <header className="border-b border-solid border-dark-300 py-4">
            {TALENT_REG_FORM_DETAILS.filter((_, index) => index === page).map(
              (item, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <h1 className="text-3xl font-semibold text-light-900">
                    {item.title}
                  </h1>
                  <p className="text-sm text-light-500">{item.description}</p>
                </div>
              )
            )}
          </header>

          <div className="flex gap-4">
            <TalentRegisterStatusBar />
            <div className="flex min-h-[85vh] w-full flex-col">
              {RegisterForm[page].form}
              <footer className="">
                {RegisterForm.length - 1 === page ? (
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    onClick={form.handleSubmit(onSubmit)}
                    className="shad-button_primary"
                  >
                    Create Account
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="shad-button_primary"
                  >
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
          </div>
        </section>
        <Footer />
      </Form>
    </>
  );
};

export default ParentTalentRegisterForm;

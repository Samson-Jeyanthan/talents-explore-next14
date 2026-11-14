"use client";

import { TransparentLoader } from "@/components/modals";
import { TalentRegisterValidation } from "@/lib/validations/auth.validation";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { TALENT_REG_FORM_DETAILS } from "@/constants";
import {
  AwardsForm,
  CompleteForm,
  EditProInfoForm,
  LangEducationForm,
  SkillsForm,
} from "@/components/forms";
import { Button } from "@/components/ui/button";
import {
  AtomicIcon,
  AwardsIcon,
  GraduationIcon,
  UserIcon,
} from "@/public/assets/svgs";
import { CheckIcon } from "lucide-react";
import { TalentRegisterStatusBar } from "../widgets/navigation";
import { Footer } from "../widgets";
import { Form } from "../ui/form";
import { getSubCategoriesAction } from "@/actions/utils.action";
import { AiOutlineLogout } from "react-icons/ai";
import { INITIAL_USER, useUserContext } from "@/context/AuthProvider";
import { deleteToken, logoutAction } from "@/actions/auth.action";
import { handleClearStorage } from "@/lib/functions/auth.functions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { uploadFileToStorage } from "@/lib/utils/uploadFile";
import { editUserProfessionalInfoAction } from "@/actions/user.action";

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
  const { user, setUser } = useUserContext();
  const [page, setPage] = useState(0);
  const [subCategoryOptions, setSubCategoryOptions] = useState([]);
  const router = useRouter();

  type FormValues = z.infer<typeof TalentRegisterValidation>;

  // fields that belong to each step, in the same order as RegisterForm
  const STEP_FIELDS: (keyof FormValues)[][] = [
    ["bio", "ethnic", "featuredPhotos", "socialLinks"], // step 0
    ["skillSets"], // step 1
    ["languageKnown", "education"], // step 2
    ["awardsOrCertificate"], // step 3
    ["completeForm"], // step 4 (complete)
  ];

  const form = useForm<FormValues>({
    resolver: zodResolver(TalentRegisterValidation),
    mode: "onTouched", // optional: re-validates fields live after the first blur
    defaultValues: {
      bio: "",
      ethnic: "",
      featuredPhotos: [],
      socialLinks: [],
      skillSets: [],
      languageKnown: [],
      education: [],
      awardsOrCertificate: [],
      completeForm: false,
    },
  });

  const handleLogoutClick = async () => {
    await logoutAction(user.currentUserId);
    await deleteToken();
    await handleClearStorage();
    setUser(INITIAL_USER);
    window.location.assign("/sign-in");
  };

  async function fetchSubcategories(mainCategory: string) {
    setSubCategoryOptions([]);
    try {
      const res = await getSubCategoriesAction(mainCategory);
      setSubCategoryOptions(
        (res?.response || []).map((item: any) => ({
          _id: item._id,
          name: item.name,
        }))
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  const RegisterForm = [
    {
      form: (
        <EditProInfoForm
          form={form}
          isTalentRegister={true}
          prevURLs={[]}
          setPrevURLs={() => {}}
        />
      ),
    },
    {
      form: (
        <SkillsForm
          form={form}
          mainCategoryOptions={mainCategoryOptions}
          fetchSubcategories={fetchSubcategories}
          subCategoryOptions={subCategoryOptions}
          page={page}
          isTalentRegister={true}
        />
      ),
    },
    { form: <LangEducationForm form={form} LangOptions={LangOptions} /> },
    { form: <AwardsForm form={form} /> },
    { form: <CompleteForm form={form} /> },
  ];

  const handleNext = async () => {
    const isValid = await form.trigger(STEP_FIELDS[page], {
      shouldFocus: true,
    });
    if (!isValid) return;
    setPage((current) => current + 1);
  };

  const handlePrevious = () => {
    setPage((currentPage) => currentPage - 1);
  };

  const TalentsFormStatus = [
    {
      title: "More Info",
      subTitle: "About Talent",
      icon: <UserIcon />,
      complete: false,
    },
    {
      title: "Skills",
      subTitle: "Abilities Showcase",
      icon: <AtomicIcon />,
      complete: false,
    },
    {
      title: "Education",
      subTitle: "Academic Background",
      icon: <GraduationIcon />,
      complete: false,
    },
    {
      title: "Awards",
      subTitle: "Achievements Highlight",
      icon: <AwardsIcon />,
      complete: false,
    },
    {
      title: "Complete",
      subTitle: "Finalize & Submit",
      icon: <CheckIcon />,
      complete: false,
    },
  ];

  async function onSubmit(values: z.infer<typeof TalentRegisterValidation>) {
    if (!values.completeForm) {
      toast.error("Please agree and continue to create your account", {
        duration: 5000,
      });
      return;
    }

    try {
      const awardsOrCertificate = await Promise.all(
        (values.awardsOrCertificate ?? []).map(async (award) => {
          let certificateUrl: string | undefined;
          let certificateUrlKey: string | undefined;

          // only upload when a new File was actually selected
          if (award.certificate instanceof File) {
            const uploaded = await uploadFileToStorage(
              award.certificate,
              "Certificates",
              user?.username
            );
            certificateUrl = uploaded.url;
            certificateUrlKey = uploaded.key;
          } else if (typeof award.certificate === "string") {
            // already-uploaded URL, keep as is
            certificateUrl = award.certificate;
          }

          return {
            name: award.name,
            givenBy: award.givenBy,
            year: Number(award.year),
            certificateUrl,
            certificateUrlKey,
          };
        })
      );

      const formData = {
        moreInfo: {
          bio: values.bio,
          ethnic: values.ethnic ? values.ethnic : null,
          featuredPhotos: [],
          socialLinks: [],
        },
        skillSets: (values.skillSets ?? []).map((set) => ({
          mainCategoryId: set.mainCategoryId,
          subCategoryId: set.subCategoryId,
          skillsHave: set.skillsHave.map((skill) => ({
            skillId: skill.skillId,
            level: skill.level,
          })),
          description: set.description,
          hashTags: set.hashTags,
        })),
        languageKnown: (values.languageKnown ?? []).map((set) => ({
          languageId: set.languageId,
          level: set.level,
        })),
        education: (values.education ?? []).map((set) => ({
          course: set.course,
          institution: set.institution,
          from: Number(set.from),
          to: Number(set.to),
        })),
        awardsOrCertificate,
      };

      console.log(formData);
      const res = await editUserProfessionalInfoAction(formData);

      if (res?.success) {
        toast.success("Successfully you have created Talent Profile");
        router.push(`/profile/${user.username}/${user.currentUserId}`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload certificates. Please try again.");
    }
  }

  return (
    <>
      {form.formState.isSubmitting && (
        <TransparentLoader text="Creating Talent Profile" />
      )}
      <Form {...form}>
        <div className="flex flex-col items-center justify-center gap-4">
          <section className="flex w-[1300px] max-w-screen-xl flex-col">
            <header className="flex h-28 w-full items-center justify-between gap-5 border-b border-solid border-dark-300">
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
              <div className="flex items-center gap-4">
                <p
                  onClick={() =>
                    router.push(
                      `/profile/${user.username}/${user.currentUserId}`
                    )
                  }
                  className="cursor-pointer text-light-500 hover:text-light-850"
                >
                  Skip
                </p>
                <div
                  className="flex-center cursor-pointer rounded-full border border-light-500 p-2 text-light-500 hover:text-light-850"
                  onClick={handleLogoutClick}
                >
                  <AiOutlineLogout className="text-lg" />
                </div>
              </div>
            </header>

            <div className="flex gap-4">
              <TalentRegisterStatusBar data={TalentsFormStatus} page={page} />
              <div className="flex min-h-[85vh] w-full flex-col">
                {RegisterForm[page].form}
                <footer
                  className={`${page === 0 ? "justify-end" : "justify-between"} flex gap-4`}
                >
                  {page > 0 && (
                    <Button
                      onClick={handlePrevious}
                      className="shad-button_secondary !w-32"
                    >
                      Back
                    </Button>
                  )}
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
                      className="shad-button_primary !w-32"
                    >
                      Next
                    </Button>
                  )}
                </footer>
              </div>
            </div>
          </section>
          <Footer />
        </div>
      </Form>
    </>
  );
};

export default ParentTalentRegisterForm;

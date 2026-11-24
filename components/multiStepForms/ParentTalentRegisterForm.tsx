"use client";

import { TransparentLoader } from "@/components/modals";
import { TalentRegisterValidation } from "@/lib/validations/auth.validation";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState, useRef, useCallback } from "react";
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
import { prepareTalentRegistration } from "@/lib/utils/talent-registration";
import { useProfileAwardWrite as useProfileDetailWrite } from "@/lib/hooks/useProfileAwardWrite";
import { AiOutlineLogout } from "react-icons/ai";
import {
  AUTH_USER_CACHE_KEY,
  INITIAL_USER,
  useUserContext,
} from "@/context/AuthProvider";
import { logoutAction } from "@/actions/auth.action";
import { handleClearStorage } from "@/lib/functions/auth.functions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { uploadFileToStorage, type UploadedFile } from "@/lib/utils/uploadFile";
import { editUserProfessionalInfoAction } from "@/actions/user.action";

interface Props {
  langData: any;
}

function validationMessage(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return;
  if ("message" in error && typeof error.message === "string")
    return error.message;
  for (const [key, value] of Object.entries(error)) {
    if (key === "ref") continue;
    const message = validationMessage(value);
    if (message) return message;
  }
}

const ParentTalentRegisterForm = ({ langData }: Props) => {
  const { user, setUser } = useUserContext();
  const [page, setPage] = useState(0);
  const write = useProfileDetailWrite(user.currentUserId);
  const uploads = useRef(new Map<File, UploadedFile>());
  const nextBusy = useRef(false);
  const [nextPending, setNextPending] = useState(false);
  const [drafts, setDrafts] = useState([false, false, false, false]);
  const report0 = useCallback(
    (value: boolean) =>
      setDrafts((previous) =>
        previous[0] === value
          ? previous
          : previous.map((old, i) => (i === 0 ? value : old)),
      ),
    [],
  );
  const report1 = useCallback(
    (value: boolean) =>
      setDrafts((previous) =>
        previous[1] === value
          ? previous
          : previous.map((old, i) => (i === 1 ? value : old)),
      ),
    [],
  );
  const report2 = useCallback(
    (value: boolean) =>
      setDrafts((previous) =>
        previous[2] === value
          ? previous
          : previous.map((old, i) => (i === 2 ? value : old)),
      ),
    [],
  );
  const report3 = useCallback(
    (value: boolean) =>
      setDrafts((previous) =>
        previous[3] === value
          ? previous
          : previous.map((old, i) => (i === 3 ? value : old)),
      ),
    [],
  );
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
    await handleClearStorage();
    setUser(INITIAL_USER);
    window.location.assign("/sign-in");
  };

  const RegisterForm = [
    {
      form: (
        <EditProInfoForm
          form={form}
          onDraftChange={report0}
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
          onDraftChange={report1}
          page={page}
          isTalentRegister={true}
        />
      ),
    },
    {
      form: (
        <LangEducationForm
          form={form}
          langData={langData}
          onDraftChange={report2}
        />
      ),
    },
    { form: <AwardsForm form={form} onDraftChange={report3} /> },
    { form: <CompleteForm form={form} /> },
  ];

  const handleNext = async () => {
    if (nextBusy.current || write.pending) return;
    if (drafts[page]) {
      write.setError(
        "Add or clear the unfinished entry on this step before continuing.",
      );
      return;
    }
    nextBusy.current = true;
    setNextPending(true);
    write.setError("");
    try {
      const valid = await form.trigger(STEP_FIELDS[page], {
        shouldFocus: true,
      });
      if (valid)
        setPage((current) => Math.min(current + 1, RegisterForm.length - 1));
      else
        write.setError(
          STEP_FIELDS[page]
            .map((field) => validationMessage(form.getFieldState(field).error))
            .find(Boolean) ||
            "Check the details on this step before continuing.",
        );
    } finally {
      nextBusy.current = false;
      setNextPending(false);
    }
  };
  const handlePrevious = () => {
    if (!write.pending && !nextBusy.current) {
      write.setError("");
      setPage((current) => Math.max(0, current - 1));
    }
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

  async function onSubmit(values: FormValues) {
    if (drafts.some(Boolean)) {
      write.setError("Add or clear your unfinished entries before submitting.");
      return;
    }
    if (!values.completeForm) {
      write.setError(
        "Please agree to the terms before creating your talent profile.",
      );
      return;
    }
    await write.run(
      async (active) => {
        try {
          const payload = await prepareTalentRegistration(
            values,
            user.currentUserId,
            uploadFileToStorage,
            uploads.current,
            active,
          );
          if (!active()) return;
          return await editUserProfessionalInfoAction(
            payload,
            user.currentUserId,
            true,
          );
        } catch (error) {
          return {
            status: "400",
            message:
              error instanceof Error
                ? error.message
                : "Unable to create your talent profile. Please try again.",
          };
        }
      },
      () => {
        try {
          sessionStorage.removeItem(AUTH_USER_CACHE_KEY);
        } catch {}
        setUser((previous) =>
          previous.currentUserId === user.currentUserId
            ? { ...previous, isTalent: true }
            : previous,
        );
        toast.success("Your talent profile has been created.");
        router.push(
          `/profile/${encodeURIComponent(user.username)}/${user.currentUserId}`,
        );
        router.refresh();
      },
    );
  }
  const onInvalid = (errors: typeof form.formState.errors) => {
    const target = STEP_FIELDS.findIndex((fields) =>
      fields.some((field) => errors[field]),
    );
    if (target >= 0) setPage(target);
    write.setError(
      validationMessage(errors) ||
        "Check the highlighted fields before creating your talent profile.",
    );
  };

  return (
    <>
      {write.pending && <TransparentLoader text="Creating Talent Profile" />}
      <Form {...form}>
        <div className="flex w-full min-w-0 flex-col items-center justify-center gap-4">
          <fieldset
            disabled={write.pending}
            className="flex w-full min-w-0 max-w-screen-xl flex-col"
          >
            <header className="flex h-28 w-full items-center justify-between gap-5 border-b border-solid border-dark-300">
              {TALENT_REG_FORM_DETAILS.filter((_, index) => index === page).map(
                (item, index) => (
                  <div key={index} className="flex flex-col gap-2">
                    <h1 className="text-3xl font-semibold text-light-900">
                      {item.title}
                    </h1>
                    <p className="text-sm text-light-500">{item.description}</p>
                  </div>
                ),
              )}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/profile/${user.username}/${user.currentUserId}`,
                    )
                  }
                  className="cursor-pointer text-light-500 hover:text-light-850"
                >
                  Skip
                </button>
                <button
                  type="button"
                  aria-label="Sign out"
                  className="flex-center cursor-pointer rounded-full border border-light-500 p-2 text-light-500 hover:text-light-850"
                  onClick={handleLogoutClick}
                >
                  <AiOutlineLogout className="text-lg" />
                </button>
              </div>
            </header>

            <div className="flex gap-4">
              <TalentRegisterStatusBar data={TalentsFormStatus} page={page} />
              <div className="flex min-h-[85vh] w-full min-w-0 flex-col">
                {RegisterForm.map((step, index) => (
                  <div key={index} hidden={page !== index}>
                    {step.form}
                  </div>
                ))}
                {write.error ? (
                  <p
                    role="alert"
                    className="my-3 text-sm text-red-700 dark:text-red-300"
                  >
                    {write.error}
                  </p>
                ) : null}
                <footer
                  className={`${page === 0 ? "justify-end" : "justify-between"} flex gap-4`}
                >
                  {page > 0 && (
                    <Button
                      type="button"
                      disabled={nextPending || write.pending}
                      onClick={handlePrevious}
                      className="shad-button_secondary !w-32"
                    >
                      Back
                    </Button>
                  )}
                  {RegisterForm.length - 1 === page ? (
                    <Button
                      type="submit"
                      disabled={write.pending || form.formState.isSubmitting}
                      onClick={form.handleSubmit(onSubmit, onInvalid)}
                      className="shad-button_primary"
                    >
                      Create Account
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      disabled={nextPending || write.pending}
                      onClick={handleNext}
                      className="shad-button_primary !w-32"
                    >
                      Next
                    </Button>
                  )}
                </footer>
              </div>
            </div>
          </fieldset>
          <Footer />
        </div>
      </Form>
    </>
  );
};

export default ParentTalentRegisterForm;

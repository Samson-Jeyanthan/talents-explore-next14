"use client";

import { Dropdown } from "@/components/inputs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LEVEL_VALUES } from "@/constants";
import useDateSelector from "@/lib/hooks/useDateSelector";
import React, { useState, useEffect } from "react";
import { profileEducationValidation } from "@/lib/utils/profile-education";
import { MdDelete } from "react-icons/md";
import { useProfileOptions } from "@/lib/hooks/useProfileOptions";
import { ProfileOptionsStatus } from "@/components/inputs/ProfileOptionField";

type LanguageSet = {
  languageId: string;
  language: string;
  level: string;
};

type EducationSet = {
  course: string;
  institution: string;
  from: string;
  to: string;
};

const INITIAL_VALUES = {
  course: "",
  institution: "",
  from: "",
  to: "",
};

const LangEducationForm = ({ form, langData, onDraftChange }: any) => {
  const languages = useProfileOptions("language", langData);
  const LangOptions = languages.options;
  const [selectedLangId, setSelectedLangId] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [addedLang, setAddedLang] = useState<LanguageSet[]>(
    form.getValues("languageKnown") || [],
  );
  const [addedEdu, setAddedEdu] = useState<EducationSet[]>(
    form.getValues("education") || [],
  );
  const [eduErr, setEduErr] = useState("");
  const { years } = useDateSelector({});

  const YEARS = years.map((item) => ({
    _id: String(item.id),
    name: item.label,
  }));

  const PRESENT_YEARS = [{ _id: "present", name: "Present" }, ...YEARS];

  // Languages details --------------------------------------------------------

  // Hide languages that were already added
  const availableOptions = LangOptions.filter(
    (opt) => !addedLang.some((item) => item.languageId === opt._id),
  );

  const syncForm = (next: LanguageSet[]) => {
    setAddedLang(next);
    form.setValue("languageKnown", next, { shouldValidate: true });
  };

  const handleLangAddClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!selectedLangId || !selectedLevel || languages.status !== "ready")
      return;

    const option = LangOptions.find((o) => o._id === selectedLangId);
    if (!option) return;

    syncForm([
      ...addedLang,
      { languageId: option._id, language: option.name, level: selectedLevel },
    ]);

    // reset the pickers for the next entry
    setSelectedLangId("");
    setSelectedLevel("");
  };

  const handleLangRemove = (languageId: string) => {
    syncForm(addedLang.filter((item) => item.languageId !== languageId));
  };

  // education details ---------------------------------------------------------

  const [education, setEducation] = useState(INITIAL_VALUES);
  useEffect(() => {
    onDraftChange?.(
      !!(
        selectedLangId ||
        selectedLevel ||
        Object.values(education).some(Boolean)
      ),
    );
  }, [selectedLangId, selectedLevel, education, onDraftChange]);

  const canAddEdu =
    !!education.course?.trim() && !!education.institution?.trim();

  const syncEduForm = (next: EducationSet[]) => {
    setAddedEdu(next);
    form.setValue("education", next, { shouldValidate: true });
  };

  const handleEduAddClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const parsed = profileEducationValidation.safeParse(education);
    if (!parsed.success) {
      setEduErr(parsed.error.issues[0].message);
      return;
    }
    setEduErr("");

    syncEduForm([
      ...addedEdu,
      {
        ...parsed.data,
      },
    ]);

    setEducation(INITIAL_VALUES);
  };

  const handleEduRemove = (index: number) => {
    syncEduForm(addedEdu.filter((_, i) => i !== index));
  };

  return (
    <div className="flex min-h-[90%] flex-col gap-5">
      <h3 className="mt-4 border-b border-dark-400 pb-2 text-lg font-semibold text-light-900">
        Language Details
      </h3>
      <div className="flex flex-col justify-between gap-6 md:flex-row">
        <div className="flex w-full min-w-0 flex-col gap-4 md:w-1/2">
          <Dropdown
            form={form}
            inputName="languagePicker"
            placeholder="Select language"
            options={availableOptions}
            disabled={languages.status !== "ready"}
            value={selectedLangId}
            onValueChange={setSelectedLangId}
          />
          <ProfileOptionsStatus
            kind="language"
            status={languages.status}
            retry={languages.retry}
          />
          <Dropdown
            form={form}
            inputName="levelPicker"
            placeholder="Select level"
            options={LEVEL_VALUES}
            value={selectedLevel}
            onValueChange={setSelectedLevel}
          />

          <p className="text-sm text-light-850">
            Click Add Language to add this entry before selecting Next.
          </p>
          <div className="flex w-full flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={handleLangAddClick}
              disabled={
                !selectedLangId ||
                !selectedLevel ||
                languages.status !== "ready"
              }
              className="shad-button_primary !h-auto min-h-11 flex-1 !whitespace-normal font-semibold !text-white"
            >
              Add Language
            </Button>
            <button
              type="button"
              aria-label="Clear language entry"
              disabled={!selectedLangId && !selectedLevel}
              onClick={() => {
                setSelectedLangId("");
                setSelectedLevel("");
              }}
              className="min-h-11 px-2 text-sm text-light-850 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="flex w-full min-w-0 flex-col gap-2 md:w-2/5">
          {addedLang.map((item) => (
            <article
              className="flex items-center justify-between rounded-md bg-dark-300 p-3 text-sm text-light-850"
              key={item.languageId}
            >
              <p>
                {item.language} - {item.level}
              </p>

              <button
                type="button"
                aria-label={`Remove ${item.language}`}
                className="cursor-pointer text-lg text-light-900"
                onClick={() => handleLangRemove(item.languageId)}
              >
                <MdDelete />
              </button>
            </article>
          ))}
        </div>
      </div>

      <h3 className="border-b border-dark-400 pb-2 text-lg font-semibold text-light-900">
        Education Details
      </h3>
      <div className="flex flex-col justify-between gap-6 md:flex-row">
        <div className="flex w-full min-w-0 flex-col gap-5 md:w-1/2">
          <Input
            value={education.course}
            onChange={(e) => {
              setEducation({
                ...education,
                course: e.target.value,
              });
            }}
            placeholder="Course Name"
            className="shad-auth_form_input"
          />
          <Input
            value={education.institution}
            onChange={(e) => {
              setEducation({
                ...education,
                institution: e.target.value,
              });
            }}
            placeholder="Institution Name"
            className="shad-auth_form_input"
          />
          <div className="mt-2 flex flex-col gap-1">
            <div className="flex gap-2">
              <Dropdown
                form={form}
                value={education.from}
                inputName="from"
                placeholder="From"
                options={YEARS}
                isModal={true}
                onValueChange={(val) =>
                  setEducation({
                    ...education,
                    from: String(val),
                  })
                }
              />
              <Dropdown
                form={form}
                value={education.to}
                inputName="to"
                placeholder="To"
                options={PRESENT_YEARS}
                isModal={true}
                onValueChange={(val) =>
                  setEducation({
                    ...education,
                    to: String(val),
                  })
                }
              />
            </div>
          </div>
          {eduErr && (
            <p role="alert" className="-mt-2 text-sm text-custom-100">
              {eduErr}
            </p>
          )}
          <p className="text-sm text-light-850">
            Click Add Education to add this entry before selecting Next.
          </p>
          <div className="flex w-full flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={handleEduAddClick}
              disabled={!canAddEdu}
              className="shad-button_primary !h-auto min-h-11 flex-1 !whitespace-normal font-semibold !text-white"
            >
              Add Education
            </Button>
            <button
              type="button"
              aria-label="Clear education entry"
              disabled={!Object.values(education).some(Boolean)}
              onClick={() => {
                setEducation(INITIAL_VALUES);
                setEduErr("");
              }}
              className="min-h-11 px-2 text-sm text-light-850 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="flex w-full min-w-0 flex-col gap-2 md:w-2/5">
          {addedEdu.map((item, index) => (
            <article
              className="flex items-center justify-between gap-4 rounded-md bg-dark-300 p-3 text-light-850"
              key={index}
            >
              <div className="flex flex-col gap-2">
                <p className="font-medium">{item.course}</p>
                <p className="text-sm text-light-500">{item.institution}</p>
                <p className="text-sm text-light-500">
                  {item.from} - {item.to === "present" ? "Present" : item.to}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Remove ${item.course}`}
                className="cursor-pointer text-lg text-light-900"
                onClick={() => handleEduRemove(index)}
              >
                <MdDelete />
              </button>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LangEducationForm;

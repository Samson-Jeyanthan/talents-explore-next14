"use client";

import { Dropdown } from "@/components/inputs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LEVEL_VALUES } from "@/constants";
import useDateSelector from "@/lib/hooks/useDateSelector";
import React, { useState } from "react";
import { MdDelete } from "react-icons/md";

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

type LangOption = { _id: string; name: string };

const LangEducationForm = ({ form, LangOptions }: any) => {
  const [selectedLangId, setSelectedLangId] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [addedLang, setAddedLang] = useState<LanguageSet[]>(
    form.getValues("languageKnown") || []
  );
  const [addedEdu, setAddedEdu] = useState<EducationSet[]>(
    form.getValues("education") || []
  );
  const [eduErr, setEduErr] = useState("");
  const { years, presentAddedYears } = useDateSelector({});

  const YEARS = years.map((item) => ({
    _id: item.id,
    name: item.label,
  }));

  const PRESENT_YEARS = presentAddedYears.map((item) => ({
    _id: item.id,
    name: item.label === 0 ? "Present" : item.label,
  }));

  // Languages details --------------------------------------------------------

  // Hide languages that were already added
  const availableOptions = (LangOptions as LangOption[]).filter(
    (opt) => !addedLang.some((item) => item.languageId === opt._id)
  );

  const syncForm = (next: LanguageSet[]) => {
    setAddedLang(next);
    form.setValue("languageKnown", next, { shouldValidate: true });
  };

  const handleLangAddClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!selectedLangId || !selectedLevel) return;

    const option = (LangOptions as LangOption[]).find(
      (o) => o._id === selectedLangId
    );
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

  const yearRangeInvalid =
    Number(education.from) <= Number(education.to) ||
    (Number(education.from) && education.to === "Present");

  const canAddEdu =
    !!education.course?.trim() && !!education.institution?.trim();

  const syncEduForm = (next: EducationSet[]) => {
    setAddedEdu(next);
    form.setValue("education", next, { shouldValidate: true });
  };

  const handleEduAddClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log(education);
    e.preventDefault();
    if (!canAddEdu) {
      setEduErr("Please enter both your course name and institution name.");
      return;
    } else if (!yearRangeInvalid) {
      setEduErr("The end year can't be earlier than the start year.");
      return;
    } else {
      setEduErr("");
    }

    syncEduForm([
      ...addedEdu,
      {
        course: education.course.trim(),
        institution: education.institution.trim(),
        from: education.from,
        to: education.to,
      },
    ]);

    setEducation(INITIAL_VALUES);
  };

  const handleEduRemove = (index: number) => {
    syncEduForm(addedEdu.filter((_, i) => i !== index));
  };

  return (
    <form className="flex min-h-[90%] flex-col gap-5">
      <h3 className="mt-4 border-b border-dark-400 pb-2 text-lg font-semibold text-white">
        Language Details
      </h3>
      <div className="flex justify-between gap-6">
        <div className="flex w-1/2 flex-col gap-4">
          <Dropdown
            form={form}
            inputName="languagePicker"
            placeholder="Select language"
            options={availableOptions}
            value={selectedLangId}
            onValueChange={setSelectedLangId}
          />
          <Dropdown
            form={form}
            inputName="levelPicker"
            placeholder="Select level"
            options={LEVEL_VALUES}
            value={selectedLevel}
            onValueChange={setSelectedLevel}
          />

          <div className="flex w-full justify-end">
            <Button
              type="button"
              onClick={handleLangAddClick}
              disabled={!selectedLangId || !selectedLevel}
              className="shad-button_secondary !w-32 !text-custom-100"
            >
              Add Language
            </Button>
          </div>
        </div>

        <div className="flex w-2/5 flex-col gap-2">
          {addedLang.map((item) => (
            <article
              className="flex items-center justify-between rounded-md bg-dark-300 p-3 text-sm text-light-850"
              key={item.languageId}
            >
              <p>
                {item.language} - {item.level}
              </p>

              <span
                className="cursor-pointer text-lg text-white"
                onClick={() => handleLangRemove(item.languageId)}
              >
                <MdDelete />
              </span>
            </article>
          ))}
        </div>
      </div>

      <h3 className="border-b border-dark-400 pb-2 text-lg font-semibold text-white">
        Education Details
      </h3>
      <div className="flex justify-between gap-6">
        <div className="flex w-1/2 flex-col gap-5">
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
          {eduErr && <p className="-mt-2 text-sm text-custom-100">{eduErr}</p>}
          <div className="flex w-full justify-end">
            <Button
              type="button"
              onClick={handleEduAddClick}
              disabled={!canAddEdu}
              className="shad-button_secondary !w-32 !text-custom-100"
            >
              Add Education
            </Button>
          </div>
        </div>

        <div className="flex w-2/5 flex-col gap-2">
          {addedEdu.map((item, index) => (
            <article
              className="flex items-center justify-between gap-4 rounded-md bg-dark-300 p-3 text-light-850"
              key={index}
            >
              <div className="flex flex-col gap-2">
                <p className="font-medium">{item.course}</p>
                <p className="text-sm text-light-500">{item.institution}</p>
                <p className="text-sm text-light-500">
                  {item.from} - {item.to}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Remove ${item.course}`}
                className="cursor-pointer text-lg text-white"
                onClick={() => handleEduRemove(index)}
              >
                <MdDelete />
              </button>
            </article>
          ))}
        </div>
      </div>
    </form>
  );
};

export default LangEducationForm;

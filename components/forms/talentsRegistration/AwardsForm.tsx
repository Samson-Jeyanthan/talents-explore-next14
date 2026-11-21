"use client";

import React, { useState, useEffect } from "react";
import { registrationAwardValidation } from "@/lib/utils/talent-registration";
import { CertificateInput, Dropdown } from "@/components/inputs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useDateSelector from "@/lib/hooks/useDateSelector";
import { MdDelete } from "react-icons/md";
import Image from "next/image";

type AwardSet = {
  name: string;
  givenBy: string;
  year: string;
  certificate: File | string | null | undefined;
};

const INITIAL_VALUES: AwardSet = {
  name: "",
  givenBy: "",
  year: "",
  certificate: undefined,
};

const AwardsForm = ({ form, onDraftChange }: any) => {
  const [award, setAward] = useState(INITIAL_VALUES);
  const [error, setError] = useState("");
  useEffect(() => {
    onDraftChange?.(
      !!(award.name || award.givenBy || award.year || award.certificate),
    );
  }, [award, onDraftChange]);
  const [addedAward, setAddedAward] = useState<AwardSet[]>(
    form.getValues("awardsOrCertificate") || [],
  );
  const { years } = useDateSelector({});

  const YEARS = years.map((item) => ({
    _id: String(item.id),
    name: item.label,
  }));

  const syncForm = (next: AwardSet[]) => {
    setAddedAward(next);
    form.setValue("awardsOrCertificate", next, { shouldValidate: true });
  };

  const handleAddClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const parsed = registrationAwardValidation.safeParse(award);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setError("");

    syncForm([
      ...addedAward,
      {
        name: award.name.trim(),
        givenBy: award.givenBy.trim(),
        year: award.year,
        certificate: award.certificate,
      },
    ]);

    setAward(INITIAL_VALUES);
  };

  const handleRemove = (index: number) => {
    syncForm(addedAward.filter((_, i) => i !== index));
  };

  return (
    <div className="mt-4 flex min-h-[90%] flex-col justify-between gap-6 md:flex-row">
      <div className="flex w-full min-w-0 flex-col gap-4 md:w-1/2">
        <CertificateInput
          fieldChange={(val: any) =>
            setAward({
              ...award,
              certificate: val,
            })
          }
          values={award.certificate}
        />
        <Input
          value={award.name}
          onChange={(e) => {
            setAward({
              ...award,
              name: e.target.value,
            });
          }}
          placeholder="Award / Certificate Name"
          className="shad-auth_form_input"
        />
        <Input
          value={award.givenBy}
          onChange={(e) => {
            setAward({
              ...award,
              givenBy: e.target.value,
            });
          }}
          placeholder="Given by - Authority Name"
          className="shad-auth_form_input mb-2"
        />
        <Dropdown
          form={form}
          value={award.year}
          inputName="year"
          placeholder="Given Year"
          options={YEARS}
          isModal={true}
          onValueChange={(val) =>
            setAward({
              ...award,
              year: String(val),
            })
          }
        />
        <div className="flex w-full justify-end">
          {error ? (
            <p role="alert" className="text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          ) : null}
          {award.name || award.givenBy || award.year || award.certificate ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setAward(INITIAL_VALUES);
                setError("");
              }}
            >
              Clear
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={handleAddClick}
            disabled={!award.name || !award.givenBy}
            className="shad-button_secondary !w-auto !text-custom-100"
          >
            Add Award / Certificate
          </Button>
        </div>
      </div>
      <div className="flex w-full min-w-0 flex-col gap-2 md:w-2/5">
        {addedAward.map((item, index) => {
          const cert = item.certificate;
          const certName = typeof cert === "string" ? cert : cert?.name;
          const isPdf =
            typeof cert === "string"
              ? cert.toLowerCase().endsWith(".pdf")
              : cert?.type === "application/pdf";
          return (
            <article
              className="relative flex items-center justify-between gap-4 rounded-md bg-dark-300 p-3 text-light-850"
              key={index}
            >
              <div className="flex flex-col gap-2">
                {cert && (
                  <div className="flex items-center gap-2">
                    <Image
                      src={
                        isPdf
                          ? "/assets/images/pdf.png"
                          : "/assets/images/image.png"
                      }
                      width={512}
                      height={512}
                      alt={isPdf ? "PDF file" : "Image file"}
                      className="h-10 w-auto shrink-0 bg-transparent object-cover"
                    />
                    <p className="max-w-64 truncate text-sm text-light-500">
                      {certName}
                    </p>
                  </div>
                )}
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-light-500">{item.givenBy}</p>
                <p className="text-sm text-light-500">{item.year}</p>
              </div>
              <button
                type="button"
                aria-label={`Remove ${item.name}`}
                className="absolute right-3 top-3 cursor-pointer text-lg text-light-900"
                onClick={() => handleRemove(index)}
              >
                <MdDelete />
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default AwardsForm;

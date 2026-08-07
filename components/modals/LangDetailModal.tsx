"use client";

import { useEffect, useState } from "react";
import { ILanguage } from "@/types/profile.types";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Form } from "../ui/form";
import { Dropdown } from "../inputs";
import { LEVEL_VALUES } from "@/constants";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { languageValidation } from "@/lib/validations/profile.validation";
import { MdClose } from "react-icons/md";
import { getLanguagesAction } from "@/actions/utils.action";
import { z } from "zod";
import { Button } from "../ui/button";

type Prop = {
  isEdit: boolean;
  isOpen: boolean;
  onClose: () => void;
  data?: ILanguage;
  selectedIndex?: number;
};

type LangDataOption = { _id: string; name: string };

const LangDetailModal = ({
  isEdit,
  isOpen,
  onClose,
  data,
  selectedIndex,
}: Prop) => {
  // const [open, setOpen] = useState(false);
  const [langDataOptions, setLangDataOptions] = useState<LangDataOption[]>([]);

  async function fetchLangData() {
    const data = await getLanguagesAction();
    const options: LangDataOption[] = data.response.map((item: any) => ({
      _id: item._id,
      name: item.language,
    }));
    setLangDataOptions(options);
  }

  useEffect(() => {
    fetchLangData();
  }, [isOpen]);

  async function fetchUserLangData() {
    const data = await getLanguagesAction();
    const options: LangDataOption[] = data.response.map((item: any) => ({
      _id: item._id,
      name: item.language,
    }));
    setLangDataOptions(options);
  }

  useEffect(() => {
    fetchUserLangData();
  }, [isEdit]);

  const form = useForm<z.infer<typeof languageValidation>>({
    resolver: zodResolver(languageValidation),
    defaultValues: {
      languageId: data?.languageName || "",
      languageName: data?._id || "",
      languageLevel: data?.level || "",
    },
  });

  async function onSubmit(values: z.infer<typeof languageValidation>) {
    const formData = {
      languageId: values.languageName,
      level: values.languageLevel,
    };
    console.log(formData, data);
  }

  return (
    <Dialog open={isOpen}>
      {!isEdit && (
        <DialogTrigger className="cursor-pointer text-xs text-custom-100">
          Add +
        </DialogTrigger>
      )}
      <DialogContent
        className="modal-content-container"
        aria-describedby={undefined}
        onFocus={() => {}}
      >
        <DialogTitle className="text-light-900">
          {isEdit ? "Edit" : "Add"} Language{" "}
        </DialogTitle>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-2"
          >
            <Dropdown
              form={form}
              value={form.getValues("languageName")}
              inputName="languageName"
              placeholder="Select your known language"
              options={langDataOptions?.length > 0 ? langDataOptions : []}
              isModal={true}
            />
            <Dropdown
              form={form}
              value={form.getValues("languageLevel")}
              inputName="languageLevel"
              placeholder="Select language level"
              options={LEVEL_VALUES}
              isModal={true}
            />

            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="shad-button_primary mt-4"
            >
              {form.formState.isSubmitting ? "Adding..." : "Add"}
            </Button>
          </form>
        </Form>
        <DialogClose
          className="absolute -right-8 -top-8 cursor-pointer rounded-full bg-dark-400 p-[6px] text-light-900 focus:outline-none"
          onClick={onClose}
        >
          <MdClose className="text-2xl" />
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

export default LangDetailModal;

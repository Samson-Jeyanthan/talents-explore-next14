"use client";

import { Dialog, DialogClose, DialogContent, DialogTitle } from "../ui/dialog";
import { z } from "zod";
import { MdClose } from "react-icons/md";
import { TProfessionalDetailName } from "@/types/utils.types";
import { useEffect, useState } from "react";
import {
  IAwardsOrCertificate,
  IEducation,
  ILanguage,
} from "@/types/profile.types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  awardValidation,
  educationValidation,
  languageValidation,
} from "@/lib/validations/profile.validation";
import { Form } from "../ui/form";
import { getLanguagesAction } from "@/actions/utils.action";
import {
  editUserEducationInfoAction,
  editUserLanguageInfoAction,
} from "@/actions/user.action";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { AwardEditForm, EductionEditForm, LanguageEditForm } from "../forms";

type Prop = {
  isEdit: boolean;
  detailModalFor: TProfessionalDetailName;
  isOpen: boolean;
  onClick?: () => void;
  data?: IEducation | ILanguage | IAwardsOrCertificate | any;
  dataArray?: IEducation[] | ILanguage[] | IAwardsOrCertificate[] | any[];
  selectedIndex: number;
};

const ProDetailsModal = ({
  isEdit,
  detailModalFor,
  isOpen,
  onClick,
  data,
  dataArray,
  selectedIndex,
}: Prop) => {
  const pathName = usePathname();

  // get the modal title
  const getTitle = () => {
    switch (detailModalFor) {
      case "language":
        return "Add Language Detail";
      case "education":
        return "Add Education Detail";
      case "award":
        return "Add Award Detail";
      case "languageEdit":
        return "Edit Language Detail";
      case "educationEdit":
        return "Edit Education Detail";
      case "awardEdit":
        return "Edit Award Detail";
      default:
        return "";
    }
  };

  const languageForm = useForm<z.infer<typeof languageValidation>>({
    resolver: zodResolver(languageValidation),
    defaultValues: {
      languageId: data?.languageId || "",
      languageName: data?.languageName || "",
      languageLevel: data?.level || "",
    },
  });

  const educationForm = useForm<z.infer<typeof educationValidation>>({
    resolver: zodResolver(educationValidation),
    defaultValues: {
      course: data?.course || "",
      institution: data?.institution || "",
      from: String(data?.from) || "",
      to: String(data?.to) || "",
    },
  });

  const awardForm = useForm<z.infer<typeof awardValidation>>({
    resolver: zodResolver(awardValidation),
    defaultValues: {
      name: data?.name || "",
      givenBy: data?.givenBy || "",
      year: String(data?.year) || "",
      certificate: undefined,
    },
  });

  const handleClose = () => {
    languageForm.reset();
    educationForm.reset();
    awardForm.reset();
    onClick?.();
  };

  // language related data and form initialization
  const [langData, setLangData] = useState<{ _id: string; name: string }[]>([]);

  async function fetchLangData() {
    const data = await getLanguagesAction();

    const langOptions = data?.response?.map((item: any) => ({
      _id: item._id,
      name: item.language,
    }));

    setLangData(langOptions ?? []);
  }

  useEffect(() => {
    if (
      isOpen &&
      (detailModalFor === "language" || detailModalFor === "languageEdit")
    ) {
      fetchLangData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailModalFor, isOpen]);

  // Language submit
  async function handleLanguageSubmit(
    values: z.infer<typeof languageValidation>
  ) {
    const existingLanguages = dataArray ?? [];
    const formData = {
      languageId: values.languageName,
      level: values.languageLevel,
    };

    const updatedLanguages = isEdit
      ? existingLanguages.map((lang: ILanguage) =>
          lang._id === data?._id ? { ...lang, ...formData } : lang
        )
      : [...existingLanguages, formData];

    const response = await editUserLanguageInfoAction({
      formData: updatedLanguages,
      path: pathName,
    });

    if (response?.status === "7400") {
      toast.success(`Language ${isEdit ? "Updated" : "Added"} Successfully`, {
        duration: 5000,
      });
      languageForm.reset();
      onClick?.();
    } else {
      toast.error("Something went wrong, please try again", {
        duration: 5000,
      });
    }
  }

  // Education submit
  async function handleEducationSubmit(
    values: z.infer<typeof educationValidation>
  ) {
    const existingEducations = dataArray ?? [];
    const formData = {
      course: values.course,
      institution: values.institution,
      from: values.from,
      to: values.to,
    };

    const updatedEducations = isEdit
      ? existingEducations.map((lang: IEducation) =>
          lang._id === data?._id ? { ...lang, ...formData } : lang
        )
      : [...existingEducations, formData];

    const response = await editUserEducationInfoAction({
      formData: updatedEducations,
      path: pathName,
    });

    if (response?.status === "7400") {
      toast.success(`Education ${isEdit ? "Updated" : "Added"} Successfully`, {
        duration: 5000,
      });
      educationForm.reset();
      onClick?.();
    } else {
      toast.error("Something went wrong, please try again", {
        duration: 5000,
      });
    }
  }

  // Award submit
  async function handleAwardSubmit(values: z.infer<typeof awardValidation>) {
    const existingAwards = dataArray ?? [];
    const formData = {
      name: values.name,
      givenBy: values.givenBy,
      year: values.year,
      cretificateUrl: "",
      certificateUrlKey: "",
    };

    console.log(formData, existingAwards, "values.certificate");
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="modal-content-container"
        aria-describedby={undefined}
        onFocus={() => {}}
      >
        <DialogTitle className="mb-2 border-b border-dark-400 pb-2 text-center text-light-900">
          {getTitle()}
        </DialogTitle>

        {(detailModalFor === "language" ||
          detailModalFor === "languageEdit") && (
          <Form {...languageForm}>
            <LanguageEditForm
              isEdit={detailModalFor === "languageEdit"}
              form={languageForm}
              options={langData}
              onSubmit={handleLanguageSubmit}
            />
          </Form>
        )}

        {(detailModalFor === "education" ||
          detailModalFor === "educationEdit") && (
          <Form {...educationForm}>
            <EductionEditForm
              isEdit={detailModalFor === "educationEdit"}
              form={educationForm}
              onSubmit={handleEducationSubmit}
            />
          </Form>
        )}

        {(detailModalFor === "award" || detailModalFor === "awardEdit") && (
          <Form {...awardForm}>
            <AwardEditForm
              isEdit={detailModalFor === "awardEdit"}
              form={awardForm}
              onSubmit={handleAwardSubmit}
            />
          </Form>
        )}

        <DialogClose
          className="absolute -right-8 -top-8 cursor-pointer rounded-full bg-dark-400 p-[6px] text-light-900 focus:outline-none"
          onClick={handleClose}
        >
          <MdClose className="text-2xl" />
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

export default ProDetailsModal;

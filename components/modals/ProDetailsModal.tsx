"use client";

import ProfileEducationEditor from "@/components/widgets/profile/ProfileEducationEditor";
import ProfileAwardEditor from "@/components/widgets/profile/ProfileAwardEditor";
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
import { languageValidation } from "@/lib/validations/profile.validation";
import { Form } from "../ui/form";
import { getLanguagesAction } from "@/actions/utils.action";
import { editUserLanguageInfoAction } from "@/actions/user.action";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { LanguageEditForm } from "../forms";

type Prop = {
  isEdit: boolean;
  detailModalFor: TProfessionalDetailName;
  isOpen: boolean;
  onClick?: () => void;
  data?: IEducation | ILanguage | IAwardsOrCertificate | any;
  dataArray?: IEducation[] | ILanguage[] | IAwardsOrCertificate[] | any[];
  selectedIndex: number;
};

const ProfessionalDetailsModal = ({
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

  const handleClose = () => {
    languageForm.reset();
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
    values: z.infer<typeof languageValidation>,
  ) {
    const existingLanguages = dataArray ?? [];
    const formData = {
      languageId: values.languageName,
      level: values.languageLevel,
    };

    const updatedLanguages = isEdit
      ? existingLanguages.map((lang: ILanguage) =>
          lang._id === data?._id ? { ...lang, ...formData } : lang,
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

export default function ProDetailsModal(props: Prop) {
  if (
    props.detailModalFor === "education" ||
    props.detailModalFor === "educationEdit"
  )
    return (
      <ProfileEducationEditor
        isOpen={props.isOpen}
        isEdit={props.isEdit}
        data={props.data}
        onClose={() => props.onClick?.()}
      />
    );
  if (props.detailModalFor === "award" || props.detailModalFor === "awardEdit")
    return (
      <ProfileAwardEditor
        isOpen={props.isOpen}
        isEdit={props.isEdit}
        data={props.data}
        onClose={() => props.onClick?.()}
      />
    );
  return <ProfessionalDetailsModal {...props} />;
}

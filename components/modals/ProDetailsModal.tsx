"use client";

import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogTitle,
} from "../ui/dialog";
import { z } from "zod";
import { MdClose } from "react-icons/md";
import { TProfessionalDetailName } from "@/types/utils.types";
import { useEffect, useState } from "react";
import { IEducation } from "@/types/profile.types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { languageValidation } from "@/lib/validations/profile.validation";
import { Form } from "../ui/form";
import { Dropdown } from "../inputs";
import { getLanguagesAction } from "@/actions/utils.action";
import { LEVEL_VALUES } from "@/constants";

type Prop = {
  isEdit: boolean;
  detailModalFor: TProfessionalDetailName;
  onClick: () => void;
  dataArray: IEducation[] | any[];
  selectedIndex: number;
};

const ProDetailsModal = ({
  isEdit,
  detailModalFor,
  onClick,
  dataArray,
  selectedIndex,
}: Prop) => {
  // education
  // courseName: dataArray[selectedIndex]?.course || "",
  // institutionName: dataArray[selectedIndex]?.institution || "",
  // educationFrom: dataArray[selectedIndex]?.from || "",
  // educationTo: dataArray[selectedIndex]?.to || "",
  // award
  // awardName: dataArray[selectedIndex]?.name || "",
  // awardGivenBy: dataArray[selectedIndex]?.givenBy || "",
  // awardDate: dataArray[selectedIndex]?.year || "",

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

  // language related data and form initialization
  const [langData, setLangData] = useState<{ _id: string; name: string }[]>([]);

  async function fetchLangData() {
    const data = await getLanguagesAction();
    setLangData(data);
  }

  useEffect(() => {
    fetchLangData();
  }, []);

  const languageForm = useForm<z.infer<typeof languageValidation>>({
    resolver: zodResolver(languageValidation),
    defaultValues: {
      languageId: dataArray[selectedIndex]?.languageId || "",
      languageName: dataArray[selectedIndex]?.languageName || "",
      languageLevel: dataArray[selectedIndex]?.level || "",
    },
  });

  return (
    <>
      <DialogOverlay />
      <DialogContent
        className="modal-content-container"
        aria-describedby={undefined}
        onFocus={() => {}}
      >
        <DialogTitle className="text-light-900">{getTitle()}</DialogTitle>

        {detailModalFor === "language" && (
          <Form {...languageForm}>
            <form className="flex flex-col gap-2">
              <Dropdown
                form={languageForm}
                value={languageForm.getValues("languageName")}
                inputName="languageName"
                placeholder="Select your known language"
                options={langData.length > 0 ? langData : []}
                isModal={true}
              />
              <Dropdown
                form={languageForm}
                value={languageForm.getValues("languageLevel")}
                inputName="languageLevel"
                placeholder="Select language level"
                options={LEVEL_VALUES}
                isModal={true}
              />
            </form>
          </Form>
        )}
        <DialogClose
          className="absolute -right-8 -top-8 cursor-pointer rounded-full bg-dark-400 p-[6px] text-light-900 focus:outline-none"
          onClick={onClick}
        >
          <MdClose className="text-2xl" />
        </DialogClose>
      </DialogContent>
    </>
  );
};

export default ProDetailsModal;

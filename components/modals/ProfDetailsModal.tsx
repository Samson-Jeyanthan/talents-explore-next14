import { cn } from "@/lib/utils";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogTitle,
} from "../ui/dialog";
import { MdClose } from "react-icons/md";
import { TProfessionalDetailName } from "@/types/utils.types";
import { useState } from "react";
import { FormInput } from "../inputs";
import { IEducation } from "@/types/profile.types";

type Prop = {
  isEdit: boolean;
  detailModalFor: TProfessionalDetailName;
  onClick: () => void;
  dataArray: IEducation[] | any[];
  selectedIndex: number;
};

const ProfDetailsModal = ({
  isEdit,
  detailModalFor,
  onClick,
  dataArray,
  selectedIndex,
}: Prop) => {
  const [values, setValues] = useState({
    // education
    courseName: (dataArray && dataArray[selectedIndex].course) || "",
    institutionName: (dataArray && dataArray[selectedIndex].institution) || "",
    educationFrom: (dataArray && dataArray[selectedIndex].from) || "",
    educationTo: (dataArray && dataArray[selectedIndex].to) || "",
    // award
    awardName: (dataArray && dataArray[selectedIndex].name) || "",
    awardGivenBy: (dataArray && dataArray[selectedIndex].givenBy) || "",
    awardDate: (dataArray && dataArray[selectedIndex].year) || "",
    // language
    languageId: (dataArray && dataArray[selectedIndex].languageId) || "",
    languageName: (dataArray && dataArray[selectedIndex].languageName) || "",
    languageLevel: (dataArray && dataArray[selectedIndex].level) || "",
  });

  const getTitle = () => {
    switch (detailModalFor) {
      case "education":
        return "Add Education Detail";
      case "award":
        return "Add Award Detail";
      case "language":
        return "Add Language Detail";
      case "educationEdit":
        return "Edit Education Detail";
      case "awardEdit":
        return "Edit Award Detail";
      case "languageEdit":
        return "Edit Language Detail";
      default:
        return "";
    }
  };
  return (
    <>
      <DialogOverlay className={cn("bg-black/10 backdrop-blur-sm")} />
      <DialogContent className="flex rounded-xl border-none">
        <DialogTitle className="text-light-900">{getTitle()}</DialogTitle>
        <DialogDescription className="text-light-900">
          {values.courseName}
          {values.institutionName}
          {values.educationFrom}
          {values.educationTo}
          {dataArray[selectedIndex].courseName}
        </DialogDescription>
        <DialogClose
          className="absolute -right-3 -top-3 cursor-pointer rounded-full bg-dark-400 p-[6px] text-light-900 focus:outline-none"
          onClick={onClick}
        >
          <MdClose className="text-2xl" />
        </DialogClose>
      </DialogContent>
    </>
  );
};

export default ProfDetailsModal;

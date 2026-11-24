"use client";

import ProfileEducationEditor from "@/components/widgets/profile/ProfileEducationEditor";
import ProfileAwardEditor from "@/components/widgets/profile/ProfileAwardEditor";
import ProfileLanguageEditor from "@/components/widgets/profile/ProfileLanguageEditor";
import type { TProfessionalDetailName } from "@/types/utils.types";
import type {
  IAwardsOrCertificate,
  IEducation,
  ILanguage,
} from "@/types/profile.types";

type Prop = {
  isEdit: boolean;
  detailModalFor: TProfessionalDetailName;
  isOpen: boolean;
  onClick?: () => void;
  data?: IEducation | ILanguage | IAwardsOrCertificate | any;
  dataArray?: IEducation[] | ILanguage[] | IAwardsOrCertificate[] | any[];
  selectedIndex: number;
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
  if (
    props.isOpen &&
    (props.detailModalFor === "language" ||
      props.detailModalFor === "languageEdit")
  )
    return (
      <ProfileLanguageEditor
        isOpen={props.isOpen}
        isEdit={props.detailModalFor === "languageEdit"}
        data={props.data}
        onClose={() => props.onClick?.()}
      />
    );
  return null;
}

"use client";

import ProfileEducationDeleteDialog from "@/components/widgets/profile/ProfileEducationDeleteDialog";
import ProfileAwardDeleteDialog from "@/components/widgets/profile/ProfileAwardDeleteDialog";
import ProfileLanguageDeleteDialog from "@/components/widgets/profile/ProfileLanguageDeleteDialog";

type Props = {
  isOpen: boolean;
  modalFor: "language" | "education" | "award";
  onCancel: () => void;
  data?: any;
  dataArray?: any[];
  selectedIndex?: number;
};
export default function ProInfoDeleteAlert(props: Props) {
  if (props.modalFor === "education")
    return (
      <ProfileEducationDeleteDialog
        isOpen={props.isOpen}
        onClose={props.onCancel}
        data={props.data}
      />
    );
  if (props.modalFor === "award")
    return (
      <ProfileAwardDeleteDialog
        isOpen={props.isOpen}
        onClose={props.onCancel}
        data={props.data}
      />
    );
  return (
    <ProfileLanguageDeleteDialog
      isOpen={props.isOpen}
      onClose={props.onCancel}
      data={props.data}
    />
  );
}

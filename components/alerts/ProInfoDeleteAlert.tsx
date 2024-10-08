"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Props = {
  isOpen: boolean;
  modalFor: "language" | "education" | "award";
  onCancel: () => void;
};

const ProInfoDeleteAlert = ({ isOpen, modalFor, onCancel }: Props) => {
  const getTitle = () => {
    switch (modalFor) {
      case "language":
        return "Delete Language Detail";
      case "education":
        return "Delete Education Detail";
      case "award":
        return "Delete Award Detail";
      default:
        return "";
    }
  };

  const handleInfoDelete = () => {};

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogOverlay />
      <AlertDialogContent className="flex flex-col gap-6 rounded-2xl border-none bg-dark-250 p-4 text-light-850">
        <AlertDialogHeader>
          <AlertDialogTitle>{getTitle()}</AlertDialogTitle>
          <AlertDialogDescription>
            You will permanently delete this info. Are you sure you want to
            delete this {modalFor} detail?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onCancel}
            className="rounded-full border-none bg-none text-light-900 hover:bg-dark-400"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="shad-btn_primary-200"
            onClick={handleInfoDelete}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ProInfoDeleteAlert;
